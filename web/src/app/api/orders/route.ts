// /src/app/api/orders/route.ts
import { NextResponse } from "next/server";
import { computeTotals, makeOrderNumber } from "@/lib/orderReceipt";
import type { OrderDetails, OrderItem, PaymentMethod, Fulfillment } from "@/lib/orderReceipt";
import { sendReceiptEmails } from "@/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const items: OrderItem[] = payload.items ?? [];
    const { subtotal, tax, total } = computeTotals(items, 0); // TODO: set your tax rate

    const order: OrderDetails = {
      orderNumber: makeOrderNumber(),
      createdAtISO: new Date().toISOString(),
      customer: payload.customer, // { name, phone, email?, isCell? }
      items,
      subtotal,
      tax,
      total,
      fulfillment: payload.fulfillment as Fulfillment,
      notes: payload.notes,
      payment: payload.payment as { method: PaymentMethod; paid: boolean },
      business: {
        name: "Nilla’s Creations",
        email: "orders@nillascreations.com",
        phone: "",
        website: "https://nillascreations.com",
      },
    };

    const result = await sendReceiptEmails(order, {
      sendToWifeEmail: "orders@nillascreations.com",
      smsCarrier: "verizon", // set correct carrier
      smsEnable: true,
    });

    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      receiptHTML: result.html,
      filename: `Receipt-${order.orderNumber}.html`,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
