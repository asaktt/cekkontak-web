// ── In-Memory Order / Payment Store ─────────────────────────────────────────
// Stores pending & completed payment orders.
// NOTE: In-memory resets on cold start.
// Resilience: status route also queries AutoGoPay API directly as fallback.

import crypto from "crypto";

export type OrderStatus = "pending" | "completed" | "expired";

export interface Order {
  orderId: string;
  phone: string;
  amount: number;
  status: OrderStatus;
  qrisUrl: string | null;
  pg_txid: string | null;  // Payment gateway transaction/order ID (e.g. ShopeePay order_sn)
  createdAt: string;
  completedAt: string | null;
  searchToken: string | null;
}

const orderStore = new Map<string, Order>();

// Secondary index: pg transaction ID → orderId (for webhook lookup)
const pgTxMap = new Map<string, string>();

const ORDER_TTL_MS = 60 * 60 * 1000; // 1 hour

// ── Create ───────────────────────────────────────────────────────────────────
// IMPORTANT: phone is encoded in orderId so status endpoint can recover it
// after a cold start without needing the in-memory store.
// Format: CK-<timestamp>-<phone_b64>-<random4>
// phone_b64 = base64url(phone) with padding stripped

export function createOrder(phone: string): Order {
  const phonePart = Buffer.from(phone).toString("base64url");
  const orderId = `CK-${Date.now()}-${phonePart}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const order: Order = {
    orderId,
    phone,
    amount: 500,
    status: "pending",
    qrisUrl: null,
    pg_txid: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    searchToken: null,
  };
  orderStore.set(orderId, order);
  return order;
}

// ── Decode phone from orderId (cold-start resilience) ────────────────────────
export function decodePhoneFromOrderId(orderId: string): string | null {
  // Format: CK-<ts>-<phone_b64>-<rand>
  const parts = orderId.split("-");
  // parts[0]=CK, parts[1]=timestamp, parts[2]=phone_b64, parts[3]=rand
  if (parts.length < 4 || parts[0] !== "CK") return null;
  try {
    return Buffer.from(parts[2], "base64url").toString("utf8");
  } catch {
    return null;
  }
}

// ── Get ──────────────────────────────────────────────────────────────────────
export function getOrder(orderId: string): Order | undefined {
  const order = orderStore.get(orderId);
  if (!order) return undefined;
  if (
    order.status === "pending" &&
    Date.now() - new Date(order.createdAt).getTime() > ORDER_TTL_MS
  ) {
    orderStore.set(orderId, { ...order, status: "expired" });
    return orderStore.get(orderId);
  }
  return order;
}

// ── Update QRIS URL ──────────────────────────────────────────────────────────
export function setOrderQrisUrl(orderId: string, qrisUrl: string): void {
  const order = orderStore.get(orderId);
  if (order) orderStore.set(orderId, { ...order, qrisUrl });
}

// ── Set Payment Gateway Transaction ID ───────────────────────────────────────
// Called after AutoGoPay returns order_sn on payment creation.
export function setOrderPgTxId(orderId: string, pgTxId: string): void {
  const order = orderStore.get(orderId);
  if (order) {
    orderStore.set(orderId, { ...order, pg_txid: pgTxId });
    pgTxMap.set(pgTxId, orderId);
  }
}

// ── Lookup order by PG transaction ID (for webhook) ──────────────────────────
export function getOrderByPgTxId(pgTxId: string): Order | undefined {
  const orderId = pgTxMap.get(pgTxId);
  if (!orderId) return undefined;
  return getOrder(orderId);
}

// ── Lookup pending order by amount (ShopeePay webhook fallback) ───────────────
// ShopeePay webhook doesn't return order_sn — match by amount + pending status.
// Returns the most recent pending order with matching amount.
export function getOrderByAmount(amount: number): Order | undefined {
  let best: Order | undefined;
  for (const [, order] of orderStore) {
    if (order.status === "pending" && order.amount === amount) {
      if (!best || order.createdAt > best.createdAt) best = order;
    }
  }
  return best;
}

// ── Complete Payment ─────────────────────────────────────────────────────────
export function completeOrder(orderId: string, phone?: string): Order | null {
  const existing = orderStore.get(orderId);

  // If order exists and already completed, return it
  if (existing?.status === "completed") return existing;

  // If not in store (cold start), reconstruct from orderId
  const resolvedPhone = existing?.phone ?? phone ?? decodePhoneFromOrderId(orderId);
  if (!resolvedPhone) return null;

  const searchToken = crypto.randomBytes(20).toString("hex");

  const completed: Order = existing
    ? { ...existing, status: "completed", completedAt: new Date().toISOString(), searchToken }
    : {
        orderId,
        phone: resolvedPhone,
        amount: 500,
        status: "completed",
        qrisUrl: null,
        pg_txid: null,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        searchToken,
      };

  orderStore.set(orderId, completed);
  return completed;
}

// ── Consume Search Token ─────────────────────────────────────────────────────
export function consumeSearchToken(token: string): { phone: string } | null {
  for (const [, order] of orderStore) {
    if (order.searchToken === token && order.status === "completed") {
      orderStore.set(order.orderId, { ...order, searchToken: null });
      return { phone: order.phone };
    }
  }
  return null;
}
