import { NextRequest, NextResponse } from "next/server";
import { validatePromo } from "@/lib/promoStore";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ valid: false, reason: "Kode tidak valid" });
  }

  const result = validatePromo(code.trim());
  if (result.valid) {
    return NextResponse.json({ valid: true });
  }
  return NextResponse.json({ valid: false, reason: result.reason });
}
