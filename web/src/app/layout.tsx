import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { CartProvider } from "../app/components/cart-provider"
import { Suspense } from "react"
import "./globals.css"
import { Footer } from "../app/components/Footer";

export const metadata: Metadata = {
  title: "Nilla's Creations | Custom Baking & Pastry Service",
  description: "Freshly baked goods in El Paso. $16 delivery within a 20-mile radius of 79936. Secure card checkout with Square.",

}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <CartProvider>{children}</CartProvider>
        </Suspense>
        <Analytics />
        <Footer />
      </body>
    </html>
  )
}
