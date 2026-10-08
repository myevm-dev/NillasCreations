import { NextResponse } from "next/server";
import { checkoutSchema, prepareOrder } from "@/lib/checkout";
import { apiError, readBody } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const input = checkoutSchema.parse(await readBody(req));
    const { quote } = await prepareOrder(input);
    return NextResponse.json(quote, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
