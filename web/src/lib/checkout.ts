import { z } from "zod";
import { getProducts } from "./catalog";
import { addressSchema, checkDelivery } from "./delivery";
import { DELIVERY_FEE_CENTS, validateSlot } from "./store";
import { squareConfiguration, squareRequest, StoreError } from "./square";

export const checkoutSchema = z.object({
  cart: z.array(z.object({ id: z.string().min(1).max(100), quantity: z.number().int().min(1).max(24) })).min(1).max(24),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().max(400).default(""), deliveryAddress: addressSchema,
  customer: z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254),
    phone: z.string().transform(p => p.replace(/[^\d+]/g, "")).refine(p => /^(?:\+1|1)?\d{10}$/.test(p), "Enter a US phone number.").transform(p => `+1${p.slice(-10)}`) }),
  requestId: z.string().uuid(), expectedTotalCents: z.number().int().positive().optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
type Line = { name: string; quantity: string; base_price_money: { amount: number; currency: "USD" }; catalog_object_id?: string; note?: string; applied_taxes?: { tax_uid: string }[] };
export type SquareOrder = { id?: string; location_id?: string; reference_id?: string; state?: string;
  total_money?: { amount: number; currency: string }; total_tax_money?: { amount: number };
  total_discount_money?: { amount: number }; total_service_charge_money?: { amount: number };
  net_amount_due_money?: { amount: number }; tenders?: { payment_id?: string }[] };

export function checkoutSettings() {
  const config = squareConfiguration();
  if (process.env.CHECKOUT_ENABLED !== "true") throw new StoreError("Online ordering is currently paused. Please contact us to order.", 503);
  const secret = process.env.CHECKOUT_SIGNING_SECRET;
  if (!secret || secret.length < 32) throw new StoreError("Online checkout is temporarily unavailable.", 503);
  const url = process.env.STORE_URL;
  if (!url) throw new StoreError("Online checkout is temporarily unavailable.", 503);
  const origin = new URL(url).origin;
  if (config.environment === "production" && !origin.startsWith("https://")) throw new StoreError("Online checkout is temporarily unavailable.", 503);
  const rawTax = process.env.STORE_TAX_PERCENT;
  if (!rawTax?.trim() || !Number.isFinite(Number(rawTax)) || Number(rawTax) < 0 || Number(rawTax) > 25) throw new StoreError("Online checkout is temporarily unavailable.", 503);
  if (!["true", "false"].includes(process.env.DELIVERY_FEE_TAXABLE || "")) throw new StoreError("Online checkout is temporarily unavailable.", 503);
  return { ...config, secret, origin, taxPercent: Number(rawTax), deliveryTaxable: process.env.DELIVERY_FEE_TAXABLE === "true" };
}

export async function prepareOrder(input: CheckoutInput) {
  const config = checkoutSettings();
  const deliverAt = validateSlot(input.date, input.time);
  if (new Set(input.cart.map(i => i.id)).size !== input.cart.length) throw new StoreError("Please remove duplicate products from the cart.");
  if (input.cart.reduce((n, item) => n + item.quantity, 0) > 48) throw new StoreError("Please contact us directly for orders above 48 packages.");
  const products = await getProducts();
  const lineItems: Line[] = input.cart.map(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) throw new StoreError("An item is no longer available. Please refresh the shop and update your cart.");
    return { name: product.name, quantity: String(item.quantity), base_price_money: { amount: Math.round(product.price * 100), currency: "USD" },
      ...(product.catalogObjectId ? { catalog_object_id: product.catalogObjectId } : {}),
      ...(config.taxPercent > 0 ? { applied_taxes: [{ tax_uid: "store-tax" }] } : {}) };
  });
  const delivery = await checkDelivery(input.deliveryAddress);
  const subtotalCents = lineItems.reduce((sum, item) => sum + item.base_price_money.amount * Number(item.quantity), 0);
  lineItems.push({ name: "Local delivery (within 20 miles of 79936)", quantity: "1",
    note: `Deliver ${input.date} at ${input.time} El Paso time. ${delivery.formattedAddress}${delivery.address.line2 ? `, ${delivery.address.line2}` : ""}. ${input.customer.name}, ${input.customer.phone}. ${input.notes}`, base_price_money: { amount: DELIVERY_FEE_CENTS, currency: "USD" },
    ...(config.taxPercent > 0 && config.deliveryTaxable ? { applied_taxes: [{ tax_uid: "store-tax" }] } : {}) });
  const order = {
    location_id: config.locationId, reference_id: input.requestId, source: { name: "Nilla's Creations storefront" },
    line_items: lineItems, pricing_options: { auto_apply_discounts: false, auto_apply_taxes: false },
    ...(config.taxPercent > 0 ? { taxes: [{ uid: "store-tax", name: "Sales tax", percentage: String(config.taxPercent), scope: "LINE_ITEM", type: "ADDITIVE" }] } : {}),
    // Native DELIVERY is a restricted Square partner beta and can hide orders from sellers.
    fulfillments: [{ type: "SHIPMENT", state: "PROPOSED", shipment_details: {
      carrier: "Nilla's Creations", shipping_type: "Local delivery",
      recipient: { display_name: input.customer.name, email_address: input.customer.email, phone_number: input.customer.phone,
        address: { address_line_1: delivery.address.line1, address_line_2: delivery.address.line2, locality: delivery.address.city,
          administrative_district_level_1: delivery.address.state, postal_code: delivery.address.zip, country: "US" } },
      shipping_note: `LOCAL DELIVERY: ${input.date} at ${input.time} El Paso time. ${input.notes}`,
    } }],
    metadata: { source: "nillas-web", delivery_origin: "ZIP 79936 center", delivery_date: input.date, delivery_time: input.time, time_zone: "America/Denver", deliver_at: deliverAt },
  };
  const result = await squareRequest<{ order: SquareOrder }>("/orders/calculate", { order });
  const total = result.order.total_money;
  if (!total || total.currency !== "USD" || !Number.isSafeInteger(total.amount) || total.amount < subtotalCents + DELIVERY_FEE_CENTS ||
    (result.order.total_discount_money?.amount || 0) !== 0 || (result.order.total_service_charge_money?.amount || 0) !== 0) {
    throw new StoreError("We could not calculate the order total. Please try again.", 502);
  }
  return { order, quote: { subtotalCents, deliveryFeeCents: DELIVERY_FEE_CENTS, taxCents: result.order.total_tax_money?.amount || 0,
    totalCents: total.amount, distanceMiles: delivery.distanceMiles, formattedAddress: delivery.formattedAddress, deliverAt } };
}
