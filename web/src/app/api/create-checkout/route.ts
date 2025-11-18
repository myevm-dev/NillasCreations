// /workspaces/NillasCreations/web/src/app/api/create-checkout/route.ts
import { NextResponse } from "next/server";
import { SquareClient, Square, SquareError } from "square";

export async function POST(req: Request) {
  try {
    const {
      cart,
      pickupDate,
      pickupNotes,
      deliveryAddress,
    } = await req.json();

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

    // build a readable note that shows up on the order in Square
    const noteParts: string[] = [];
    if (pickupDate) noteParts.push(`Delivery date: ${pickupDate}`);
    if (deliveryAddress?.line1) {
      const addr = `${deliveryAddress.line1}${
        deliveryAddress.line2 ? " " + deliveryAddress.line2 : ""
      }, ${deliveryAddress.city ?? ""} ${deliveryAddress.state ?? ""} ${
        deliveryAddress.zip ?? ""
      }`;
      noteParts.push(`Address: ${addr}`);
    }
    if (pickupNotes) noteParts.push(`Notes: ${pickupNotes}`);
    const combinedNote = noteParts.join(" | ");

    const resp = await client.checkout.paymentLinks.create({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId,
        lineItems,
        metadata: {
          pickupDate: pickupDate ?? "",
          pickupNotes: pickupNotes ?? "",
          addressLine1: deliveryAddress?.line1 ?? "",
          addressLine2: deliveryAddress?.line2 ?? "",
          addressCity: deliveryAddress?.city ?? "",
          addressState: deliveryAddress?.state ?? "",
          addressZip: deliveryAddress?.zip ?? "",
          source: "nillas-web",
        },
        note: combinedNote || "Online order from nillascreations.com",
        referenceId: `web-${Date.now()}`,
      },
      checkoutOptions: {
        redirectUrl: "https://www.nillascreations.com/order-confirmed",
      },
    });

    const url = resp.paymentLink?.url;
    if (!url) {
      return NextResponse.json({ error: "No checkout URL returned" }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl: url });
  } catch (err) {
    if (err instanceof SquareError) {
      return NextResponse.json(
        { error: err.message, details: err.body ?? null },
        { status: err.statusCode ?? 500 }
      );
    }
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
