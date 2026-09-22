import { NextRequest, NextResponse } from "next/server";
import { completeOrder, decodePhoneFromOrderId } from "@/lib/orderStore";

/**
 * Pakasir webhook — called when payment is confirmed.
 *
 * Pakasir sends:
 * {
 *   "amount": 500,
 *   "order_id": "...",
 *   "project": "...",
 *   "status": "completed",
 *   "payment_method": "qris",
 *   "completed_at": "..."
 * }
 *
 * Pakasir does NOT send a signature header — we verify by:
 *   1. Checking project matches our PAKASIR_PROJECT env
 *   2. Checking amount == 500
 *   3. Checking status == "completed"
 *   4. Optionally verifying via Transaction Detail API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, status, amount, project } = body as {
      order_id?: string;
      status?: string;
      amount?: number;
      project?: string;
    };

    const expectedProject = process.env.PAKASIR_PROJECT;

    // Basic validation
    if (!order_id || !status) {
      return NextResponse.json({ error: "Bad payload" }, { status: 400 });
    }

    // Verify project matches (if configured)
    if (expectedProject && project !== expectedProject) {
      return NextResponse.json({ error: "Unknown project" }, { status: 403 });
    }

    // Only process completed payments with correct amount
    if (status !== "completed" || amount !== 500) {
      return NextResponse.json({ message: "Ignored" }, { status: 200 });
    }

    // Mark order complete → issues search token
    // decodePhoneFromOrderId provides resilience after cold starts
    const phone = decodePhoneFromOrderId(order_id) ?? undefined;
    const completed = completeOrder(order_id, phone);
    if (!completed) {
      // Order might already be completed or not found — OK
      return NextResponse.json({ message: "OK (order not found in store)" }, { status: 200 });
    }

    return NextResponse.json({ message: "OK", searchToken: completed.searchToken });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
