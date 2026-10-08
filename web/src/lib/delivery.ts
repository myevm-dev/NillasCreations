import { z } from "zod";
import { DELIVERY_ORIGIN, DELIVERY_RADIUS_MILES, distanceMiles } from "./store";
import { StoreError } from "./square";

export const addressSchema = z.object({
  line1: z.string().trim().min(5).max(150), line2: z.string().trim().max(100).default(""),
  city: z.string().trim().min(2).max(80), state: z.string().trim().length(2).transform(s => s.toUpperCase()),
  zip: z.string().trim().regex(/^\d{5}(?:-\d{4})?$/),
});
export type DeliveryAddress = z.infer<typeof addressSchema>;
type Geocode = { partial_match?: boolean; formatted_address: string;
  address_components: { long_name: string; short_name: string; types: string[] }[];
  geometry: { location: { lat: number; lng: number }; location_type: string } };

export async function checkDelivery(address: DeliveryAddress) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new StoreError("Delivery address checking is not connected yet. Please contact us to order.", 503);
  const params = new URLSearchParams({ key, address: `${address.line1}, ${address.city}, ${address.state} ${address.zip}, USA`, components: "country:US" });
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new StoreError("We could not check that address. Please try again.", 503);
  const data = await response.json() as { status: string; results?: Geocode[] };
  if (data.status === "ZERO_RESULTS") throw new StoreError("We could not find that street address. Please check it and try again.");
  if (data.status !== "OK") throw new StoreError("Address checking is temporarily unavailable. Please try again.", 503);
  const matches = (data.results || []).filter(r => !r.partial_match && ["ROOFTOP", "RANGE_INTERPOLATED"].includes(r.geometry.location_type));
  if (matches.length !== 1) throw new StoreError("Please enter a complete, unambiguous street address.");
  const result = matches[0];
  const component = (type: string) => result.address_components.find(c => c.types.includes(type));
  if (component("country")?.short_name !== "US" || !component("street_number") || !component("route") ||
      component("administrative_area_level_1")?.short_name !== address.state || component("postal_code")?.long_name !== address.zip.slice(0, 5)) {
    throw new StoreError("Please check the street address, state, and ZIP code. We deliver to US addresses only.");
  }
  const miles = distanceMiles(DELIVERY_ORIGIN, result.geometry.location);
  if (!Number.isFinite(miles) || miles > DELIVERY_RADIUS_MILES) throw new StoreError("This address is outside our 20-mile delivery radius from 79936.");
  return { distanceMiles: Math.round(miles * 10) / 10, formattedAddress: result.formatted_address, address: {
    ...address, line1: `${component("street_number")!.long_name} ${component("route")!.long_name}`,
    city: component("locality")?.long_name || component("postal_town")?.long_name || address.city,
  } };
}
