// /workspaces/NillasCreations/web/src/app/api/create-checkout/route.ts
import { NextResponse } from "next/server";
import { SquareClient, SquareError } from "square";

type DeliveryAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
};

function formatDeliveryNote(args: {
  pickupDate?: string;
  deliveryAddress?: DeliveryAddress | null;
  pickupNotes?: string;
}) {
  const { pickupDate, deliveryAddress, pickupNotes } = args;

  const lines: string[] = [];

  if (pickupDate) {
    lines.push(`Date: ${pickupDate}`);
  }

  if (deliveryAddress) {
    const { line1, line2, city, state, zip } = deliveryAddress;
    if (line1) {
      lines.push(
        `Address: ${line1}${line2 ? `, ${line2}` : ""}`
      );
    }
    if (city || state || zip) {
      lines.push(
        `         ${city || ""}${city && (state || zip) ? ", " : ""}${
          state || ""
        } ${zip || ""}`.trimEnd()
      );
    }
  }

  if (pickupNotes) {
    lines.push(`Notes: ${pickupNotes}`);
  }

  if (lines.length === 0) {
    return "";
  }

  return ["DELIVERY DETAILS", ...lines].join("\n");
}

export async function POST(req: Request) {
  try {
    const {
      cart,
      pickupDate,
      pickupNotes,
      deliveryAddress,
      customerName,
      customerPhone,
      customerEmail,
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

    const lineItems = cart.map((item: any) => ({
      name: String(item.name),
      quantity: String(item.quantity ?? 1),
      basePriceMoney: {
        amount: toCents(Number(item.price)),
        currency: "USD" as const,
      },
    }));

    // Metadata for API / future use
    const metadata: Record<string, string> = {
      source: "nillas-web",
    };

    if (pickupDate) metadata.pickupDate = pickupDate;
    if (pickupNotes) metadata.pickupNotes = pickupNotes;
    if (customerName) metadata.customerName = customerName;
    if (customerPhone) metadata.customerPhone = customerPhone;
    if (customerEmail) metadata.customerEmail = customerEmail;

    if (deliveryAddress?.line1) metadata.addressLine1 = deliveryAddress.line1;
    if (deliveryAddress?.line2) metadata.addressLine2 = deliveryAddress.line2;
    if (deliveryAddress?.city) metadata.addressCity = deliveryAddress.city;
    if (deliveryAddress?.state) metadata.addressState = deliveryAddress.state;
    if (deliveryAddress?.zip) metadata.addressZip = deliveryAddress.zip;

    const client = new SquareClient({ token });

    // Human readable note visible inside Square Orders
    const orderNote = formatDeliveryNote({
      pickupDate,
      deliveryAddress,
      pickupNotes,
    });

    const resp = await client.checkout.paymentLinks.create({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId,
        lineItems,
        metadata,
        referenceId: `web-${Date.now()}`,
        // This shows up clearly on the order in Dashboard
        ...(orderNote ? { note: orderNote } : {}),
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

    console.error("create-checkout error", err);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
