import { NextRequest, NextResponse } from "next/server";
import { validatePromo, consumePromo, savePromoToken } from "@/lib/promoStore";
import crypto from "crypto";
import { rateLimit, getIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Rate limit: max 10 promo attempts per minute per IP (brute-force prevention)
  const ip = getIp(req.headers);
  const rl = rateLimit(ip, "promo", 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, reason: "Terlalu banyak percobaan. Coba lagi sebentar." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
    );
  }

  const { code, phone } = await req.json();

  if (!code || !phone) {
    return NextResponse.json(
      { success: false, reason: "Kode promo dan nomor HP diperlukan" },
      { status: 400 }
    );
  }

  const validation = await validatePromo(code.trim());
  if (!validation.valid) {
    return NextResponse.json({ success: false, reason: validation.reason });
  }

  // Consume the promo (increment usedCount)
  const consumed = await consumePromo(code.trim());
  if (!consumed) {
    return NextResponse.json({ success: false, reason: "Gagal menggunakan promo" });
  }

  // Issue a one-time search token, persisted in Redis (10-min TTL)
  const searchToken = crypto.randomBytes(24).toString("hex");
  await savePromoToken(searchToken, phone);

  return NextResponse.json({ success: true, searchToken });
}

