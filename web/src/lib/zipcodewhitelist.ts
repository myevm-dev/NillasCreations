// /workspaces/NillasCreations/web/src/lib/zipcodewhitelist.ts

// List of zip codes we currently deliver to
export const ZIPCODE_WHITELIST: string[] = [
  "79902",
  "79903",
  "79904",
  "79905",
  "79906",
  "79907",
  "79912",
  "79915",
  "79925",
  "79927",
  "79928",
  "79930",
  "79935",
  "79936",
];

// Simple helper to check if a zip is in our delivery area
export function isZipAllowed(zip: string): boolean {
  const cleaned = zip.trim();
  return ZIPCODE_WHITELIST.includes(cleaned);
}