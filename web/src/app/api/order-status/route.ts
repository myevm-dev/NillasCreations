import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/payment-status";
import { apiError } from "@/lib/http";
import { readReceipt } from "@/lib/receipts";
import { StoreError } from "@/lib/square";

export const runtime = "nodejs";
export async function GET(req: Request) {
  try {
    const receipt = readReceipt((await cookies()).get("nillas-receipt")?.value);
    const reference = new URL(req.url).searchParams.get("reference");
    if (!receipt || reference !== receipt.reference) throw new StoreError("We could not verify this checkout session. Check your Square receipt or contact us.", 403);
    return NextResponse.json(await getPaymentStatus(receipt), { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) { return apiError(error); }
}
