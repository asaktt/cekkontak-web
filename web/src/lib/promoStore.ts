// ── Persistent Promo Code Store (Upstash Redis) ──────────────────────────────
// Data persists across Vercel cold starts using Upstash Redis.
// Falls back to in-memory if UPSTASH_REDIS_REST_URL is not set.
//
// Env vars required:
//   UPSTASH_REDIS_REST_URL   — from Upstash dashboard
//   UPSTASH_REDIS_REST_TOKEN — from Upstash dashboard

import { Redis } from "@upstash/redis";

export interface PromoCode {
  code: string;
  isActive: boolean;
  expiresAt: string | null; // ISO date string or null = no expiry
  maxUses: number | null;   // null = unlimited
  usedCount: number;
  createdAt: string;        // ISO date string
}

// ── Redis client (lazy init) ──────────────────────────────────────────────────
const REDIS_KEY = "cekkontak:promos"; // Hash key — each field = promo code

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// ── Fallback in-memory store (dev / no Redis) ─────────────────────────────────
const memStore = new Map<string, PromoCode>();

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function getAllPromos(): Promise<PromoCode[]> {
  const redis = getRedis();
  if (redis) {
    const all = await redis.hgetall<Record<string, PromoCode>>(REDIS_KEY);
    if (!all) return [];
    return Object.values(all).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  return Array.from(memStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getPromo(code: string): Promise<PromoCode | undefined> {
  const key = code.toUpperCase();
  const redis = getRedis();
  if (redis) {
    const val = await redis.hget<PromoCode>(REDIS_KEY, key);
    return val ?? undefined;
  }
  return memStore.get(key);
}

export async function createPromo(
  data: Omit<PromoCode, "code" | "usedCount" | "createdAt"> & { code: string }
): Promise<PromoCode> {
  const promo: PromoCode = {
    ...data,
    code: data.code.toUpperCase(),
    usedCount: 0,
    createdAt: new Date().toISOString(),
  };
  const redis = getRedis();
  if (redis) {
    await redis.hset(REDIS_KEY, { [promo.code]: promo });
  } else {
    memStore.set(promo.code, promo);
  }
  return promo;
}

export async function updatePromo(
  code: string,
  patch: Partial<Omit<PromoCode, "code" | "createdAt">>
): Promise<PromoCode | null> {
  const key = code.toUpperCase();
  const existing = await getPromo(key);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  const redis = getRedis();
  if (redis) {
    await redis.hset(REDIS_KEY, { [key]: updated });
  } else {
    memStore.set(key, updated);
  }
  return updated;
}

export async function deletePromo(code: string): Promise<boolean> {
  const key = code.toUpperCase();
  const redis = getRedis();
  if (redis) {
    const deleted = await redis.hdel(REDIS_KEY, key);
    return deleted > 0;
  }
  return memStore.delete(key);
}

// ── Validation ────────────────────────────────────────────────────────────────

export type PromoValidationResult =
  | { valid: true; promo: PromoCode }
  | { valid: false; reason: string };

export async function validatePromo(code: string): Promise<PromoValidationResult> {
  const promo = await getPromo(code);
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

export async function consumePromo(code: string): Promise<boolean> {
  const result = await validatePromo(code);
  if (!result.valid) return false;
  const promo = result.promo;
  await updatePromo(promo.code, { usedCount: promo.usedCount + 1 });
  return true;
}

// ── Promo Search Tokens (Redis-backed, 10-min TTL) ─────────────────────────
// Issued after a promo is successfully consumed. One-time use.
// Key format: cekkontak:promo_token:{token} → phone number string

const PROMO_TOKEN_TTL = 10 * 60; // seconds
const promoTokenMemStore = new Map<string, { phone: string; expiresAt: number }>();

export async function savePromoToken(token: string, phone: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(`cekkontak:promo_token:${token}`, phone, { ex: PROMO_TOKEN_TTL });
  } else {
    promoTokenMemStore.set(token, { phone, expiresAt: Date.now() + PROMO_TOKEN_TTL * 1000 });
  }
}

export async function consumePromoToken(token: string): Promise<{ phone: string } | null> {
  const redis = getRedis();
  const key = `cekkontak:promo_token:${token}`;

  if (redis) {
    const phone = await redis.get<string>(key);
    if (!phone) return null;
    await redis.del(key); // one-time use
    return { phone };
  }

  // Fallback: in-memory
  const data = promoTokenMemStore.get(token);
  if (!data || data.expiresAt < Date.now()) {
    promoTokenMemStore.delete(token);
    return null;
  }
  promoTokenMemStore.delete(token); // one-time use
  return { phone: data.phone };
}
