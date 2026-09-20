import { NextRequest, NextResponse } from "next/server";
import { validatePromo, consumePromo } from "@/lib/promoStore";
import crypto from "crypto";

// Temporary token store: token → phone (1-time use, 10-min TTL)
const promoTokens = new Map<string, { phone: string; expiresAt: number }>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of promoTokens) {
    if (data.expiresAt < now) promoTokens.delete(token);
  }
}, 60_000);

export async function POST(req: NextRequest) {
  const { code, phone } = await req.json();

  if (!code || !phone) {
    return NextResponse.json(
      { success: false, reason: "Kode promo dan nomor HP diperlukan" },
      { status: 400 }
    );
  }

  const validation = validatePromo(code.trim());
  if (!validation.valid) {
    return NextResponse.json({ success: false, reason: validation.reason });
  }

  // Consume the promo (decrement usedCount)
  const consumed = consumePromo(code.trim());
  if (!consumed) {
    return NextResponse.json({ success: false, reason: "Gagal menggunakan promo" });
  }

  // Issue a one-time search token for this phone number
  const searchToken = crypto.randomBytes(24).toString("hex");
  promoTokens.set(searchToken, {
    phone,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  return NextResponse.json({ success: true, searchToken });
}

// Export for use by search route
export function consumePromoToken(token: string): { phone: string } | null {
  const data = promoTokens.get(token);
  if (!data || data.expiresAt < Date.now()) return null;
  promoTokens.delete(token); // one-time use
  return { phone: data.phone };
}
