"use client";
import React from "react";
import CashAppPayLink from "./CashAppPayLink";

type Props = {
  open: boolean;
  onClose: () => void;
  cashtag: string;            // e.g. "KCEZ5"
  amount: string;             // e.g. "23.45"
  orderId?: string;
};

export default function PaymentModal({ open, onClose, cashtag, amount, orderId }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-950 p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-semibold text-white">Scan to Pay</h3>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1 text-sm text-gray-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <div className="mt-4">
          {/* Desktop shows QR; mobile users will also see a button (deep link) */}
          <CashAppPayLink cashtag={cashtag} amount={amount} orderId={orderId} qrSize={220} />
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Keep this window open while you complete payment. We’ll verify after you send.
        </p>
      </div>
    </div>
  );
}
