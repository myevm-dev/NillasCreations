"use client";
import Link from "next/link";
export default function ShopError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-lg p-8 text-center space-y-5"><h1 className="text-3xl font-serif">Our menu is temporarily unavailable</h1>
    <p>Please try again, or contact us to place an order.</p><button onClick={reset} className="rounded-md bg-primary text-primary-foreground px-4 py-2">Try again</button>
    <div><Link href="tel:+19704816347" className="underline">Call Nilla&apos;s Creations</Link></div></main>;
}
