import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/orderStore";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId diperlukan" }, { status: 400 });
  }

  const order = getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.orderId,
    status: order.status,
    // Only expose searchToken if completed — frontend uses this to trigger search
    searchToken: order.status === "completed" ? order.searchToken : null,
  });
}
