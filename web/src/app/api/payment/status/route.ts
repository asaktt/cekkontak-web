import { NextRequest, NextResponse } from "next/server";
import { getOrder, completeOrder, decodePhoneFromOrderId } from "@/lib/orderStore";

const AGP_BASE = "https://api.pg.sphixray.com";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId diperlukan" }, { status: 400 });
  }

  // pgTxId bisa dari in-memory store ATAU dikirim langsung dari frontend
  // (cold-start resilience: frontend pass pgTxId dari response create)
  const pgTxIdFromUrl = req.nextUrl.searchParams.get("pgTxId");

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

  // Gunakan pgTxId dari store, atau fallback dari URL param (cold-start safe)
  const apiKey = process.env.AGP_API_KEY;
  const pgTxId = order?.pg_txid ?? pgTxIdFromUrl;

  if (apiKey && pgTxId) {
    try {
      const params = new URLSearchParams({ limit: "20" });
      const res = await fetch(`${AGP_BASE}/shopeepay/transactions?${params}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      const data = await res.json();
      const transactions: Array<{ order_sn: string; status: number; is_money_in: boolean }> =
        data?.data?.transactions ?? [];

      const matched = transactions.find(
        (tx) => tx.order_sn === pgTxId && tx.is_money_in && tx.status === 1
      );

      if (matched) {
        // Decode phone from orderId (works even after cold start)
        const phone = order?.phone ?? decodePhoneFromOrderId(orderId) ?? "";
        const completed = completeOrder(orderId, phone);
        return NextResponse.json({
          orderId,
          status: "completed",
          searchToken: completed?.searchToken ?? null,
        });
      }
    } catch {
      // Jika SphixRay unreachable, fall through to pending
    }
  }

  return NextResponse.json({
    orderId: order?.orderId ?? orderId,
    status: order?.status ?? "pending",
    searchToken: null,
  });
}
