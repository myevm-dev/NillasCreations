"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, Trash2, Truck, LockKeyhole } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "./cart-provider";
import { DELIVERY_FEE_CENTS, earliestSlot, money } from "@/lib/store";

type Quote = { subtotalCents: number; deliveryFeeCents: number; taxCents: number; totalCents: number; distanceMiles: number; formattedAddress: string };
const inputClass = "w-full min-w-0 rounded-md border px-3 py-2 bg-background text-base";
export function CartPanel() {
  const { items, removeItem, updateQuantity, total, isOpen, setIsOpen } = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  const attempt = useRef("");
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState(() => ({ ...earliestSlot(), notes: "", customer: { name: "", email: "", phone: "" },
    address: { line1: "", line2: "", city: "El Paso", state: "TX", zip: "" } }));
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const earliest = earliestSlot();
  useEffect(() => {
    if (isOpen && !dialog.current?.open) dialog.current?.showModal();
    if (!isOpen && dialog.current?.open) dialog.current?.close();
    if (isOpen) {
      const before = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = before; };
    }
  }, [isOpen]);
  useEffect(() => { setStep(1); setQuote(null); setError(""); attempt.current = ""; }, [items]);
  const body = () => {
    if (!attempt.current) attempt.current = crypto.randomUUID();
    return { cart: items.map(i => ({ id: i.id, quantity: i.quantity })), date: details.date, time: details.time,
      notes: details.notes, customer: details.customer, deliveryAddress: details.address, requestId: attempt.current };
  };
  const review = async () => {
    setBusy(true); setError(""); setQuote(null);
    try {
      const res = await fetch("/api/delivery-quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body()) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not check delivery. Please try again.");
      setQuote(data); setStep(3);
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  };
  const pay = async () => {
    if (!quote) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/create-checkout", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body(), expectedTotalCents: quote.totalCents }) });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || "Could not start checkout. Please try again.");
      window.location.assign(data.checkoutUrl);
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); setBusy(false); }
  };
  const addressField = (key: keyof typeof details.address, label: string, autoComplete: string, optional = false) => <label className="block text-sm font-medium space-y-1" key={key}>
    <span>{label}</span><input className={inputClass} autoComplete={autoComplete} required={!optional} value={details.address[key]}
      maxLength={key === "zip" ? 10 : key === "state" ? 2 : 150} pattern={key === "zip" ? "[0-9]{5}(-[0-9]{4})?" : undefined}
      onChange={e => setDetails(d => ({ ...d, address: { ...d.address, [key]: e.target.value } }))} /></label>;
  return <dialog ref={dialog} onCancel={() => setIsOpen(false)} onClose={() => setIsOpen(false)} aria-labelledby="cart-title"
    className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-dvh w-full max-w-md border-0 bg-card text-card-foreground p-0 shadow-2xl backdrop:bg-black/50">
    <form className="flex h-full flex-col" onSubmit={e => { e.preventDefault(); if (step === 2) void review(); else if (step === 3) void pay(); }}>
      <div className="flex items-center justify-between border-b p-5">
        <h2 id="cart-title" className="text-2xl font-serif font-bold">{step === 1 ? "Your Cart" : step === 2 ? "Delivery Details" : "Review and Pay"}</h2>
        <Button type="button" variant="ghost" size="icon" aria-label="Close cart" onClick={() => setIsOpen(false)}><X /></Button>
      </div>
      <div className="px-5 py-3 border-b text-sm text-muted-foreground">Step {step} of 3 · Cart, delivery, payment</div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {step === 1 && (items.length === 0 ? <div className="py-16 text-center space-y-4"><p>Your cart is empty.</p><Button asChild><Link href="/shop" onClick={() => setIsOpen(false)}>Browse baked goods</Link></Button></div> : <>
          {items.map(item => <div key={item.id} className="flex gap-3 rounded-lg bg-background p-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md"><Image src={item.image} alt={item.name} fill unoptimized={item.image.startsWith("https://")} className="object-cover" sizes="80px" /></div>
            <div className="flex-1 min-w-0"><h3 className="font-medium text-sm">{item.name}</h3><p className="font-semibold text-sm mt-1">{money(Math.round(item.price * 100))}</p>
              <div className="flex gap-2 items-center mt-2">
                <Button type="button" variant="outline" size="icon" aria-label={`Decrease ${item.name}`} onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus /></Button>
                <span>{item.quantity}</span><Button type="button" variant="outline" size="icon" aria-label={`Increase ${item.name}`} disabled={item.quantity >= 24} onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus /></Button>
                <Button type="button" variant="ghost" size="icon" className="ml-auto" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.id)}><Trash2 /></Button>
              </div>
            </div></div>)}
          <div className="flex justify-between"><span>Items</span><span>{money(Math.round(total * 100))}</span></div>
          <div className="flex justify-between"><span>Local delivery</span><span>{money(DELIVERY_FEE_CENTS)}</span></div>
          <div className="flex justify-between font-semibold"><span>Subtotal with delivery</span><span>{money(Math.round(total * 100) + DELIVERY_FEE_CENTS)}</span></div>
          <p className="text-sm text-muted-foreground">Any applicable tax is calculated before payment.</p>
        </>)}
        {step === 2 && <>
          <div className="rounded-lg bg-secondary/40 p-3 text-sm flex gap-2"><Truck className="shrink-0 h-5 w-5" /><p>$16 delivery within a 20-mile radius of the center of 79936. At least 48 hours notice. Delivery times are in El Paso time.</p></div>
          {([ ["name", "Full name", "name"], ["email", "Email", "email"], ["phone", "Phone", "tel"] ] as const).map(([key, label, type]) => <label key={key} className="block text-sm font-medium space-y-1"><span>{label}</span><input required type={type === "name" ? "text" : type} autoComplete={type} maxLength={key === "email" ? 254 : 100} className={inputClass} value={details.customer[key]} onChange={e => setDetails(d => ({ ...d, customer: { ...d.customer, [key]: e.target.value } }))} /></label>)}
          <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium space-y-1"><span>Delivery date</span><input required aria-label="Delivery date" type="date" min={earliest.date} className={inputClass} value={details.date} onChange={e => setDetails(d => ({ ...d, date: e.target.value }))} /></label>
            <label className="text-sm font-medium space-y-1"><span>Time in El Paso</span><input required aria-label="Delivery time in El Paso" type="time" min="09:00" max="21:00" step={900} className={inputClass} value={details.time} onChange={e => setDetails(d => ({ ...d, time: e.target.value }))} /></label></div>
          {addressField("line1", "Street address", "address-line1")}{addressField("line2", "Apartment or suite (optional)", "address-line2", true)}
          {addressField("city", "City", "address-level2")}
          <div className="grid grid-cols-2 gap-3">{addressField("state", "State", "address-level1")}{addressField("zip", "ZIP code", "postal-code")}</div>
          <label className="block text-sm font-medium space-y-1"><span>Notes (optional)</span><textarea className={inputClass} maxLength={400} rows={3} value={details.notes} placeholder="Delivery instructions or special requests" onChange={e => setDetails(d => ({ ...d, notes: e.target.value }))} /></label>
        </>}
        {step === 3 && quote && <>
          <div className="rounded-lg border p-4 space-y-2"><h3 className="font-semibold">Your delivery</h3><p>{quote.formattedAddress}{details.address.line2 ? `, ${details.address.line2}` : ""}</p><p>{details.date} at {details.time} (El Paso time)</p><p>{details.customer.name} · {details.customer.phone}</p><p className="break-all">{details.customer.email}</p><p className="text-sm text-muted-foreground">{quote.distanceMiles} miles from the center of 79936</p>{details.notes && <p className="text-sm">{details.notes}</p>}</div>
          <div className="rounded-lg border p-4 space-y-2">{([ ["Items", quote.subtotalCents], ["Delivery", quote.deliveryFeeCents], ["Tax", quote.taxCents], ["Total", quote.totalCents] ] as const).map(([label, cents]) => <div key={label} className={`flex justify-between ${label === "Total" ? "border-t pt-3 font-bold text-lg" : ""}`}><span>{label}</span><span>{money(cents)}</span></div>)}</div>
          <p className="text-sm text-muted-foreground flex gap-2"><LockKeyhole className="shrink-0 h-5 w-5" />Pay by card on Square&apos;s secure checkout. Card details are handled by Square.</p>
        </>}
        {error && <p role="alert" className="rounded-lg bg-destructive/10 text-destructive p-3 text-sm">{error}</p>}
      </div>
      {items.length > 0 && <div className="border-t p-5 flex gap-3">
        {step > 1 && <Button type="button" variant="outline" disabled={busy} onClick={() => { setStep(step - 1); setError(""); }}>Back</Button>}
        {step === 1 ? <Button type="button" className="flex-1" onClick={() => { setStep(2); setError(""); }}>Enter delivery details</Button> :
          <Button type="submit" className="flex-1" disabled={busy || (step === 3 && !quote)}>{busy ? (step === 2 ? "Checking delivery..." : "Opening Square...") : step === 2 ? "Check delivery and review" : `Pay ${money(quote?.totalCents || 0)} by card`}</Button>}
      </div>}
    </form>
  </dialog>;
}
