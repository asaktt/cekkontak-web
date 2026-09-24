import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getOrderByPgTxId, completeOrder } from "@/lib/orderStore";

/**
 * AutoGoPay webhook — called when payment status changes to "settlement"/"paid".
 *
 * AutoGoPay sends (ShopeePay):
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
 * Security: AutoGoPay signs payload with HMAC-SHA256 via X-Signature header.
 * We MUST verify using raw body (before JSON parse) and timingSafeEqual.
 * Configure webhook URL in: https://pg.sphixray.com/dashboard
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.AGP_API_KEY; // AutoGoPay uses API key as HMAC secret

  // Read raw body as Buffer for HMAC verification
  const rawBody = Buffer.from(await req.arrayBuffer());

  // Verify HMAC-SHA256 signature if secret is configured
  if (webhookSecret) {
    const signature = req.headers.get("x-signature") ?? "";
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
    event?: string;
    timestamp?: string;
    transaction?: {
      id?: string;
      amount?: number;
      status?: string;
      payment_type?: string;
      issuer?: string;
    };
  };

  try {
    payload = JSON.parse(rawBody.toString("utf-8"));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, transaction } = payload;

  if (!event || !transaction?.id) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  // Only process payment received events
  if (event !== "transaction.received") {
    return NextResponse.json({ message: "Ignored" }, { status: 200 });
  }

  // Only process settlement status
  if (transaction.status !== "settlement") {
    return NextResponse.json({ message: "Ignored" }, { status: 200 });
  }

  // Validate amount (base 500)
  if (typeof transaction.amount === "number" && transaction.amount < 500) {
    return NextResponse.json({ message: "Ignored — amount too low" }, { status: 200 });
  }

  // Lookup order by AutoGoPay transaction ID
  const order = getOrderByPgTxId(transaction.id);

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
