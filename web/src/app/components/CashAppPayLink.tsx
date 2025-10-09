// File: web/src/app/components/CashAppPayLink.tsx
"use client";

import { useState } from "react";

type Props = {
  cashtag: string;              // e.g. "nillasbakes" (no $)
  amount?: string;              // e.g. "12.50" (optional)
  orderId?: string;             // display only (not sent)
  qrSize?: number;              // px (default 160)
  buttonLabel?: string;         // override mobile button text
  className?: string;           // wrapper classes
};

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export default function CashAppPayLink({
  cashtag,
  amount,
  orderId,
  qrSize = 160,
  buttonLabel,
  className = "",
}: Props) {
  const payUrl = `https://cash.app/$${encodeURIComponent(cashtag)}${
    amount ? `/${encodeURIComponent(amount)}` : ""
  }`;

  // Google static QR endpoint (no deps)
  const qrSrc = `https://chart.googleapis.com/chart?chs=${qrSize}x${qrSize}&cht=qr&chl=${encodeURIComponent(
    payUrl
  )}`;

  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      } else {
        // Fallback
        const ta = document.createElement("textarea");
        ta.value = payUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      // no-op
    }
  }

  // Mobile: direct deep link so OS routes to app if installed
  if (isMobile()) {
    return (
      <a
        href={payUrl}
        aria-label={`Pay${amount ? ` $${amount}` : ""} to $${cashtag} on Cash App`}
        className="inline-flex items-center justify-center rounded-lg px-4 py-3 bg-green-600 text-white font-medium hover:bg-green-500 active:translate-y-px"
      >
        {buttonLabel ?? `Pay${amount ? ` $${amount}` : ""} in Cash App`}
      </a>
    );
  }

  // Desktop: show QR + link + copy
  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-black/50 ${className}`}
    >
      <img
        src={qrSrc}
        width={qrSize}
        height={qrSize}
        alt={`Scan to pay${amount ? ` $${amount}` : ""} to $${cashtag} in Cash App`}
        className="rounded-lg border border-white/10"
        referrerPolicy="no-referrer"
      />

      <div className="space-y-2">
        <div className="text-white text-lg font-semibold">
          Scan to pay{amount ? ` $${amount}` : ""} @ ${cashtag}
        </div>
        {orderId && <div className="text-gray-300 text-sm">Order #{orderId}</div>}

        <div className="text-gray-400 text-xs break-all select-all">{payUrl}</div>

        <div className="flex gap-2">
          <a
            href={payUrl}
            className="px-3 py-2 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200"
          >
            Open in browser
          </a>
          <button
            onClick={copyUrl}
            className="px-3 py-2 rounded-md bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 active:translate-y-px"
            aria-live="polite"
          >
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Tip: Use your phone’s camera or Cash App scanner to read the QR.
        </p>
      </div>
    </div>
  );
}
