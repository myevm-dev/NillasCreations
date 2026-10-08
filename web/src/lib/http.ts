import { NextResponse } from "next/server";
import { z } from "zod";
import { StoreError } from "./square";

export async function readBody(req: Request) {
  const origin = req.headers.get("origin");
  const allowed = new URL(process.env.STORE_URL || req.url).origin;
  if (origin && origin !== allowed) throw new StoreError("Please order directly from our website.", 403);
  if (!req.headers.get("content-type")?.includes("application/json")) throw new StoreError("Expected a JSON request.", 415);
  if (Number(req.headers.get("content-length")) > 20000) throw new StoreError("Request is too large.", 413);
  const reader = req.body?.getReader();
  if (!reader) throw new StoreError("Invalid request.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 20000) { await reader.cancel(); throw new StoreError("Request is too large.", 413); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString()); }
  catch { throw new StoreError("Invalid request."); }
}

export function apiError(error: unknown) {
  if (error instanceof z.ZodError) return NextResponse.json({ error: "Please check your cart, contact details, delivery address, and schedule.", fields: error.flatten().fieldErrors }, { status: 400 });
  if (error instanceof StoreError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("Store request failed", error instanceof Error ? error.name : "UnknownError");
  return NextResponse.json({ error: "We could not complete this request. Please try again or contact us." }, { status: 503 });
}
