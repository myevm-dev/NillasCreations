// /workspaces/NillasCreations/web/src/app/order-confirmed/page.tsx

"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function OrderConfirmedPage() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transactionId");
  const orderId = searchParams.get("orderId");

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-lg">
        <h1 className="text-3xl font-serif font-bold mb-4 text-card-foreground">
          Thank you for your order!
        </h1>
        <p className="text-muted-foreground mb-4">
          Your payment was processed securely through Square.
          We will send a text or email with your order details and pickup or delivery time.
        </p>

        {transactionId && (
          <p className="text-xs text-muted-foreground mb-1">
            Transaction ID: <span className="font-mono">{transactionId}</span>
          </p>
        )}
        {orderId && (
          <p className="text-xs text-muted-foreground mb-4">
            Order ID: <span className="font-mono">{orderId}</span>
          </p>
        )}

        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Back to shop
        </Link>
      </div>
    </main>
  );
}
