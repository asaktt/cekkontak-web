import { NextRequest, NextResponse } from "next/server";
import { getOrder, completeOrder, decodePhoneFromOrderId } from "@/lib/orderStore";

const CASAKU_BASE = "https://api.casaku.id";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId diperlukan" }, { status: 400 });
  }

  const order = getOrder(orderId);

  // If already completed in store, return token immediately
  if (order?.status === "completed") {
    return NextResponse.json({
      orderId: order.orderId,
      status: "completed",
      searchToken: order.searchToken,
    });
  }

  if (order?.status === "expired") {
    return NextResponse.json({ orderId: order.orderId, status: "expired", searchToken: null });
  }

  // Always query Casaku directly — authoritative source, also works after cold starts
  const licenseKey = process.env.CASAKU_LICENSE_KEY;
  const casakuTxId = order?.casaku_txid;

  if (licenseKey && casakuTxId) {
    try {
      const res = await fetch(`${CASAKU_BASE}/api/generate/check-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-license-key": licenseKey,
        },
        body: JSON.stringify({ transactionId: casakuTxId }),
      });

      const data = await res.json();
      // Casaku status values: "pending" | "paid" | "cancel" | "expired"
      const txStatus: string = data?.data?.status ?? data?.status ?? "";

      if (txStatus === "paid") {
        // Decode phone from orderId for cold-start resilience
        const phone = order?.phone ?? decodePhoneFromOrderId(orderId) ?? "";
        const completed = completeOrder(orderId, phone);
        return NextResponse.json({
          orderId,
          status: "completed",
          searchToken: completed?.searchToken ?? null,
        });
      }

      if (txStatus === "cancel" || txStatus === "expired") {
        return NextResponse.json({ orderId, status: "expired", searchToken: null });
      }
    } catch {
      // If Casaku unreachable, fall through to pending
    }
  }

  return NextResponse.json({
    orderId: order?.orderId ?? orderId,
    status: order?.status ?? "pending",
    searchToken: null,
  });
}
