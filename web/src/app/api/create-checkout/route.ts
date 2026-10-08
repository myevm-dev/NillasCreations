import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { checkoutSchema, checkoutSettings, prepareOrder } from "@/lib/checkout";
import { apiError, readBody } from "@/lib/http";
import { signReceipt } from "@/lib/receipts";
import { squareRequest, StoreError } from "@/lib/square";

export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const input = checkoutSchema.parse(await readBody(req));
    if (!input.expectedTotalCents) throw new StoreError("Please review your order total first.");
    const config = checkoutSettings();
    const { order, quote } = await prepareOrder(input);
    if (input.expectedTotalCents !== quote.totalCents) throw new StoreError("The price changed. Please go back and review your updated total.", 409);
    const idempotencyKey = createHmac("sha256", config.secret).update(JSON.stringify(order)).digest("hex").slice(0, 45);
    const response = await squareRequest<{ payment_link?: { url?: string; order_id?: string } }>("/online-checkout/payment-links", {
      idempotency_key: idempotencyKey, order,
      checkout_options: { redirect_url: `${config.origin}/order-confirmed?reference=${input.requestId}`, allow_tipping: false, ask_for_shipping_address: false,
        accepted_payment_methods: { apple_pay: true, google_pay: true, cash_app_pay: false, afterpay_clearpay: false } },
      pre_populated_data: { buyer_email: input.customer.email, buyer_phone_number: input.customer.phone },
    });
    const link = response.payment_link;
    if (!link?.url || !link.order_id) throw new StoreError("Square did not return a checkout link. Please try again.", 502);
    const url = new URL(link.url);
    if (url.protocol !== "https:" || !(url.hostname === "square.link" || url.hostname.endsWith(".square.site") || url.hostname === "connect.squareupsandbox.com" || url.hostname === "connect.squareup.com")) {
      throw new StoreError("Square returned an invalid checkout link.", 502);
    }
    const res = NextResponse.json({ checkoutUrl: link.url });
    res.headers.set("Cache-Control", "no-store");
    res.cookies.set("nillas-receipt", signReceipt({ orderId: link.order_id, reference: input.requestId, expires: Date.now() + 7 * 86400000 }),
      { httpOnly: true, secure: config.origin.startsWith("https://"), sameSite: "lax", path: "/", maxAge: 7 * 86400 });
    return res;
  } catch (error) { return apiError(error); }
}
