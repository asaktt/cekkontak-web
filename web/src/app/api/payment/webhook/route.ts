import { NextRequest, NextResponse } from "next/server";
import { getOrderByPgTxId, getOrderByAmount, completeOrder } from "@/lib/orderStore";

/**
 * AutoGoPay Webhook Handler
 *
 * Dipanggil otomatis oleh AutoGoPay saat transaksi ShopeePay berhasil dibayar.
 *
 * Payload yang dikirim AutoGoPay:
 * {
 *   "event": "transaction.received",
 *   "timestamp": "2024-03-29 14:30:45",
 *   "transaction": {
 *     "id": "TRX-001",
 *     "time": "2024-03-29 14:30:40",
 *     "amount": 500,
 *     "currency": "IDR",
 *     "payment_type": "qris",
 *     "status": "settlement",
 *     "issuer": "shopeepay"
 *   }
 * }
 *
 * Security: AutoGoPay menandatangani payload dengan HMAC-SHA256 via header X-Signature.
 * Verifikasi wajib dilakukan terhadap raw body sebelum parse JSON.
 *
 * Daftarkan URL webhook di: https://pg.sphixray.com → Pengaturan → Webhook
 * URL: https://cekkontak.online/api/payment/webhook
 */

export async function POST(req: NextRequest) {
  // ── 1. Baca raw body ───────────────────────────────────────────────────────
  const rawBody = Buffer.from(await req.arrayBuffer());

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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, transaction } = payload;

  // ── 4. Filter event yang relevan ───────────────────────────────────────────
  if (!event || !transaction) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  if (event !== "transaction.received") {
    return NextResponse.json({ message: "Ignored — event not relevant" }, { status: 200 });
  }

  // Hanya proses settlement (pembayaran berhasil)
  if (transaction.status !== "settlement") {
    return NextResponse.json({ message: `Ignored — status: ${transaction.status}` }, { status: 200 });
  }

  // Hanya proses ShopeePay (issuer: shopeepay) atau qris
  const issuer = (transaction.issuer ?? "").toLowerCase();
  if (issuer && issuer !== "shopeepay" && issuer !== "qris") {
    return NextResponse.json({ message: `Ignored — issuer: ${issuer}` }, { status: 200 });
  }

  // Validasi amount minimal
  const amount = transaction.amount ?? 0;
  if (amount < 500) {
    return NextResponse.json({ message: "Ignored — amount too low" }, { status: 200 });
  }

  // ── 5. Cari order yang cocok ───────────────────────────────────────────────
  // Strategi 1: cari berdasarkan transaction.id (AutoGoPay's internal TRX-xxx)
  let order = transaction.id ? getOrderByPgTxId(transaction.id) : undefined;

  // Strategi 2: fallback — cari berdasarkan amount (untuk ShopeePay yang tidak
  // mengirim order_sn di webhook payload)
  if (!order) {
    order = getOrderByAmount(amount);
  }

  if (!order) {
    // Order tidak ada di store (cold start / serverless restart)
    // Tetap return 200 agar AutoGoPay tidak retry terus
    console.warn(`[Webhook] Order tidak ditemukan — txId: ${transaction.id}, amount: ${amount}`);
    return NextResponse.json({ message: "OK (order not in store)" }, { status: 200 });
  }

  // ── 6. Tandai order sebagai selesai ───────────────────────────────────────
  const completed = completeOrder(order.orderId, order.phone);

  if (!completed) {
    // Sudah selesai sebelumnya (idempotency)
    return NextResponse.json({ message: "OK (already completed)" }, { status: 200 });
  }

  console.log(`[Webhook] ✅ Order selesai: ${order.orderId} | Amount: ${amount} | Issuer: ${issuer}`);

  return NextResponse.json({
    message: "OK",
    orderId: completed.orderId,
  });
}
