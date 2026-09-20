// ── In-Memory Order / Payment Store ─────────────────────────────────────────
// Stores pending & completed payment orders.
// NOTE: Resets on cold start. For production at scale, use Vercel KV.

import crypto from "crypto";

export type OrderStatus = "pending" | "completed" | "expired";

export interface Order {
  orderId: string;        // Unique order ID sent to Pakasir
  phone: string;          // Phone number to search after payment
  amount: number;         // Always 500
  status: OrderStatus;
  qrisUrl: string | null; // QRIS image URL from Pakasir response
  createdAt: string;
  completedAt: string | null;
  searchToken: string | null; // One-time token issued after payment
}

const orderStore = new Map<string, Order>();

const ORDER_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ── Create ───────────────────────────────────────────────────────────────────

export function createOrder(phone: string): Order {
  const orderId = `CK-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const order: Order = {
    orderId,
    phone,
    amount: 500,
    status: "pending",
    qrisUrl: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    searchToken: null,
  };
  orderStore.set(orderId, order);
  return order;
}

// ── Get ──────────────────────────────────────────────────────────────────────

export function getOrder(orderId: string): Order | undefined {
  const order = orderStore.get(orderId);
  if (!order) return undefined;
  // Auto-expire
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

// ── Complete Payment ─────────────────────────────────────────────────────────

export function completeOrder(orderId: string): Order | null {
  const order = orderStore.get(orderId);
  if (!order || order.status !== "pending") return null;
  const searchToken = crypto.randomBytes(20).toString("hex");
  const completed: Order = {
    ...order,
    status: "completed",
    completedAt: new Date().toISOString(),
    searchToken,
  };
  orderStore.set(orderId, completed);
  return completed;
}

// ── Consume Search Token ─────────────────────────────────────────────────────
// One-time use: token is cleared after consuming

export function consumeSearchToken(token: string): { phone: string } | null {
  for (const [, order] of orderStore) {
    if (order.searchToken === token && order.status === "completed") {
      // Clear token so it can't be reused
      orderStore.set(order.orderId, { ...order, searchToken: null });
      return { phone: order.phone };
    }
  }
  return null;
}
