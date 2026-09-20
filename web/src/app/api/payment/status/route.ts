import { NextRequest, NextResponse } from "next/server";
import { getOrder, completeOrder } from "@/lib/orderStore";

const PAKASIR_BASE = "https://app.pakasir.com";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId diperlukan" }, { status: 400 });
  }

  const order = getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  // If already completed, just return token
  if (order.status === "completed") {
    return NextResponse.json({
      orderId: order.orderId,
      status: "completed",
      searchToken: order.searchToken,
    });
  }

  if (order.status === "expired") {
    return NextResponse.json({ orderId: order.orderId, status: "expired", searchToken: null });
  }

  // Double-check with Pakasir Transaction Detail API for accuracy
  const project = process.env.PAKASIR_PROJECT;
  const apiKey = process.env.PAKASIR_API_KEY;

  if (project && apiKey) {
    try {
      const res = await fetch(
        `${PAKASIR_BASE}/api/transactiondetail?project=${project}&amount=500&order_id=${orderId}&api_key=${apiKey}`
      );
      const data = await res.json();
      const txStatus = data?.transaction?.status;

      if (txStatus === "completed") {
        // Complete in our store if not already done
        const completed = completeOrder(orderId);
        return NextResponse.json({
          orderId,
          status: "completed",
          searchToken: completed?.searchToken ?? order.searchToken,
        });
      }
    } catch {
      // Ignore fetch errors — webhook will handle completion
    }
  }

  return NextResponse.json({
    orderId: order.orderId,
    status: order.status,
    searchToken: null,
  });
}
