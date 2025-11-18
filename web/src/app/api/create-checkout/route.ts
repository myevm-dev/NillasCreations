// /workspaces/NillasCreations/web/src/app/api/create-checkout/route.ts
import { NextResponse } from "next/server";
import { SquareClient, SquareError } from "square";

type CartItem = {
  name: string;
  price: number;
  quantity: number;
};

type DeliveryAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
};

type CreateCheckoutBody = {
  cart: CartItem[];
  pickupDate?: string;   // delivery date
  pickupTime?: string;   // delivery time (HH:mm)
  pickupNotes?: string;
  deliveryAddress?: DeliveryAddress;
};

export async function POST(req: Request) {
  try {
    const {
      cart,
      pickupDate,
      pickupTime,
      pickupNotes,
      deliveryAddress,
    } = (await req.json()) as CreateCheckoutBody;

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { error: "Cart cannot be empty" },
        { status: 400 }
      );
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

    const lineItems: any[] = cart.map((item) => ({
      name: String(item.name),
      quantity: String(item.quantity ?? 1),
      basePriceMoney: {
        amount: toCents(Number(item.price)),
        currency: "USD" as const,
      },
    }));

    // Build a human readable note that will show on the order in Dashboard
    const noteParts: string[] = [];

    if (pickupDate || pickupTime) {
      noteParts.push(
        `Delivery: ${pickupDate ?? "date TBA"}${
          pickupTime ? ` at ${pickupTime}` : ""
        }`
      );
    }

    if (deliveryAddress) {
      const addr = [
        deliveryAddress.line1,
        deliveryAddress.line2,
        deliveryAddress.city,
        deliveryAddress.state,
        deliveryAddress.zip,
      ]
        .filter(Boolean)
        .join(", ");
      if (addr) {
        noteParts.push(`Address: ${addr}`);
      }
    }

    if (pickupNotes) {
      noteParts.push(`Notes: ${pickupNotes}`);
    }

    const orderNote = noteParts.join(" | ") || undefined;

    // Metadata is useful for webhooks / later lookup (not shown in Dashboard)
    const metadata: Record<string, string> = { source: "nillas-web" };
    if (pickupDate) metadata.pickupDate = pickupDate;
    if (pickupTime) metadata.pickupTime = pickupTime;
    if (pickupNotes) metadata.pickupNotes = pickupNotes;
    if (deliveryAddress?.line1) metadata.addressLine1 = deliveryAddress.line1;
    if (deliveryAddress?.line2) metadata.addressLine2 = deliveryAddress.line2;
    if (deliveryAddress?.city) metadata.addressCity = deliveryAddress.city;
    if (deliveryAddress?.state) metadata.addressState = deliveryAddress.state;
    if (deliveryAddress?.zip) metadata.addressZip = deliveryAddress.zip;

    const client = new SquareClient({ token });

    // Cast to any so TS does not complain about note
    const order: any = {
      locationId,
      lineItems,
      metadata,
      referenceId: `web-${Date.now()}`,
    };

    if (orderNote) {
      order.note = orderNote;
    }

    const resp = await client.checkout.paymentLinks.create({
      idempotencyKey: crypto.randomUUID(),
      order,
      checkoutOptions: {
        redirectUrl: "https://www.nillascreations.com/order-confirmed",
      },
    });

    const url = resp.paymentLink?.url;
    if (!url) {
      return NextResponse.json(
        { error: "No checkout URL returned" },
        { status: 502 }
      );
    }

    return NextResponse.json({ checkoutUrl: url });
  } catch (err) {
    if (err instanceof SquareError) {
      return NextResponse.json(
        { error: err.message, details: err.body ?? null },
        { status: err.statusCode ?? 500 }
      );
    }

    console.error("create-checkout error", err);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
