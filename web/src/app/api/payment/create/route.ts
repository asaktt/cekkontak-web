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

  // Create order in our store
  const order = createOrder(phone);

  // Create QRIS transaction at Pakasir
  try {
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

    // Pakasir returns qris_image_url or similar — store it
    const qrisUrl: string | null =
      data?.qris_image_url ?? data?.qr_image ?? data?.qr_url ?? null;

    if (qrisUrl) {
      setOrderQrisUrl(order.orderId, qrisUrl);
    }

    return NextResponse.json({
      orderId: order.orderId,
      amount: 500,
      qrisUrl,
      // Fallback: if Pakasir returns a payment_url (link-based)
      paymentUrl: data?.payment_url ?? data?.url ?? null,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Gagal membuat transaksi: " + (e as Error).message },
      { status: 500 }
    );
  }
}
