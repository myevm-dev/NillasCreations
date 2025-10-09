// /src/app/api/orders/route.ts
import { NextResponse } from "next/server";
import {
  computeTotals,
  makeOrderNumber,
  type OrderDetails,
  type OrderItem,
  type PaymentMethod,
  type Fulfillment,
} from "@/lib/orderReceipt";
import { sendReceiptEmails } from "@/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Expecting from client:
    // {
    //   customer: { name, phone, email?, isCell? },
    //   items: [{ id, name, price, quantity }, ...],
    //   fulfillment: { type, date, time, ... },
    //   notes?: string,
    //   payment: { method: "COD" | "Card" | "Cash App" | "Afterpay", paid: boolean },
    //   downloadReceipt?: boolean,
    //   sendCustomerCopy?: boolean
    // }

    const items: OrderItem[] = payload.items ?? [];
    const { subtotal, tax, total } = computeTotals(items, 0); // set tax rate if needed

    const order: OrderDetails = {
      orderNumber: makeOrderNumber(),
      createdAtISO: new Date().toISOString(),
      customer: payload.customer,
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

    const sendCustomerCopy =
      Boolean(payload.sendCustomerCopy) && Boolean(order.customer.email);

    const smsCarrier =
      (process.env.ORDER_SMS_CARRIER as
        | "att"
        | "verizon"
        | "tmobile"
        | "uscellular"
        | "googlefi"
        | undefined) ?? "verizon";

    const result = await sendReceiptEmails(order, {
      sendToWifeEmail: "orders@nillascreations.com",
      smsCarrier,
      smsEnable: true,
      sendCustomerCopy,
      customerEmail: order.customer.email,
    });

    // Base response
    const body: {
      ok: true;
      orderNumber: string;
      filename: string;
      receiptHTML?: string;
    } = {
      ok: true,
      orderNumber: order.orderNumber,
      filename: `Receipt-${order.orderNumber}.html`,
    };

    // Include HTML receipt only if client asked to download
    if (payload.downloadReceipt) {
      body.receiptHTML = result.html;
    }

    return NextResponse.json(body);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
