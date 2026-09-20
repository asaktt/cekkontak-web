import { NextRequest, NextResponse } from "next/server";
import { completeOrder } from "@/lib/orderStore";

// Pakasir calls this URL after payment is confirmed.
// Set webhook URL in your Pakasir dashboard to:
//   https://cekkontak.online/api/pakasir/callback

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, status, amount } = body as {
      order_id: string;
      status: string;
      amount: number;
      project: string;
      payment_method: string;
      completed_at: string;
    };

    // Basic sanity check
    if (!order_id || status !== "completed") {
      return NextResponse.json({ received: true });
    }

    // Verify amount matches (prevents spoofing a different amount)
    if (amount !== 500) {
      console.warn(`[Pakasir Callback] Amount mismatch for ${order_id}: got ${amount}`);
      return NextResponse.json({ received: true });
    }

    const completed = completeOrder(order_id);
    if (!completed) {
      console.warn(`[Pakasir Callback] Order not found or not pending: ${order_id}`);
    } else {
      console.log(`[Pakasir Callback] Order completed: ${order_id}`);
    }

    // Always return 200 to Pakasir
    return NextResponse.json({ received: true });
  } catch (e: unknown) {
    console.error("[Pakasir Callback] Error:", e);
    return NextResponse.json({ received: true });
  }
}
