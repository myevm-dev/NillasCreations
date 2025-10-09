// /src/lib/orderReceipt.ts
import type { ZodTypeAny } from "zod";

export type OrderItem = {
  id: string;
  name: string;
  price: number;   // in USD
  quantity: number;
};

export type Fulfillment =
  | { type: "delivery"; date: string; time: string; address: { line1: string; line2?: string; city: string; state: string; zip: string } }
  | { type: "pickup";   date: string; time: string; };

export type PaymentMethod = "COD" | "Card" | "Cash App" | "Afterpay";

export type OrderDetails = {
  orderNumber: string;
  createdAtISO: string;      // server-side timestamp
  customer: {
    name: string;
    phone: string;           // digits only or +1…
    email?: string;
    isCell?: boolean;
  };
  items: OrderItem[];
  subtotal: number;          // computed
  tax: number;               // computed
  total: number;             // computed
  fulfillment: Fulfillment;
  notes?: string;

  payment: {
    method: PaymentMethod;
    paid: boolean;
  };

  // business identity
  business: {
    name: string;                 // "Nilla’s Creations"
    email: string;                // outbound copy or reply-to
    phone?: string;
    website?: string;
  };
};

// ---------- helpers ----------

export function makeOrderNumber(): string {
  // Simple: YYMMDD-XXXX  (replace with your ID strategy)
  const d = new Date();
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${y}${m}${day}-${rand}`;
}

export function cents(n: number) {
  return `$${n.toFixed(2)}`;
}

export function computeTotals(items: OrderItem[], taxRate = 0): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = +(subtotal * taxRate).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  return { subtotal, tax, total };
}

// Map carrier → email gateway; fill the one your wife uses.
export const SMS_GATEWAYS: Record<string, (digits: string) => string> = {
  att: (d) => `${d}@txt.att.net`,
  verizon: (d) => `${d}@vtext.com`,
  tmobile: (d) => `${d}@tmomail.net`,
  uscellular: (d) => `${d}@email.uscc.net`,
  googlefi: (d) => `${d}@msg.fi.google.com`,
};

export function phoneDigits(p: string) {
  const d = p.replace(/[^\d]/g, "");
  return d.length === 11 && d.startsWith("1") ? d.slice(1) : d; // normalize to 10
}

// ---------- receipt builders ----------

export function buildReceiptSubject(order: OrderDetails) {
  return `Order ${order.orderNumber} - ${order.business.name}`;
}

export function buildReceiptText(order: OrderDetails): string {
  const f = order.fulfillment;
  const addr =
    f.type === "delivery"
      ? `Delivery: ${f.date} ${f.time}\n  ${f.address.line1}${f.address.line2 ? ", " + f.address.line2 : ""}\n  ${f.address.city}, ${f.address.state} ${f.address.zip}`
      : `Pickup: ${f.date} ${f.time}`;

  const items = order.items
    .map((i) => `  • ${i.name} x${i.quantity} — ${cents(i.price * i.quantity)}`)
    .join("\n");

  return [
    `${order.business.name}`,
    `${order.business.website ?? ""}`,
    "",
    `Order #: ${order.orderNumber}`,
    `Date: ${new Date(order.createdAtISO).toLocaleString()}`,
    "",
    `Customer: ${order.customer.name}`,
    `Phone: ${order.customer.phone}${order.customer.isCell ? " (cell)" : ""}`,
    order.customer.email ? `Email: ${order.customer.email}` : "",
    "",
    items,
    "",
    `Subtotal: ${cents(order.subtotal)}`,
    `Tax: ${cents(order.tax)}`,
    `Total: ${cents(order.total)}`,
    "",
    `Payment: ${order.payment.method} — ${order.payment.paid ? "PAID" : "NOT PAID"}`,
    "",
    addr,
    order.notes ? `\nNotes: ${order.notes}` : "",
    "\nThank you!"
  ].filter(Boolean).join("\n");
}

export function buildReceiptHTML(order: OrderDetails): string {
  const f = order.fulfillment;
  const addr =
    f.type === "delivery"
      ? `<div><strong>Delivery:</strong> ${f.date} ${f.time}<br/>${f.address.line1}${f.address.line2 ? ", " + f.address.line2 : ""}<br/>${f.address.city}, ${f.address.state} ${f.address.zip}</div>`
      : `<div><strong>Pickup:</strong> ${f.date} ${f.time}</div>`;

  const items = order.items.map(
    (i) => `<tr>
      <td style="padding:8px 0">${i.name} <span style="color:#666">× ${i.quantity}</span></td>
      <td style="text-align:right;padding:8px 0">${cents(i.price * i.quantity)}</td>
    </tr>`
  ).join("");

  return `<!doctype html>
<html>
<head>
  <meta charSet="utf-8" />
  <title>Receipt ${order.orderNumber}</title>
</head>
<body style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color:#222; background:#fff; margin:0; padding:24px;">
  <div style="max-width:640px;margin:0 auto;">
    <h1 style="margin:0 0 4px;">${order.business.name}</h1>
    ${order.business.website ? `<div style="color:#666;margin-bottom:16px;">${order.business.website}</div>` : ""}

    <div style="display:flex;justify-content:space-between;border-top:1px solid #eee;border-bottom:1px solid #eee;padding:12px 0;margin:12px 0;">
      <div><strong>Order #</strong> ${order.orderNumber}</div>
      <div><strong>Date</strong> ${new Date(order.createdAtISO).toLocaleString()}</div>
    </div>

    <h3 style="margin:16px 0 8px;">Customer</h3>
    <div>${order.customer.name}</div>
    <div>${order.customer.phone}${order.customer.isCell ? " (cell)" : ""}</div>
    ${order.customer.email ? `<div>${order.customer.email}</div>` : ""}

    <h3 style="margin:16px 0 8px;">Items</h3>
    <table style="width:100%;border-collapse:collapse;">
      ${items}
      <tr><td style="border-top:1px solid #eee;padding-top:8px;color:#666;">Subtotal</td><td style="text-align:right;border-top:1px solid #eee;padding-top:8px;">${cents(order.subtotal)}</td></tr>
      <tr><td style="color:#666;">Tax</td><td style="text-align:right;">${cents(order.tax)}</td></tr>
      <tr><td style="font-weight:700;padding-top:4px;">Total</td><td style="text-align:right;font-weight:700;padding-top:4px;">${cents(order.total)}</td></tr>
    </table>

    <h3 style="margin:16px 0 8px;">Payment</h3>
    <div>${order.payment.method} — <strong>${order.payment.paid ? "PAID" : "NOT PAID"}</strong></div>

    <h3 style="margin:16px 0 8px;">Fulfillment</h3>
    ${addr}

    ${order.notes ? `<h3 style="margin:16px 0 8px;">Notes</h3><div>${order.notes}</div>` : ""}

    <div style="border-top:1px solid #eee;margin-top:24px;padding-top:12px;color:#666;font-size:12px;">
      Questions? ${order.business.email}${order.business.phone ? ` • ${order.business.phone}` : ""} <br/>
      Built by <a href="https://myevm.org" target="_blank" rel="noreferrer">MyEVM</a>
    </div>
  </div>
</body>
</html>`;
}
