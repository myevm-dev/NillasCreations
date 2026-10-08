"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { useCart } from "../components/cart-provider";

export default function OrderConfirmedPage() {
  const reference = useSearchParams().get("reference");
  const { clearCart } = useCart();
  const [state, setState] = useState("checking");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;
    let tries = 0;
    const check = async () => {
      if (!reference) { setState("error"); setMessage("Check your Square receipt or contact us to verify your order."); return; }
      try {
        const res = await fetch(`/api/order-status?reference=${encodeURIComponent(reference)}`, { cache: "no-store" });
        const data = await res.json();
        if (!active) return;
        if (!res.ok) throw new Error(data.error);
        setState(data.status); setOrderId(data.orderId);
        if (data.status === "paid") { clearCart(); return; }
        if (data.status === "pending" && ++tries < 8) timeout = setTimeout(check, 3000);
      } catch (e) { if (active) { setState("error"); setMessage(e instanceof Error ? e.message : "Payment verification is temporarily unavailable."); } }
    };
    void check();
    return () => { active = false; clearTimeout(timeout); };
    // Only a new checkout reference or an explicit retry should restart polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, retry]);
  const paid = state === "paid";
  return <main className="min-h-[70vh] flex items-center justify-center px-4 py-16"><div className="max-w-md w-full bg-card border rounded-2xl p-8 text-center shadow-lg space-y-5" aria-live="polite">
    {paid ? <CheckCircle2 className="mx-auto h-14 w-14 text-primary" /> : <Clock className="mx-auto h-14 w-14 text-primary" />}
    <h1 className="text-3xl font-serif font-bold">{paid ? "Thank you for your order!" : state === "checking" ? "Checking your payment" : state === "canceled" ? "Order canceled" : "Payment not yet confirmed"}</h1>
    <p className="text-muted-foreground">{paid ? "Square confirmed your payment. Your scheduled delivery and contact details are saved with your order. Keep your Square receipt for your records." : message || "We are waiting for Square to confirm payment. If you paid, keep your Square receipt and check again. Your cart is saved."}</p>
    {orderId && <p className="text-xs break-all">Order: {orderId}</p>}
    {!paid && state !== "checking" && <button className="underline text-sm" onClick={() => { setState("checking"); setMessage(""); setRetry(n => n + 1); }}>Check payment again</button>}
    <div><Link href="/shop" className="inline-flex rounded-md bg-primary text-primary-foreground px-4 py-2">Back to shop</Link></div>
    <a className="block underline text-sm" href="tel:+19704816347">Contact Nilla&apos;s Creations</a>
  </div></main>;
}
