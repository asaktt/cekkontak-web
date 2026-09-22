import { NextRequest, NextResponse } from "next/server";
import { createOrder, setOrderQrisUrl, setOrderCasakuTxId } from "@/lib/orderStore";
import { rateLimit, getIp } from "@/lib/rateLimit";

const CASAKU_BASE = "https://api.casaku.id";

// Validate phone — accept only digits, +, spaces, dashes
function isValidPhone(p: string): boolean {
  const cleaned = p.trim().replace(/[\s\-().]/g, "");
  return /^\+?[0-9]{7,15}$/.test(cleaned);
}

export async function POST(req: NextRequest) {
  // Rate limit: 5 payment attempts per minute per IP
  const ip = getIp(req.headers);
  const rl = rateLimit(ip, "payment", 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
    );
  }

  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request tidak valid" }, { status: 400 });
  }

  const { phone } = body;
  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ error: "Nomor HP diperlukan" }, { status: 400 });
  }
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: "Format nomor HP tidak valid" }, { status: 400 });
  }

  const licenseKey = process.env.CASAKU_LICENSE_KEY;
  const qrisId = process.env.CASAKU_QRIS_ID;
  if (!licenseKey || !qrisId) {
    return NextResponse.json(
      { error: "Casaku belum dikonfigurasi" },
      { status: 500 }
    );
  }

  // Create order in our store first
  const order = createOrder(phone);

  try {
    // POST to Casaku API v2 — returns QR string and transactionId
    const res = await fetch(`${CASAKU_BASE}/api/generate/v2/qris`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-license-key": licenseKey,
      },
      body: JSON.stringify({
        qr_id: qrisId,
        amount: 500,
        useUniqueCode: true,
        expiredInMinutes: 15,
        prefix: "CCK",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message ?? "Gagal membuat transaksi QRIS" },
        { status: res.status }
      );
    }

    // Casaku response fields (inside data.data):
    // transactionId  = Casaku-generated ID (e.g. "CSK-xxxx")
    // qr_string      = QRIS string to render as QR code
    // totalAmount    = actual amount user pays (includes unique code, e.g. 524)
    // amount         = base amount (500)
    // expiredAt      = ISO expiry timestamp
    const tx = data?.data;
    const casakuTxId: string | null = tx?.transactionId ?? null;
    const qrString: string | null = tx?.qr_string ?? null;
    const expiredAt: string | null = tx?.expiredAt ?? null;
    const actualAmount: number = tx?.totalAmount ?? tx?.amount ?? 500;
    const uniqueCode: number = (actualAmount ?? 500) - 500;

    if (qrString) {
      setOrderQrisUrl(order.orderId, qrString);
    }
    if (casakuTxId) {
      setOrderCasakuTxId(order.orderId, casakuTxId);
    }

    return NextResponse.json({
      orderId: order.orderId,
      casakuTxId,              // Casaku transactionId — needed for status polling
      amount: actualAmount,    // totalAmount — real amount user pays (e.g. 524)
      baseAmount: 500,         // base service price
      fee: uniqueCode,         // unique code added by Casaku
      qrString,
      expiredAt,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Gagal membuat transaksi: " + (e as Error).message },
      { status: 500 }
    );
  }
}
