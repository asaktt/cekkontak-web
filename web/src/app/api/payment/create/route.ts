import { NextRequest, NextResponse } from "next/server";
import { createOrder, setOrderQrisUrl, setOrderPgTxId } from "@/lib/orderStore";
import { rateLimit, getIp } from "@/lib/rateLimit";

const AGP_BASE = "https://api.pg.sphixray.com";
const AGP_API_KEY = process.env.AGP_API_KEY;

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

  if (!AGP_API_KEY) {
    return NextResponse.json(
      { error: "Payment gateway belum dikonfigurasi" },
      { status: 500 }
    );
  }

  // Create order in our store first
  const order = createOrder(phone);

  try {
    // POST to SphixRay ShopeePay QRIS — returns qr_string, qr_url, order_sn
    const res = await fetch(`${AGP_BASE}/shopeepay/qris/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AGP_API_KEY}`,
      },
      body: JSON.stringify({
        amount: 500,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data?.success) {
      return NextResponse.json(
        { error: data?.message ?? "Gagal membuat transaksi QRIS" },
        { status: res.ok ? 500 : res.status }
      );
    }

    // SphixRay ShopeePay response fields (inside data.data):
    // order_sn       = ShopeePay order serial number (for status polling)
    // qr_string      = Raw QRIS string to render as QR code
    // qr_url         = URL to hosted QR image
    // amount         = payment amount
    // expiry_time    = expiry timestamp (WIB)
    const tx = data?.data;
    const pgTxId: string | null = tx?.order_sn ?? null;
    const qrString: string | null = tx?.qr_string ?? null;
    const qrUrl: string | null = tx?.qr_url ?? null;
    const expiredAt: string | null = tx?.expiry_time ?? null;
    const actualAmount: number = tx?.amount ?? 500;

    if (qrString) {
      setOrderQrisUrl(order.orderId, qrString);
    }
    if (pgTxId) {
      setOrderPgTxId(order.orderId, pgTxId);
    }

    return NextResponse.json({
      orderId: order.orderId,
      pgTxId,
      amount: actualAmount,
      baseAmount: 500,
      qrString,
      qrUrl,
      expiredAt,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Gagal membuat transaksi: " + (e as Error).message },
      { status: 500 }
    );
  }
}
