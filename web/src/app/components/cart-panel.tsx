/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "./cart-provider";
import { useRouter } from "next/navigation";
import { isZipAllowed } from "@/lib/zipcodewhitelist";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type Details = {
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

/** Compute default plus earliest allowed delivery slot:
 *  - Start at now plus 48h
 *  - If outside 09:00 to 21:00, set to next day 10:00
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

export function CartPanel() {
  const { items, removeItem, updateQuantity, total, isOpen, setIsOpen } = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const router = useRouter();
  const earliest = useMemo(() => computeDefaultDelivery(), []);
  const [details, setDetails] = useState<Details>({
    notes: "",
    fulfillMethod: "delivery",
    date: earliest.date,
    time: earliest.time,
    address: { line1: "", line2: "", city: "", state: "", zip: "" },
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const MIN_TIME_GENERAL = "09:00";
  const MAX_TIME = "21:00";
  const minTimeForSelectedDate =
    details.date === earliest.date ? earliest.time : MIN_TIME_GENERAL;

  useEffect(() => {
    if (details.time < minTimeForSelectedDate) {
      setDetails((d) => ({ ...d, time: minTimeForSelectedDate }));
    } else if (details.time > MAX_TIME) {
      setDetails((d) => ({ ...d, time: MAX_TIME }));
    }
  }, [details.date, details.time, minTimeForSelectedDate]);

  if (!isOpen) return null;

  const requiresAddress = details.fulfillMethod === "delivery";

  const trimmedZip = details.address.zip.trim();
  const zipAllowed = !trimmedZip || isZipAllowed(trimmedZip);

  const detailsValid =
    details.date &&
    details.time &&
    (!requiresAddress ||
      (details.address.line1.trim() &&
        details.address.city.trim() &&
        details.address.state.trim() &&
        trimmedZip &&
        zipAllowed));

  const startSquareCheckout = async () => {
    try {
      setIsProcessing(true);

      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: items.map((i) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          pickupDate: details.date,
          pickupNotes: details.notes,
          deliveryAddress: details.address,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Failed to create checkout link");
      }

      window.location.href = data.checkoutUrl as string;
    } catch (err: any) {
      alert(err?.message ?? "Failed to start online checkout.");
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card z-50 shadow-2xl animate-in slide-in-from-right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-2xl font-serif font-bold text-card-foreground">
              {step === 1 && "Your Cart"}
              {step === 2 && "Order Details"}
              {step === 3 && "Review and Pay"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between px-6 py-2 text-sm font-medium text-muted-foreground border-b border-border">
            <span className={step === 1 ? "text-primary font-semibold" : ""}>
              Step 1: Cart
            </span>
            <span className={step === 2 ? "text-primary font-semibold" : ""}>
              Step 2: Details
            </span>
            <span className={step === 3 ? "text-primary font-semibold" : ""}>
              Step 3: Pay
            </span>
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
                      <div
                        key={item.id}
                        className="flex gap-4 p-4 bg-background rounded-lg"
                      >
                        <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-card-foreground truncate">
                            {item.name}
                          </h3>
                          <p className="text-sm text-accent font-semibold mt-1">
                            ${item.price.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-transparent"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
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
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
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
                {/* Fulfillment (delivery only for now) */}
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
                    onClick={() =>
                      setDetails((d) => ({ ...d, fulfillMethod: "delivery" }))
                    }
                  >
                    Delivery
                  </Button>
                </div>

                {/* Delivery inputs */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      min={earliest.date}
                      value={details.date}
                      onChange={(e) =>
                        setDetails({ ...details, date: e.target.value })
                      }
                      className="rounded-md border px-3 py-2 bg-background"
                    />
                    <input
                      type="time"
                      min={minTimeForSelectedDate}
                      max={MAX_TIME}
                      value={details.time}
                      onChange={(e) =>
                        setDetails({ ...details, time: e.target.value })
                      }
                      className="rounded-md border px-3 py-2 bg-background"
                    />
                  </div>

                  <input
                    className="w-full rounded-md border px-3 py-2 bg-background"
                    placeholder="Street address"
                    value={details.address.line1}
                    onChange={(e) =>
                      setDetails({
                        ...details,
                        address: { ...details.address, line1: e.target.value },
                      })
                    }
                  />
                  <input
                    className="w-full rounded-md border px-3 py-2 bg-background"
                    placeholder="Apt / Suite (optional)"
                    value={details.address.line2}
                    onChange={(e) =>
                      setDetails({
                        ...details,
                        address: { ...details.address, line2: e.target.value },
                      })
                    }
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      className="rounded-md border px-3 py-2 bg-background"
                      placeholder="City"
                      value={details.address.city}
                      onChange={(e) =>
                        setDetails({
                          ...details,
                          address: { ...details.address, city: e.target.value },
                        })
                      }
                    />
                    <input
                      className="rounded-md border px-3 py-2 bg-background"
                      placeholder="State"
                      value={details.address.state}
                      onChange={(e) =>
                        setDetails({
                          ...details,
                          address: { ...details.address, state: e.target.value },
                        })
                      }
                    />
                    <div>
                      <input
                        className="w-full rounded-md border px-3 py-2 bg-background"
                        placeholder="ZIP"
                        value={details.address.zip}
                        onChange={(e) =>
                          setDetails({
                            ...details,
                            address: { ...details.address, zip: e.target.value },
                          })
                        }
                      />
                      {!zipAllowed && trimmedZip && (
                        <p className="mt-1 text-xs text-red-600">
                          We do not deliver that far yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <textarea
                    className="w-full rounded-md border px-3 py-2 bg-background"
                    placeholder="Notes (flavors, allergies, delivery instructions, etc.)"
                    rows={3}
                    value={details.notes}
                    onChange={(e) =>
                      setDetails({ ...details, notes: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-background p-4">
                  <p className="text-lg font-medium text-card-foreground">
                    Secure online payment
                  </p>
                  <p className="text-muted-foreground">
                    Review your delivery details, then pay with card through our
                    Square checkout page.
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="font-medium">Delivery summary</p>
                  <p className="text-sm text-muted-foreground">
                    Delivery on {details.date} at {details.time}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {details.address.line1}
                    {details.address.line2 ? `, ${details.address.line2}` : ""}{" "}
                    {details.address.city ? `, ${details.address.city}` : ""}{" "}
                    {details.address.state} {details.address.zip}
                  </p>
                  {details.notes && (
                    <p className="text-sm text-muted-foreground">
                      Notes: {details.notes}
                    </p>
                  )}
                  <p className="font-semibold mt-2">
                    Total: ${total.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border p-6 flex gap-3">
              {step > 1 && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                  disabled={isProcessing}
                >
                  Back
                </Button>
              )}
              {step === 1 && (
                <Button className="flex-1" onClick={() => setStep(2)}>
                  Next: Enter Details
                </Button>
              )}
              {step === 2 && (
                <Button
                  className="flex-1"
                  onClick={() => setStep(3)}
                  disabled={!detailsValid}
                >
                  Review Order
                </Button>
              )}
              {step === 3 && (
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isProcessing || !zipAllowed}
                  onClick={startSquareCheckout}
                >
                  {isProcessing ? "Starting checkout..." : "Pay Online"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
