import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getOrderByPgTxId, completeOrder } from "@/lib/orderStore";

/**
 * SphixRay / AutoGoPay Webhook Handler
 *
 * Platform mengirim POST dengan header X-Signature berisi HMAC-SHA256.
 * Response HARUS { "success": true } dengan status 200.
 *
 * URL: https://www.cekkontak.online/api/payment/webhook
 */

function verifySignature(rawBody: Buffer, signature: string, apiKey: string): boolean {
  if (!signature) return false;

  const keyVariants = [
    apiKey,                        // full key: "agp_xxx"
    apiKey.replace(/^agp_/, ""),   // without prefix: "xxx"
  ];

  const bodyStr = rawBody.toString("utf-8");
  let reserializedBody = bodyStr;
  try {
    reserializedBody = JSON.stringify(JSON.parse(bodyStr));
  } catch { /* keep raw */ }

  const inputVariants = [bodyStr, reserializedBody]; // raw string & re-serialized JSON

  for (const key of keyVariants) {
    for (const input of inputVariants) {
      // Try hex digest
      const hexDigest = crypto.createHmac("sha256", key).update(input).digest("hex");
      if (hexDigest === signature) return true;
      if (hexDigest.toLowerCase() === signature.toLowerCase()) return true;

      // Try base64 digest
      const b64Digest = crypto.createHmac("sha256", key).update(input).digest("base64");
      if (b64Digest === signature) return true;
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());
  const apiKey = process.env.AGP_API_KEY ?? "";
  const signature = req.headers.get("x-signature") ?? "";

  // Verifikasi HMAC-SHA256 jika ada signature di header
  if (apiKey && signature) {
    const isValid = verifySignature(rawBody, signature, apiKey);
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
    }
  }

  // Parse payload
  let payload: {
    event?: string;
    timestamp?: string;
    transaction?: {
      id?: string;
      time?: string;
      amount?: number;
      currency?: string;
      payment_type?: string;
      status?: string;
      issuer?: string;
    };
  };

  try {
    payload = JSON.parse(rawBody.toString("utf-8"));
  } catch {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const { event, transaction } = payload;

  // Return success untuk verification pings
  if (!event || !transaction) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  if (event !== "transaction.received") {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  if (transaction.status !== "settlement") {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const amount = transaction.amount ?? 0;
  if (amount < 500) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Cari order by transaction.id (= order_sn dari ShopeePay QRIS)
  // TIDAK fallback by amount — amount Rp500 sama semua order, bisa salah matching!
  const order = transaction.id ? getOrderByPgTxId(transaction.id) : undefined;

  if (!order) {
    // Order tidak ditemukan — bisa jadi transaksi dari sumber lain, abaikan
    console.log(`[Webhook] Order tidak ditemukan untuk tx.id=${transaction.id}`);
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const completed = completeOrder(order.orderId, order.phone);
  if (!completed) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  console.log(`[Webhook] ✅ Order selesai: ${order.orderId} | Amount: ${amount}`);
  return NextResponse.json({ success: true, orderId: completed.orderId });
}
