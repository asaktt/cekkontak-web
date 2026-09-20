import { NextRequest, NextResponse } from "next/server";
import { createOrder, setOrderQrisUrl } from "@/lib/orderStore";

const PAKASIR_BASE = "https://app.pakasir.com";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone) {
    return NextResponse.json({ error: "Nomor HP diperlukan" }, { status: 400 });
  }

  const project = process.env.PAKASIR_PROJECT;
  const apiKey = process.env.PAKASIR_API_KEY;
  if (!project || !apiKey) {
    return NextResponse.json(
      { error: "Pakasir belum dikonfigurasi" },
      { status: 500 }
    );
  }

  // Create order in our store first
  const order = createOrder(phone);

  try {
    // POST to Pakasir API — returns QR string (payment_number), not image
    const res = await fetch(`${PAKASIR_BASE}/api/transactioncreate/qris`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project,
        order_id: order.orderId,
        amount: 500,
        api_key: apiKey,
      }),
    });

    const data = await res.json();

    // Pakasir response: { payment: { payment_number, expired_at, ... } }
    const qrString: string | null = data?.payment?.payment_number ?? null;
    const expiredAt: string | null = data?.payment?.expired_at ?? null;

    if (qrString) {
      // Store the QR string — frontend will render it using a QR library
      setOrderQrisUrl(order.orderId, qrString);
    }

    // Also build the fallback payment URL (link-based, user redirected)
    const paymentUrl = `${PAKASIR_BASE}/pay/${project}/500?order_id=${order.orderId}&qris_only=1&redirect=https://cekkontak.online`;

    return NextResponse.json({
      orderId: order.orderId,
      amount: 500,
      qrString,        // Raw QR string — render with QR library on frontend
      paymentUrl,      // Fallback: open Pakasir payment page
      expiredAt,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Gagal membuat transaksi: " + (e as Error).message },
      { status: 500 }
    );
  }
}
