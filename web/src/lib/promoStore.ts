// ── In-Memory Promo Code Store ──────────────────────────────────────────────
// NOTE: Resets on cold start (Vercel serverless). For persistence at scale,
// migrate to Vercel KV / Upstash Redis.

export interface PromoCode {
  code: string;
  isActive: boolean;
  expiresAt: string | null; // ISO date string or null = no expiry
  maxUses: number | null;   // null = unlimited
  usedCount: number;
  createdAt: string;        // ISO date string
}

// Initialize from env seed
function initStore(): Map<string, PromoCode> {
  const store = new Map<string, PromoCode>();
  const seed = process.env.PROMO_SEED_JSON;
  if (seed) {
    try {
      const items = JSON.parse(seed) as PromoCode[];
      for (const item of items) {
        store.set(item.code.toUpperCase(), item);
      }
    } catch {
      console.error("[PromoStore] Failed to parse PROMO_SEED_JSON");
    }
  }
  return store;
}

const promoStore: Map<string, PromoCode> = initStore();

// ── CRUD ────────────────────────────────────────────────────────────────────

export function getAllPromos(): PromoCode[] {
  return Array.from(promoStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getPromo(code: string): PromoCode | undefined {
  return promoStore.get(code.toUpperCase());
}

export function createPromo(data: Omit<PromoCode, "code" | "usedCount" | "createdAt"> & { code: string }): PromoCode {
  const promo: PromoCode = {
    ...data,
    code: data.code.toUpperCase(),
    usedCount: 0,
    createdAt: new Date().toISOString(),
  };
  promoStore.set(promo.code, promo);
  return promo;
}

export function updatePromo(code: string, patch: Partial<Omit<PromoCode, "code" | "createdAt">>): PromoCode | null {
  const existing = promoStore.get(code.toUpperCase());
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  promoStore.set(code.toUpperCase(), updated);
  return updated;
}

export function deletePromo(code: string): boolean {
  return promoStore.delete(code.toUpperCase());
}

// ── Validation ───────────────────────────────────────────────────────────────

export type PromoValidationResult =
  | { valid: true; promo: PromoCode }
  | { valid: false; reason: string };

export function validatePromo(code: string): PromoValidationResult {
  const promo = promoStore.get(code.toUpperCase());
  if (!promo) return { valid: false, reason: "Kode promo tidak ditemukan" };
  if (!promo.isActive) return { valid: false, reason: "Kode promo tidak aktif" };
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return { valid: false, reason: "Kode promo sudah kadaluarsa" };
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return { valid: false, reason: "Kode promo sudah habis digunakan" };
  }
  return { valid: true, promo };
}

export function consumePromo(code: string): boolean {
  const result = validatePromo(code);
  if (!result.valid) return false;
  const promo = result.promo;
  promoStore.set(promo.code, { ...promo, usedCount: promo.usedCount + 1 });
  return true;
}
