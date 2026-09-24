import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getOrderByPgTxId, getOrderByAmount, completeOrder } from "@/lib/orderStore";

/**
 * AutoGoPay Webhook Handler
 *
 * AutoGoPay mengirim POST saat transaksi ShopeePay berhasil dibayar.
 * Header X-Signature berisi HMAC-SHA256 dari raw body menggunakan API key.
 *
 * URL: https://www.cekkontak.online/api/payment/webhook
 */

function verifySignature(rawBody: Buffer, signature: string, apiKey: string): boolean {
  if (!signature) return false;

  // AutoGoPay menggunakan bagian setelah prefix "agp_" sebagai HMAC secret
  const secret = apiKey.replace(/^agp_/, "");

  // Coba berbagai format signature (hex dan base64)
  const hmacHex = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const hmacB64 = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");

  // Juga coba dengan full API key (fallback)
  const hmacFullHex = crypto.createHmac("sha256", apiKey).update(rawBody).digest("hex");
  const hmacFullB64 = crypto.createHmac("sha256", apiKey).update(rawBody).digest("base64");

  const candidates = [hmacHex, hmacB64, hmacFullHex, hmacFullB64];

  return candidates.some((candidate) => {
    try {
      const isBase64 = signature.includes("=") || /^[A-Za-z0-9+/]+=*$/.test(signature);
      const encoding = isBase64 ? "base64" : "hex";
      const sigBuf = Buffer.from(signature, encoding);
      const canBuf = Buffer.from(candidate, encoding);
      return sigBuf.length > 0 && sigBuf.length === canBuf.length && crypto.timingSafeEqual(sigBuf, canBuf);
    } catch {
      return candidate === signature;
    }
  });
}

export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());
  const apiKey = process.env.AGP_API_KEY ?? "";
  const signature = req.headers.get("x-signature") ?? "";

  // Verifikasi HMAC-SHA256 jika ada signature di header
  if (apiKey && signature) {
    const isValid = verifySignature(rawBody, signature, apiKey);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
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
    // Verification ping dengan empty body
    return NextResponse.json({ message: "OK" }, { status: 200 });
  }

  const { event, transaction } = payload;

  // Return 200 untuk verification pings atau event yang tidak dikenal
  if (!event || !transaction) {
    return NextResponse.json({ message: "OK" }, { status: 200 });
  }

  if (event !== "transaction.received") {
    return NextResponse.json({ message: "Ignored" }, { status: 200 });
  }

  if (transaction.status !== "settlement") {
    return NextResponse.json({ message: "Ignored" }, { status: 200 });
  }

  const amount = transaction.amount ?? 0;
  if (amount < 500) {
    return NextResponse.json({ message: "Ignored — amount too low" }, { status: 200 });
  }

  // Cari order: by transaction.id dulu, fallback by amount
  let order = transaction.id ? getOrderByPgTxId(transaction.id) : undefined;
  if (!order) order = getOrderByAmount(amount);

  if (!order) {
    return NextResponse.json({ message: "OK (order not in store)" }, { status: 200 });
  }

  const completed = completeOrder(order.orderId, order.phone);
  if (!completed) {
    return NextResponse.json({ message: "OK (already completed)" }, { status: 200 });
  }

  return NextResponse.json({ message: "OK", orderId: completed.orderId });
}
