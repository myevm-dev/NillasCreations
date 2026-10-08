import { createHmac, timingSafeEqual } from "node:crypto";
import { checkoutSettings } from "./checkout";

export type Receipt = { orderId: string; reference: string; expires: number };
export function signReceipt(receipt: Receipt) {
  const body = Buffer.from(JSON.stringify(receipt)).toString("base64url");
  return `${body}.${createHmac("sha256", checkoutSettings().secret).update(body).digest("base64url")}`;
}
export function readReceipt(token: string | undefined): Receipt | null {
  if (!token) return null;
  try {
    const [body, signature, extra] = token.split(".");
    if (!body || !signature || extra) return null;
    const expected = createHmac("sha256", checkoutSettings().secret).update(body).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const receipt = JSON.parse(Buffer.from(body, "base64url").toString()) as Receipt;
    return typeof receipt.orderId === "string" && typeof receipt.reference === "string" && receipt.expires > Date.now() ? receipt : null;
  } catch { return null; }
}
