import { NextRequest, NextResponse } from "next/server";
import {
  getAllPromos,
  createPromo,
  updatePromo,
  deletePromo,
  PromoCode,
} from "@/lib/promoStore";
import { verifyAdminToken } from "@/app/api/admin/auth/route";

// GET /api/admin/promos — list all promos
export async function GET(req: NextRequest) {
  if (!(await verifyAdminToken(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ promos: getAllPromos() });
}

// POST /api/admin/promos — create a new promo
export async function POST(req: NextRequest) {
  if (!(await verifyAdminToken(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as Partial<PromoCode>;
  const { code, isActive = true, expiresAt = null, maxUses = null } = body;

  if (!code || typeof code !== "string" || code.trim().length < 3) {
    return NextResponse.json({ error: "Kode minimal 3 karakter" }, { status: 400 });
  }

  const promo = createPromo({
    code: code.trim(),
    isActive,
    expiresAt,
    maxUses,
  });

  return NextResponse.json({ promo }, { status: 201 });
}

// PATCH /api/admin/promos — update a promo
export async function PATCH(req: NextRequest) {
  if (!(await verifyAdminToken(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as Partial<PromoCode> & { code: string };
  const { code, ...patch } = body;

  if (!code) {
    return NextResponse.json({ error: "Kode diperlukan" }, { status: 400 });
  }

  const updated = updatePromo(code, patch);
  if (!updated) {
    return NextResponse.json({ error: "Promo tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ promo: updated });
}

// DELETE /api/admin/promos?code=XXX — delete a promo
export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminToken(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Kode diperlukan" }, { status: 400 });
  }

  const deleted = deletePromo(code);
  if (!deleted) {
    return NextResponse.json({ error: "Promo tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
