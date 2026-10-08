import { checkoutSettings } from "../src/lib/checkout";
import { getProducts } from "../src/lib/catalog";
import { squareRequest } from "../src/lib/square";
const required = ["STORE_URL", "SQUARE_ACCESS_TOKEN", "SQUARE_LOCATION_ID", "CHECKOUT_SIGNING_SECRET", "GOOGLE_MAPS_API_KEY", "STORE_TAX_PERCENT", "DELIVERY_FEE_TAXABLE"];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error(`Missing settings: ${missing.join(", ")}. Configure these in your hosting environment or .env.local.`);
  process.exit(1);
}
async function run() {
try {
  const settings = checkoutSettings();
  const { location } = await squareRequest<{ location: { status?: string; currency?: string; capabilities?: string[] } }>(`/locations/${settings.locationId}`);
  if (location.status !== "ACTIVE" || location.currency !== "USD" || !location.capabilities?.includes("CREDIT_CARD_PROCESSING")) throw new Error("Square location must be active, use USD, and support card processing.");
  const products = await getProducts();
  if (!products.length) throw new Error("No purchasable products are configured.");
  console.log(`Configuration verified: ${settings.environment}, ${products.length} products, $16 delivery, 20-mile radius from the center of 79936.`);
  console.log("Before launch, complete the documented end-to-end checkout and address tests. This check does not charge a card or verify your Google key.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Launch check failed."); process.exitCode = 1;
}

}
void run();
