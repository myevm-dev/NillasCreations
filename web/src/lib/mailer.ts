// /src/lib/mailer.ts
import "server-only";
import nodemailer from "nodemailer";
import {
  buildReceiptHTML,
  buildReceiptText,
  buildReceiptSubject,
  SMS_GATEWAYS,
  phoneDigits,
} from "./orderReceipt";
import type { OrderDetails } from "./orderReceipt";

/* -----------------------------------------------------------
 * Transport (SMTP)
 * --------------------------------------------------------- */
const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false otherwise
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

/* -----------------------------------------------------------
 * Optional MMS gateways (better for longer messages)
 * --------------------------------------------------------- */
const MMS_GATEWAYS: Partial<Record<keyof typeof SMS_GATEWAYS, (d: string) => string>> = {
  att: (d) => `${d}@mms.att.net`,
  verizon: (d) => `${d}@vzwpix.com`,
  tmobile: (d) => `${d}@tmomail.net`,       // same domain works for MMS here
  uscellular: (d) => `${d}@mms.uscc.net`,
  googlefi: (d) => `${d}@msg.fi.google.com`,
};

/* -----------------------------------------------------------
 * Types
 * --------------------------------------------------------- */
type SendOpts = {
  /** Destination for the business copy (defaults to ORDER_EMAIL_TO). */
  sendToWifeEmail?: string;

  /** Short alert via email-to-SMS (defaults to env if not passed). */
  smsCarrier?: keyof typeof SMS_GATEWAYS;
  smsEnable?: boolean;

  /** Use MMS gateway for longer messages (defaults to env). */
  smsUseMms?: boolean;

  /** Optional customer copy of receipt. */
  sendCustomerCopy?: boolean;
  customerEmail?: string;
};

/* -----------------------------------------------------------
 * Main API
 * --------------------------------------------------------- */
export async function sendReceiptEmails(order: OrderDetails, opts: SendOpts = {}) {
  const subject = buildReceiptSubject(order);
  const html = buildReceiptHTML(order);
  const text = buildReceiptText(order);

  const fromAddress = process.env.SMTP_FROM ?? process.env.SMTP_USER!;
  const businessTo = opts.sendToWifeEmail ?? process.env.ORDER_EMAIL_TO ?? "";

  if (!businessTo) {
    throw new Error("No business destination email configured. Set sendToWifeEmail or ORDER_EMAIL_TO.");
  }

  /* 1) Full HTML receipt to business */
  await transporter.sendMail({
    from: fromAddress,
    to: businessTo,
    subject,
    text,
    html,
  });

  /* 2) Optional: short alert via email-to-SMS (env defaults) */
  const envCarrier = (process.env.ORDER_SMS_CARRIER || "") as keyof typeof SMS_GATEWAYS;
  const smsCarrier = opts.smsCarrier ?? envCarrier;

  const smsNumberRaw = process.env.ORDER_SMS_PHONE || "";
  const smsDigits = phoneDigits(smsNumberRaw); // normalize to 10 digits

  const smsUseMms =
    typeof opts.smsUseMms === "boolean"
      ? opts.smsUseMms
      : process.env.ORDER_SMS_USE_MMS === "true";

  const smsEnabled =
    typeof opts.smsEnable === "boolean"
      ? opts.smsEnable
      : Boolean(smsDigits && smsCarrier);

  if (smsEnabled && smsCarrier && smsDigits) {
    const gateway = smsUseMms ? MMS_GATEWAYS[smsCarrier] : SMS_GATEWAYS[smsCarrier];
    const smsTo = gateway?.(smsDigits);

    if (smsTo) {
      const short = [
        subject,
        `Total ${order.total.toFixed(2)} • ${
          order.fulfillment.type === "delivery" ? "Del" : "Pick"
        } ${order.fulfillment.date} ${order.fulfillment.time}`,
        `${order.customer.name} ${order.customer.phone}`,
      ].join("\n");

      await transporter.sendMail({
        from: fromAddress,
        to: smsTo,
        subject: "New order",
        text: short,
      });
    }
  }

  /* 3) Optional: HTML receipt to the customer */
  if (opts.sendCustomerCopy && opts.customerEmail) {
    await transporter.sendMail({
      from: fromAddress,
      to: opts.customerEmail,
      replyTo: businessTo,
      subject,
      text,
      html,
    });
  }

  return { subject, html, text };
}
