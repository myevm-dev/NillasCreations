# Nilla's Creations

A Next.js storefront for made-to-order baked goods in El Paso, with Square-hosted card checkout and local delivery. The deployable application is in `web/`.

## Commerce infrastructure

Square is the payment processor and order-management system. Customers shop here, review a server-calculated total, and pay on Square's hosted checkout. Orders contain supported shipment fulfillments labeled "Local delivery", contact details, requested delivery times, and notes, so the bakery can manage them in Square Dashboard.

For this single-seller business, an additional Mercur marketplace or Medusa backend is not required. There is no Medusa or Mercur service in this implementation. The catalog is isolated in `web/src/lib/catalog.ts` if a separate commerce backend becomes useful later.

## Delivery rules

- Origin: the geographic center of ZIP 79936, approximately `31.77373, -106.29631`, as selected for this project. No private home address is published.
- Radius: 20 miles measured in a straight line, not driving distance.
- Flat delivery fee: $16 per order, added on the server as a Square order line item.
- Every street address is geocoded again before checkout. Unmatched, ambiguous, approximate, and out-of-radius addresses are rejected. US addresses only.
- Existing preparation policy retained: at least 48 hours notice, delivery between 9 AM and 9 PM in `America/Denver` (El Paso time), up to 90 days ahead.
- Existing menu prices retained, with the $1 test sandwich removed. Up to 24 packages of each product and 48 packages per order; larger orders go through direct contact.
- Checkout submits the server-validated address and does not request another shipping address. Verify the final Square-hosted checkout behavior with the connected account during sandbox testing.

The radius center comes from [ZIP 79936 geographic coordinates](https://simplemaps.com/us-zips/79936/). Constants live in `web/src/lib/store.ts`.

## Local setup

Requires Node.js 22 or newer.

```bash
cd web
npm ci
cp .env.example .env.local
npm run dev
```

Populate `.env.local` using the configuration below. Use Square sandbox credentials for testing. There are no credentials committed to this repository. The public menu works with the local catalog before Square is connected; online checkout stays paused until the required configuration is complete.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check:launch
```

`check:launch` checks required settings, the connected Square location's card-processing capability, and the catalog. It does not charge a card or perform a live geocoding test. The automated tests mock external APIs and do not replace a real Square sandbox checkout.

## Required settings

Set these on the hosting provider, with the application's root directory set to `web`. Secrets stay on the server. Do not put tokens in `NEXT_PUBLIC_*` variables or in GitHub.

| Setting | Value |
| --- | --- |
| `STORE_URL` | The exact site origin, such as `https://www.nillascreations.com`, or `http://localhost:3000` for development. This also controls checkout return URLs and allowed browser request origins. |
| `CHECKOUT_ENABLED` | `true` to accept checkout requests; `false` to pause ordering. Defaults to paused. |
| `SQUARE_ENVIRONMENT` | `sandbox` for testing; `production` for real card payments. Defaults to sandbox. |
| `SQUARE_ACCESS_TOKEN` | The server-side token for your wife's Square merchant account and selected environment. |
| `SQUARE_LOCATION_ID` | The active USD Square location associated with that same account and environment. |
| `CHECKOUT_SIGNING_SECRET` | A random secret of at least 32 characters. Generate it with the command in `.env.example`. |
| `GOOGLE_MAPS_API_KEY` | A server-side key with Google Geocoding API enabled and billing configured. Restrict the key to that API. |
| `STORE_TAX_PERCENT` | Your explicitly confirmed applicable percentage. Set `0` only when appropriate for your products. No tax rate is assumed. |
| `DELIVERY_FEE_TAXABLE` | Explicitly set `true` or `false` according to the bakery's applicable tax treatment. |
| `CATALOG_SOURCE` | `local` to retain the current menu, or `square` to manage the menu in Square Item Library. |
| `SQUARE_STOREFRONT_ITEM_IDS` | Comma-separated Square ITEM IDs to publish when using the Square catalog. This is an allowlist of item IDs, not variation IDs. |

Create/manage the Square application and credentials in the [Square Developer Dashboard](https://developer.squareup.com/apps). Configure the Geocoding key in [Google Cloud Console](https://console.cloud.google.com/). Credentials must belong to the same merchant account your wife uses; production credentials cannot be used with sandbox location IDs.

A single configured tax percentage is applied explicitly, and automatic catalog taxes/discounts are disabled to avoid double charging. If the menu later contains products with different tax treatment or you serve jurisdictions requiring different rates, implement per-product/per-address tax rules before selling those combinations.

## Catalog management

### Current menu

`CATALOG_SOURCE=local` uses the 12 products in `web/src/lib/products.ts`, including their existing pictures, names, and prices. Update that file to change this menu. Local items appear as itemized ad hoc lines in Square orders; they do not automatically synchronize Square inventory.

### Square Item Library

Set `CATALOG_SOURCE=square` and populate `SQUARE_STOREFRONT_ITEM_IDS` with only the items to sell here. Each fixed-price USD variation becomes a purchasable product. Square item images, descriptions, prices, location overrides, archival status, and variation sold-out flags are read on the server. Items unavailable at the selected location are excluded. If Square is unavailable, checkout fails rather than falling back to old local prices.

At checkout the catalog is fetched again. Browser prices are ignored. If the total changes between review and checkout, the customer must review the updated order before payment.

These are made-to-order bakery products. This integration does not reserve finite inventory or enforce numerical inventory counts. Use manual sold-out flags and pause ordering when you reach production capacity. Products with required Square modifier selections are excluded; create separate priced variations for those choices.

Square's native `DELIVERY` fulfillment is a restricted partner beta and can hide orders from Square Order Manager without partner access. This implementation uses standard `SHIPMENT` fulfillments with a local-delivery carrier/type instead. The requested delivery date and El Paso time are saved in the shipping note, the $16 line item note, and order metadata. These orders appear as shipments in Square, and the bakery schedules and completes delivery manually. No partner beta access is required.

## Payment and order handling

- Square handles card details. The application never collects or stores card numbers.
- Customer email/phone are required here and included in the structured Square fulfillment recipient.
- Square calculates the quoted total, including the explicitly configured tax policy.
- Repeating the same checkout request uses the same Square idempotency key.
- A signed, HttpOnly session cookie lets the return page check the corresponding order and completed payments. Redirect parameters alone cannot mark an order paid.
- The cart clears only after Square confirms completed payments covering the order total. Canceled orders, wrong-order payments, failed payments, and refunded amounts do not produce a successful confirmation.
- Keep Square's customer receipt as the durable payment record. If cookies are blocked or the customer changes browsers, the return page cannot independently identify their checkout and directs them to their Square receipt or the bakery.
- No separate webhook database or automatic SMS/email service is installed. Monitor paid delivery orders in Square Dashboard, confirm arrangements directly as needed, and mark fulfillment there after delivery. The site does not automatically dispatch a courier.
- The recurring-basket page offers direct inquiries, not automatic subscriptions.

## Before going live

1. Review the existing menu prices, product photos, contact phone/email, delivery hours, preparation policy, and tax settings with the bakery owner.
2. Configure sandbox credentials, signing secret, Google key, site origin, and explicit tax settings. Enable checkout for testing.
3. Test a complete sandbox card payment from the shop. Confirm the $16 line, total, name, phone, email, apartment, notes, and El Paso delivery time in Square Dashboard. Return to the storefront and verify that the paid confirmation clears the cart.
4. Test valid addresses inside the radius and addresses just outside it. Test an invalid street, incorrect ZIP, canceled checkout, and a failed card. Check the flow on a phone.
5. Deploy `web` as a Next.js application, for example on Vercel, using `npm ci`, `npm run build`, and the production environment settings. Set `STORE_URL` to the actual canonical HTTPS origin and redirect alternate domain variants to it.
6. Use the hosting provider's WAF/rate-limit controls for the POST routes `/api/delivery-quote` and `/api/create-checkout`, and the GET route `/api/order-status`. These routes call paid/external APIs; this repository does not implement a distributed rate-limit service.
7. Review/publish the bakery's customer policies, including privacy, fulfillment, and cancellation terms. Address checking uses Google Geocoding and checkout uses Square; disclose those providers and review their applicable branding/privacy requirements.
8. Switch to production Square credentials, verify `npm run check:launch`, and complete a small real payment and refund to verify the actual merchant connection. Never use test card numbers in production.

Deployment and real payments are not performed by the code changes alone. Production Square credentials, Google configuration, hosting access, tax decisions, and real checkout verification are required to activate sales.

## API references

- [Square Checkout API](https://developer.squareup.com/docs/checkout-api)
- [Square fulfillment requirements](https://developer.squareup.com/docs/orders-api/fulfillments)
- [Square Catalog API](https://developer.squareup.com/docs/catalog-api/what-it-does)
- [Google Geocoding API](https://developers.google.com/maps/documentation/geocoding/requests-geocoding)
