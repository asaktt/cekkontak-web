import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getOrderByCasakuTxId, completeOrder } from "@/lib/orderStore";

/**
 * Casaku webhook — called when payment status changes to "paid".
 *
 * Casaku sends:
 * {
 *   "transactionId": "CSK-xxxx",
 *   "amount": 524,
 *   "packageName": "com.company.paymentapp",
 *   "appName": "Payment App Name",
 *   "status": "paid",
 *   "paidAt": "2026-06-04T03:38:35Z"
 * }
 *
 * Security: Casaku signs payload with HMAC-SHA256 via X-Casaku-Signature header.
 * We MUST verify using raw body (before JSON parse) and timingSafeEqual.
 * Configure webhook URL in: https://casaku.id/webhook
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CASAKU_WEBHOOK_SECRET;

  // Read raw body as Buffer for HMAC verification
  const rawBody = Buffer.from(await req.arrayBuffer());

  // Verify HMAC-SHA256 signature if secret is configured
  if (webhookSecret) {
    const signature = req.headers.get("x-casaku-signature") ?? "";
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)         // raw body — must NOT parse JSON first
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "hex");
    const expBuffer = Buffer.from(expected, "hex");

    // timingSafeEqual requires same length buffers
    const isValid =
      sigBuffer.length === expBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expBuffer);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: {
    transactionId?: string;
    amount?: number;
    status?: string;
    packageName?: string;
    appName?: string;
    paidAt?: string;
  };

  try {
    payload = JSON.parse(rawBody.toString("utf-8"));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { transactionId, status, amount } = payload;

  if (!transactionId || !status) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  // Only process paid notifications
  if (status !== "paid") {
    return NextResponse.json({ message: "Ignored" }, { status: 200 });
  }

  // Validate amount (base 500, unique code may vary so allow >= 500)
  if (typeof amount === "number" && amount < 500) {
    return NextResponse.json({ message: "Ignored — amount too low" }, { status: 200 });
  }

  // Lookup order by Casaku transactionId
  const order = getOrderByCasakuTxId(transactionId);

  if (!order) {
    // Order not in store (cold start) — still OK, just log it
    return NextResponse.json({ message: "OK (order not in store)" }, { status: 200 });
  }

  // Mark order complete → issues search token
  const completed = completeOrder(order.orderId, order.phone);
  if (!completed) {
    return NextResponse.json({ message: "OK (already completed)" }, { status: 200 });
  }

  return NextResponse.json({ message: "OK", searchToken: completed.searchToken });
}
