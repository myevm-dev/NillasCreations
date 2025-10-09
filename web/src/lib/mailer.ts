// /src/lib/mailer.ts
import "server-only";                        // <- keep this first
import nodemailer, { Transporter } from "nodemailer";
import {
  buildReceiptHTML,
  buildReceiptText,
  buildReceiptSubject,
  SMS_GATEWAYS,
  phoneDigits,
} from "./orderReceipt";
import type { OrderDetails } from "./orderReceipt";

// SMTP transport (use app password for Gmail or your SMTP creds)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

export async function sendReceiptEmails(
  order: OrderDetails,
  opts: {
    sendToWifeEmail: string;                // your wife’s real email
    smsCarrier?: keyof typeof SMS_GATEWAYS; // e.g. "verizon"
    smsEnable?: boolean;                    // default true
  }
) {
  const subject = buildReceiptSubject(order);
  const html = buildReceiptHTML(order);
  const text = buildReceiptText(order);

  // 1) Full HTML receipt to email
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER!,
    to: opts.sendToWifeEmail,
    subject,
    text,
    html,
  });

  // 2) Optional: short alert via email-to-SMS
  if (opts.smsEnable && opts.smsCarrier) {
    const d = phoneDigits(order.customer.phone);
    const smsTo = SMS_GATEWAYS[opts.smsCarrier](d);

    const short = [
      subject,
      `Total ${order.total.toFixed(2)} • ${order.fulfillment.type === "delivery" ? "Del" : "Pick"} ${order.fulfillment.date} ${order.fulfillment.time}`,
      `${order.customer.name} ${order.customer.phone}`,
    ].join("\n");

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER!,
      to: smsTo,
      subject: "New order",
      text: short,
    });
  }

  return { subject, html, text };
}
