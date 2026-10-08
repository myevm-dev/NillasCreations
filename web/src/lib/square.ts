export class StoreError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function squareConfiguration() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT || "sandbox";
  if (!["sandbox", "production"].includes(environment)) throw new StoreError("Online checkout is temporarily unavailable.", 503);
  if (!token || !locationId) throw new StoreError("Online checkout is not connected yet. Please contact us to order.", 503);
  return { token, locationId, environment, base: environment === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com" };
}

export async function squareRequest<T>(path: string, body?: unknown): Promise<T> {
  const config = squareConfiguration();
  const response = await fetch(`${config.base}/v2${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Square-Version": "2026-09-16", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    // Do not expose upstream responses, credentials, or customer information.
    console.error("Square request failed", { status: response.status, path: path.split("?")[0] });
    throw new StoreError("Square could not process this request. Please try again or contact us.", 502);
  }
  return response.json() as Promise<T>;
}
