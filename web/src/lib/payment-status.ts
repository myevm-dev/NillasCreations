import { checkoutSettings, type SquareOrder } from "./checkout";
import { squareRequest, StoreError } from "./square";
import type { Receipt } from "./receipts";
export async function getPaymentStatus(receipt: Receipt) {
  const { order } = await squareRequest<{ order: SquareOrder }>(`/orders/${encodeURIComponent(receipt.orderId)}`);
  if (order.location_id !== checkoutSettings().locationId || order.reference_id !== receipt.reference) throw new StoreError("Order verification failed.", 403);
  const ids = [...new Set(order.tenders?.map(t => t.payment_id).filter((p): p is string => Boolean(p)) || [])];
  const payments = await Promise.all(ids.map(id => squareRequest<{ payment: { order_id?: string; location_id?: string; status?: string; amount_money?: { amount: number; currency: string }; refunded_money?: { amount: number } } }>(`/payments/${encodeURIComponent(id)}`)));
  const paidCents = payments.reduce((sum, { payment: p }) => sum + (p.status === "COMPLETED" && p.order_id === receipt.orderId && p.location_id === order.location_id && p.amount_money?.currency === "USD" ? p.amount_money.amount - (p.refunded_money?.amount || 0) : 0), 0);
  const paid = order.state !== "CANCELED" && Boolean(order.total_money && order.total_money.currency === "USD" && paidCents >= order.total_money.amount && order.total_money.amount > 0);
  return { status: paid ? "paid" : order.state === "CANCELED" ? "canceled" : "pending", orderId: receipt.orderId };
}
