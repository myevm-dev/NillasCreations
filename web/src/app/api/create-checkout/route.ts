// /workspaces/NillasCreations/web/src/app/api/create-checkout/route.ts
import { NextResponse } from "next/server";
import { SquareClient, Square, SquareError } from "square";

export async function POST(req: Request) {
  try {
    const { cart, pickupDate, pickupNotes } = await req.json();

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: "Cart cannot be empty" }, { status: 400 });
    }

    const locationId = process.env.SQUARE_LOCATION_ID;
    const token = process.env.SQUARE_ACCESS_TOKEN;
    if (!token || !locationId) {
      return NextResponse.json(
        { error: "Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID in .env" },
        { status: 500 }
      );
    }

    // dollars -> cents -> BigInt for Square amounts
    const toCents = (n: number) => BigInt(Math.round(n * 100));

    const lineItems: Square.OrderLineItem[] = cart.map((item: any) => ({
      name: String(item.name),
      quantity: String(item.quantity ?? 1),
      basePriceMoney: {
        amount: toCents(Number(item.price)),
        currency: "USD",
      },
    }));

    const client = new SquareClient({ token });

    // Build a checkout link for THIS cart (multi-item supported)
    const resp = await client.checkout.paymentLinks.create({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId,
        lineItems,
        // Use metadata to carry your fulfillment info (shows in Dashboard)
        metadata: {
          pickupDate: pickupDate ?? "",
          pickupNotes: pickupNotes ?? "",
          source: "nillas-web",
        },
        // Optionally attach a reference for your own records
        referenceId: `web-${Date.now()}`,
      },
      checkoutOptions: {
        redirectUrl: "https://nillascreations.com/order-confirmed",
      },
    });

    const url = resp.paymentLink?.url;
    if (!url) {
      return NextResponse.json({ error: "No checkout URL returned" }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl: url });
  } catch (err) {
    // TypeScript: err is unknown, cast for instanceof
    if (err instanceof SquareError) {
      return NextResponse.json(
        { error: err.message, details: err.body ?? null },
        { status: err.statusCode ?? 500 }
      );
    }
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
