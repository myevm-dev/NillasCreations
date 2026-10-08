import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { checkoutSchema, prepareOrder } from "../src/lib/checkout";
import { getProducts } from "../src/lib/catalog";
import { checkDelivery } from "../src/lib/delivery";
import { DELIVERY_ORIGIN, distanceMiles, earliestSlot, slotInstant, validateSlot } from "../src/lib/store";
import { readReceipt, signReceipt } from "../src/lib/receipts";
import { getPaymentStatus } from "../src/lib/payment-status";
import { POST } from "../src/app/api/create-checkout/route";
import { POST as quoteRoute } from "../src/app/api/delivery-quote/route";

const originalFetch = global.fetch;
const originalEnv = { ...process.env };
let payloads: Record<string, unknown>[];
let latitude: number;
let locationType: string;
let geocodeStatus: string;
let paidStatus: string;
let refunded: number;
let paymentOrder: string;
let orderState: string;
let orderLocation: string;
let upstreamStatus: number;
const reference = "e117a6d2-3e4f-445b-a39f-d0c158c913a9";
function input() {
  const slot = earliestSlot(new Date(Date.now() + 2 * 3600000));
  return { cart: [{ id: "1", quantity: 2, price: 0.01, name: "Tampered" }], ...slot,
    notes: "Ring the bell", deliveryAddress: { line1: "123 Test Street", line2: "Unit 2", city: "El Paso", state: "TX", zip: "79936" },
    customer: { name: "Test Buyer", email: "buyer@example.com", phone: "915-555-0123" }, requestId: reference, expectedTotalCents: 4200 };
}
function request(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/create-checkout", { method: "POST", headers: { "Content-Type": "application/json", origin }, body: JSON.stringify(body) });
}
beforeEach(() => {
  Object.assign(process.env, { SQUARE_ENVIRONMENT: "sandbox", SQUARE_ACCESS_TOKEN: "test-token", SQUARE_LOCATION_ID: "LOC",
    CHECKOUT_ENABLED: "true", CHECKOUT_SIGNING_SECRET: "test-secret-with-at-least-32-characters", STORE_URL: "http://localhost:3000",
    GOOGLE_MAPS_API_KEY: "test-key", STORE_TAX_PERCENT: "0", DELIVERY_FEE_TAXABLE: "false", CATALOG_SOURCE: "local" });
  payloads = []; latitude = DELIVERY_ORIGIN.lat; locationType = "ROOFTOP"; geocodeStatus = "OK";
  paidStatus = "COMPLETED"; refunded = 0; paymentOrder = "ORDER"; orderState = "OPEN"; orderLocation = "LOC"; upstreamStatus = 200;
  global.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes("maps.googleapis.com")) return Response.json({ status: geocodeStatus, results: [{ formatted_address: "123 Test Street, El Paso, TX 79936, USA",
      geometry: { location_type: locationType, location: { lat: latitude, lng: DELIVERY_ORIGIN.lng } },
      address_components: [ ["US", "country"], ["123", "street_number"], ["Test Street", "route"], ["TX", "administrative_area_level_1"], ["79936", "postal_code"], ["El Paso", "locality"] ].map(([value, type]) => ({ short_name: value, long_name: value, types: [type] })) }] });
    if (upstreamStatus !== 200) return Response.json({ errors: [{ detail: "PRIVATE_SECRET_UPSTREAM" }] }, { status: upstreamStatus });
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (init?.body) payloads.push(body);
    if (u.includes("/orders/calculate")) {
      let subtotal = 0; let tax = 0;
      for (const line of body.order.line_items) { const price = line.base_price_money.amount * Number(line.quantity); subtotal += price; if (line.applied_taxes) tax += Math.round(price * Number(body.order.taxes[0].percentage) / 100); }
      return Response.json({ order: { total_money: { amount: subtotal + tax, currency: "USD" }, total_tax_money: { amount: tax } } });
    }
    if (u.includes("/payment-links")) return Response.json({ payment_link: { url: "https://checkout.square.site/test", order_id: "ORDER" } });
    if (u.includes("/orders/ORDER")) return Response.json({ order: { id: "ORDER", reference_id: reference, location_id: orderLocation, state: orderState,
      total_money: { amount: 4200, currency: "USD" }, tenders: [{ payment_id: "PAYMENT" }] } });
    if (u.includes("/payments/PAYMENT")) return Response.json({ payment: { order_id: paymentOrder, location_id: "LOC", status: paidStatus,
      amount_money: { amount: 4200, currency: "USD" }, refunded_money: { amount: refunded } } });
    throw new Error(`Unexpected request: ${u}`);
  };
});
afterEach(() => {
  global.fetch = originalFetch;
  for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
  Object.assign(process.env, originalEnv);
});
test("charges trusted prices and exactly $16 delivery, ignoring browser names and prices", async () => {
  const prepared = await prepareOrder(checkoutSchema.parse(input()));
  assert.equal(prepared.quote.subtotalCents, 2600); assert.equal(prepared.quote.deliveryFeeCents, 1600); assert.equal(prepared.quote.totalCents, 4200);
  assert.equal(prepared.order.line_items[0].name, "Loaf Banana Bread (8 slices)");
  assert.equal(prepared.order.fulfillments[0].type, "SHIPMENT");
  assert.match(prepared.order.fulfillments[0].shipment_details.shipping_note, /LOCAL DELIVERY/);
  assert.equal(prepared.order.fulfillments[0].shipment_details.recipient.phone_number, "+19155550123");
  assert.equal(prepared.order.fulfillments[0].shipment_details.recipient.address.address_line_2, "Unit 2");
});
test("creates card checkout with signed HttpOnly receipt and stable retry key", async () => {
  const first = await POST(request(input())); const second = await POST(request(input()));
  assert.equal(first.status, 200); assert.equal(second.status, 200);
  const links = payloads.filter(p => p.idempotency_key);
  assert.equal(links[0].idempotency_key, links[1].idempotency_key);
  assert.match(first.headers.get("set-cookie")!, /HttpOnly/);
  const options = links[0].checkout_options as { ask_for_shipping_address: boolean; redirect_url: string };
  assert.equal(options.ask_for_shipping_address, false); assert.match(options.redirect_url, new RegExp(reference));
});
test("rejects changed totals before creating a payment link", async () => {
  const res = await POST(request({ ...input(), expectedTotalCents: 1 })); assert.equal(res.status, 409);
  assert.equal(payloads.filter(p => p.idempotency_key).length, 0);
});
test("cannot bypass delivery radius by directly calling checkout", async () => {
  latitude += 0.4; const res = await POST(request(input())); assert.equal(res.status, 400);
  assert.equal(payloads.length, 0);
});
test("quote route enforces the same delivery area", async () => {
  latitude += 0.4; const res = await quoteRoute(request(input())); assert.equal(res.status, 400);
});
test("ZIP centroids and approximate geocodes cannot qualify a street address", async () => {
  locationType = "APPROXIMATE"; await assert.rejects(checkDelivery(input().deliveryAddress), /complete, unambiguous/);
});
test("maps failures do not allow checkout", async () => {
  geocodeStatus = "REQUEST_DENIED"; const res = await POST(request(input())); assert.equal(res.status, 503); assert.equal(payloads.length, 0);
});
test("rejects unknown products, duplicate IDs, zero, negative, and fractional quantities", async () => {
  for (const quantity of [0, -1, 1.5, 25]) assert.equal(checkoutSchema.safeParse({ ...input(), cart: [{ id: "1", quantity }] }).success, false);
  await assert.rejects(prepareOrder(checkoutSchema.parse({ ...input(), cart: [{ id: "99", quantity: 1 }] })), /no longer available/);
  await assert.rejects(prepareOrder(checkoutSchema.parse({ ...input(), cart: [{ id: "1", quantity: 1 }, { id: "1", quantity: 1 }] })), /duplicate/);
});
test("server enforces 48-hour lead time and El Paso hours", async () => {
  const soon = new Date(); const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver", year: "numeric", month: "2-digit", day: "2-digit" }).format(soon);
  assert.throws(() => validateSlot(date, "12:00"), /48 hours/);
  const later = input().date; assert.throws(() => validateSlot(later, "22:00"), /hours/);
  assert.throws(() => validateSlot("2026-02-30", "12:00"), /valid/);
});
test("uses Mountain time in summer and winter and preserves DST lead time", () => {
  assert.equal(slotInstant("2026-07-10", "12:00").toISOString(), "2026-07-10T18:00:00.000Z");
  assert.equal(slotInstant("2026-12-10", "12:00").toISOString(), "2026-12-10T19:00:00.000Z");
  const now = new Date("2026-10-31T19:00:00Z"); const earliest = earliestSlot(now);
  assert.ok(slotInstant(earliest.date, earliest.time).getTime() - now.getTime() >= 48 * 3600000);
});
test("checks unrounded radius distance at the 20-mile boundary", () => {
  const edge = { lat: DELIVERY_ORIGIN.lat + 20 / 3958.7613 * 180 / Math.PI, lng: DELIVERY_ORIGIN.lng };
  assert.ok(Math.abs(distanceMiles(DELIVERY_ORIGIN, edge) - 20) < 1e-8);
  assert.ok(distanceMiles(DELIVERY_ORIGIN, { ...edge, lat: edge.lat + 0.00001 }) > 20);
});
test("configured tax applies to goods and optionally delivery without double tax", async () => {
  process.env.STORE_TAX_PERCENT = "8.25";
  const goodsOnly = await prepareOrder(checkoutSchema.parse(input())); assert.equal(goodsOnly.quote.taxCents, 215);
  process.env.DELIVERY_FEE_TAXABLE = "true";
  const both = await prepareOrder(checkoutSchema.parse(input())); assert.equal(both.quote.taxCents, 347);
  assert.equal(both.order.pricing_options.auto_apply_taxes, false);
});
test("missing credentials, keys, tax policy, and ordering pause all fail closed", async () => {
  for (const key of ["SQUARE_ACCESS_TOKEN", "GOOGLE_MAPS_API_KEY", "CHECKOUT_SIGNING_SECRET", "STORE_TAX_PERCENT", "DELIVERY_FEE_TAXABLE"]) {
    const prior = process.env[key]; delete process.env[key]; const res = await POST(request(input())); assert.equal(res.status, 503, key); process.env[key] = prior;
  }
  process.env.CHECKOUT_ENABLED = "false"; assert.equal((await POST(request(input()))).status, 503);
});
test("rejects cross-site and oversized requests", async () => {
  assert.equal((await POST(request(input(), "https://evil.example"))).status, 403);
  assert.equal((await POST(request({ padding: "x".repeat(21000) }))).status, 413);
});
test("does not expose upstream Square details", async () => {
  upstreamStatus = 401; const res = await POST(request(input())); assert.equal(res.status, 502); assert.doesNotMatch(await res.text(), /PRIVATE_SECRET/);
});
test("signed receipt rejects tampering and expiration", () => {
  const receipt = { orderId: "ORDER", reference, expires: Date.now() + 60000 }; const token = signReceipt(receipt);
  assert.deepEqual(readReceipt(token), receipt); assert.equal(readReceipt(`x${token}`), null); assert.equal(readReceipt(signReceipt({ ...receipt, expires: 1 })), null);
});
test("confirmed payment is checked against Square rather than redirect parameters", async () => {
  const receipt = { orderId: "ORDER", reference, expires: Date.now() + 60000 };
  assert.equal((await getPaymentStatus(receipt)).status, "paid");
  for (const status of ["PENDING", "APPROVED", "FAILED", "CANCELED"]) { paidStatus = status; assert.equal((await getPaymentStatus(receipt)).status, "pending"); }
  paidStatus = "COMPLETED"; refunded = 4200; assert.equal((await getPaymentStatus(receipt)).status, "pending");
  refunded = 0; paymentOrder = "OTHER_ORDER"; assert.equal((await getPaymentStatus(receipt)).status, "pending");
  paymentOrder = "ORDER"; orderState = "CANCELED"; assert.equal((await getPaymentStatus(receipt)).status, "canceled");
  orderLocation = "OTHER_LOCATION"; await assert.rejects(getPaymentStatus(receipt), /verification/);
});
test("removes the test sandwich from the storefront", async () => {
  assert.equal((await getProducts()).some(p => p.id === "99"), false);
});
test("Square catalog mode does not fall back to potentially stale local prices", async () => {
  process.env.CATALOG_SOURCE = "square"; process.env.SQUARE_STOREFRONT_ITEM_IDS = "";
  await assert.rejects(getProducts(), /being prepared/);
});
test("Square catalog reads paginated images, variation prices, sold-out flags and location restrictions", async () => {
  process.env.CATALOG_SOURCE = "square"; process.env.SQUARE_STOREFRONT_ITEM_IDS = "BAKERY";
  const previous = global.fetch;
  const variation = (id: string, extras: Record<string, unknown> = {}) => ({ id, type: "ITEM_VARIATION", item_variation_data: { name: "Regular", pricing_type: "FIXED_PRICING", price_money: { amount: 1300, currency: "USD" }, ...extras } });
  global.fetch = async (url, init) => {
    if (String(url).includes("/catalog/list")) {
      if (String(url).includes("cursor=")) return Response.json({ objects: [{ id: "PHOTO", type: "IMAGE", image_data: { url: "https://example.com/bread.png" } }] });
      return Response.json({ cursor: "page-2", objects: [
        { id: "BAKERY", type: "ITEM", item_data: { name: "Fresh Bread", image_ids: ["PHOTO"], variations: [
          variation("REGULAR", { location_overrides: [{ location_id: "LOC", price_money: { amount: 1500, currency: "USD" } }] }),
          variation("SOLDOUT", { location_overrides: [{ location_id: "LOC", sold_out: true }] }),
          variation("VARIABLE", { pricing_type: "VARIABLE_PRICING" }),
          { ...variation("WRONG_LOCATION"), present_at_all_locations: false, present_at_location_ids: ["OTHER"] },
        ] } },
        { id: "UNLISTED", type: "ITEM", item_data: { name: "Not published", variations: [variation("PRIVATE")] } },
      ] });
    }
    return previous(url, init);
  };
  const products = await getProducts(); assert.equal(products.length, 1); assert.equal(products[0].price, 15);
  assert.equal(products[0].image, "https://example.com/bread.png");
  const prepared = await prepareOrder(checkoutSchema.parse({ ...input(), cart: [{ id: "REGULAR", quantity: 1 }] }));
  assert.equal(prepared.order.line_items[0].catalog_object_id, "REGULAR"); assert.equal(prepared.quote.totalCents, 3100);
});
test("required modifier products are excluded rather than sold without required choices", async () => {
  process.env.CATALOG_SOURCE = "square"; process.env.SQUARE_STOREFRONT_ITEM_IDS = "BAKERY";
  global.fetch = async () => Response.json({ objects: [{ id: "BAKERY", type: "ITEM", item_data: { name: "Custom cake", modifier_list_info: [{ enabled: true, min_selected_modifiers: 1 }],
    variations: [{ id: "VAR", type: "ITEM_VARIATION", item_variation_data: { pricing_type: "FIXED_PRICING", price_money: { amount: 1300, currency: "USD" } } }] } }] });
  assert.deepEqual(await getProducts(), []);
});
test("unavailable Square catalog cannot silently revert to the local menu", async () => {
  process.env.CATALOG_SOURCE = "square"; process.env.SQUARE_STOREFRONT_ITEM_IDS = "BAKERY"; upstreamStatus = 503;
  await assert.rejects(getProducts(), /Square could not process/);
});
