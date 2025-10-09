/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "./cart-provider";
import { useRouter } from "next/navigation";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type Details = {
  name: string;
  phone: string;
  email?: string;                 // NEW: optional email for receipt
  isCell: boolean;
  notes: string;
  fulfillMethod: "pickup" | "delivery";
  date: string;
  time: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
  };
};

/** Compute default + earliest allowed delivery slot:
 *  - Start at now + 48h
 *  - If outside 09:00–21:00, set to next day 10:00
 */
function computeDefaultDelivery(now = new Date()) {
  const t = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const hour = t.getHours();
  if (hour < 9 || hour >= 21) {
    t.setDate(t.getDate() + 1);
    t.setHours(10, 0, 0, 0);
  } else {
    t.setMinutes(Math.round(t.getMinutes() / 5) * 5, 0, 0);
  }
  const date = t.toISOString().slice(0, 10);
  const time = t.toTimeString().slice(0, 5); // HH:mm
  return { date, time };
}

async function placeOrder(orderPayload: any) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Order failed");
  return data as { ok: true; orderNumber: string; receiptHTML: string; filename: string };
}

async function placeOrderAndDownload(orderPayload: any) {
  const data = await placeOrder(orderPayload);

  // Download HTML receipt (PDF later if you want)
  const blob = new Blob([data.receiptHTML], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = data.filename || "receipt.html";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return data.orderNumber;
}

export function CartPanel() {
  const { items, removeItem, updateQuantity, total, isOpen, setIsOpen } = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const router = useRouter();
  const earliest = useMemo(() => computeDefaultDelivery(), []);
  const [details, setDetails] = useState<Details>({
    name: "",
    phone: "",
    email: "",                   // NEW: start empty
    isCell: true,
    notes: "",
    fulfillMethod: "delivery",
    date: earliest.date,
    time: earliest.time,
    address: { line1: "", line2: "", city: "", state: "", zip: "" },
  });

  // Step 3 choices
  const [wantsDownload, setWantsDownload] = useState(true);
  const [wantsEmailReceipt, setWantsEmailReceipt] = useState(false);

  const MIN_TIME_GENERAL = "09:00";
  const MAX_TIME = "21:00";
  const minTimeForSelectedDate = details.date === earliest.date ? earliest.time : MIN_TIME_GENERAL;

  useEffect(() => {
    if (details.time < minTimeForSelectedDate) {
      setDetails((d) => ({ ...d, time: minTimeForSelectedDate }));
    } else if (details.time > MAX_TIME) {
      setDetails((d) => ({ ...d, time: MAX_TIME }));
    }
  }, [details.date, details.time, minTimeForSelectedDate]);

  if (!isOpen) return null;

  const requiresAddress = details.fulfillMethod === "delivery";
  const detailsValid =
    details.name.trim().length > 0 &&
    details.phone.trim().length > 0 &&
    details.date &&
    details.time &&
    (!requiresAddress ||
      (details.address.line1.trim() &&
        details.address.city.trim() &&
        details.address.state.trim() &&
        details.address.zip.trim()));

  // Build the payload we POST
  const buildPayload = () => ({
    customer: {
      name: details.name,
      phone: details.phone,
      email: details.email?.trim() || undefined,
      isCell: details.isCell,
    },
    items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
    fulfillment:
      details.fulfillMethod === "delivery"
        ? { type: "delivery", date: details.date, time: details.time, address: details.address }
        : { type: "pickup", date: details.date, time: details.time },
    notes: details.notes,
    payment: { method: "COD", paid: false },
    // The API route should read this and email the customer copy if true:
    sendCustomerCopy: Boolean(wantsEmailReceipt && details.email && details.email.includes("@")),
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 animate-in fade-in" onClick={() => setIsOpen(false)} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card z-50 shadow-2xl animate-in slide-in-from-right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-2xl font-serif font-bold text-card-foreground">
              {step === 1 && "Your Cart"}
              {step === 2 && "Your Details"}
              {step === 3 && "Confirm Order"}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between px-6 py-2 text-sm font-medium text-muted-foreground border-b border-border">
            <span className={step === 1 ? "text-primary font-semibold" : ""}>Step 1: Cart</span>
            <span className={step === 2 ? "text-primary font-semibold" : ""}>Step 2: Details</span>
            <span className={step === 3 ? "text-primary font-semibold" : ""}>Step 3: Confirm</span>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* STEP 1 */}
            {step === 1 && (
              <>
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-muted-foreground mb-2">Your cart is empty</p>
                    <Button
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/shop");
                      }}
                      variant="outline"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-background rounded-lg">
                        <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-card-foreground truncate">{item.name}</h3>
                          <p className="text-sm text-accent font-semibold mt-1">${item.price.toFixed(2)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-transparent"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center text-card-foreground">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-transparent"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Fulfillment */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 opacity-50 cursor-not-allowed"
                    disabled
                    aria-disabled="true"
                  >
                    Pickup (soon)
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    className="flex-1"
                    onClick={() => setDetails((d) => ({ ...d, fulfillMethod: "delivery" }))}
                  >
                    Delivery
                  </Button>
                </div>

                {/* Inputs */}
                <input
                  className="w-full rounded-md border px-3 py-2 bg-background"
                  placeholder="Your name"
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                />
                <input
                  className="w-full rounded-md border px-3 py-2 bg-background"
                  placeholder="Phone"
                  value={details.phone}
                  onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                />
                <input
                  className="w-full rounded-md border px-3 py-2 bg-background"
                  placeholder="Email (optional, to receive a receipt)"
                  type="email"
                  value={details.email || ""}
                  onChange={(e) => setDetails({ ...details, email: e.target.value })}
                />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={details.isCell}
                    onChange={(e) => setDetails({ ...details, isCell: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  Cell phone (checked if we can text updates)
                </label>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    min={earliest.date}
                    value={details.date}
                    onChange={(e) => setDetails({ ...details, date: e.target.value })}
                    className="rounded-md border px-3 py-2 bg-background"
                  />
                  <input
                    type="time"
                    min={minTimeForSelectedDate}
                    max={MAX_TIME}
                    value={details.time}
                    onChange={(e) => setDetails({ ...details, time: e.target.value })}
                    className="rounded-md border px-3 py-2 bg-background"
                  />
                </div>

                {/* Address */}
                <div className="space-y-3">
                  <input
                    className="w-full rounded-md border px-3 py-2 bg-background"
                    placeholder="Street address"
                    value={details.address.line1}
                    onChange={(e) =>
                      setDetails({ ...details, address: { ...details.address, line1: e.target.value } })
                    }
                  />
                  <input
                    className="w-full rounded-md border px-3 py-2 bg-background"
                    placeholder="Apt / Suite (optional)"
                    value={details.address.line2}
                    onChange={(e) =>
                      setDetails({ ...details, address: { ...details.address, line2: e.target.value } })
                    }
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      className="rounded-md border px-3 py-2 bg-background"
                      placeholder="City"
                      value={details.address.city}
                      onChange={(e) =>
                        setDetails({ ...details, address: { ...details.address, city: e.target.value } })
                      }
                    />
                    <input
                      className="rounded-md border px-3 py-2 bg-background"
                      placeholder="State"
                      value={details.address.state}
                      onChange={(e) =>
                        setDetails({ ...details, address: { ...details.address, state: e.target.value } })
                      }
                    />
                    <input
                      className="rounded-md border px-3 py-2 bg-background"
                      placeholder="ZIP"
                      value={details.address.zip}
                      onChange={(e) =>
                        setDetails({ ...details, address: { ...details.address, zip: e.target.value } })
                      }
                    />
                  </div>
                </div>

                {/* Notes */}
                <textarea
                  className="w-full rounded-md border px-3 py-2 bg-background"
                  placeholder="Notes (flavors, allergies, delivery instructions, etc.)"
                  rows={3}
                  value={details.notes}
                  onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                />
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-background p-4">
                  <p className="text-lg font-medium text-card-foreground">Cash on Delivery 💵</p>
                  <p className="text-muted-foreground">
                    We’ll confirm by text and collect payment on delivery/pickup.
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="font-medium">Summary</p>
                  <p className="text-sm text-muted-foreground">
                    {details.name || "Customer"} • {details.phone || "No phone"}{" "}
                    {details.isCell ? "📱" : "☎️"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Delivery • {details.date} {details.time}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {details.address.line1}
                    {details.address.line2 ? `, ${details.address.line2}` : ""}
                    {details.address.city ? `, ${details.address.city}` : ""} {details.address.state}{" "}
                    {details.address.zip}
                  </p>
                  {details.notes && (
                    <p className="text-sm text-muted-foreground">Notes: {details.notes}</p>
                  )}
                  <p className="font-semibold mt-2">Total: ${total.toFixed(2)}</p>
                </div>

                {/* Receipt options */}
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <p className="font-medium">Receipt</p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={wantsDownload}
                      onChange={(e) => setWantsDownload(e.target.checked)}
                    />
                    Download receipt after placing order
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={wantsEmailReceipt}
                      onChange={(e) => setWantsEmailReceipt(e.target.checked)}
                      disabled={!details.email || !details.email.includes("@")}
                    />
                    Email me a copy {(!details.email || !details.email.includes("@")) && (
                      <span className="text-muted-foreground">(enter a valid email above)</span>
                    )}
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border p-6 flex gap-3">
              {step > 1 && (
                <Button variant="outline" className="flex-1" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
                  Back
                </Button>
              )}
              {step === 1 && <Button className="flex-1" onClick={() => setStep(2)}>Next</Button>}
              {step === 2 && (
                <Button className="flex-1" onClick={() => setStep(3)} disabled={!detailsValid}>
                  Review Order
                </Button>
              )}
              {step === 3 && (
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={async () => {
                    try {
                      const payload = buildPayload();
                      if (wantsDownload) {
                        await placeOrderAndDownload(payload);
                      } else {
                        await placeOrder(payload);
                      }
                      // Success UX — you can replace with toast
                      alert("Order placed! Cash on delivery confirmed.");
                      setIsOpen(false);
                      setStep(1);
                    } catch (err: any) {
                      alert(err?.message ?? "Failed to place order.");
                    }
                  }}
                >
                  Confirm Order
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
