"use client";

import Link from "next/link";
import { ShoppingCart, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "./cart-provider";
import { useEffect, useRef, useState } from "react";

export function Header() {
  const { itemCount, setIsOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false); // desktop contact dropdown
  const [contactOpenMobile, setContactOpenMobile] = useState(false); // mobile contact dropdown
  const contactRef = useRef<HTMLDivElement>(null);

  // close desktop dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!contactRef.current) return;
      if (!contactRef.current.contains(e.target as Node)) {
        setContactOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-xl font-serif font-bold text-foreground">{"Nilla's"}</span>
            <span className="text-xs text-muted-foreground tracking-wider">Creations</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/shop" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Shop
          </Link>
          <Link href="/subscribe" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Subscribe
          </Link>

          {/* Contact dropdown (desktop) */}
          <div className="relative" ref={contactRef}>
            <button
              type="button"
              onClick={() => setContactOpen((v) => !v)}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Contact
            </button>

            {contactOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-md">
                <div className="flex flex-col gap-2">
                  <a
                    href="tel:+15551234567"  // TODO: replace with real phone
                    className="rounded-md px-3 py-2 hover:bg-muted transition-colors text-sm font-medium"
                  >
                    (970) 481-6347
                  </a>
                  <a
                    href="mailto:kc@nillascreations.com" // TODO: replace with real email
                    className="rounded-md px-3 py-2 hover:bg-muted transition-colors text-sm font-medium break-all"
                  >
                    kc@nillascreations.com
                  </a>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen(true)}>
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-medium">
                {itemCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => {
              setMobileMenuOpen((v) => !v);
              setContactOpenMobile(false);
            }}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container mx-auto flex flex-col gap-2 p-4">
            <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
              Home
            </Link>
            <Link href="/shop" className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
              Shop
            </Link>
            <Link href="/subscribe" className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
              Subscribe
            </Link>

            {/* Contact button that reveals a small card (no arrow) */}
            <button
              type="button"
              onClick={() => setContactOpenMobile((v) => !v)}
              className="text-left text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
            >
              Contact
            </button>
            {contactOpenMobile && (
              <div className="ml-2 mt-1 rounded-lg border border-border bg-card p-3 shadow-sm">
                <div className="flex flex-col gap-2">
                  <a
                    href="tel:+9704816347" // TODO: replace
                    className="rounded-md px-3 py-2 hover:bg-muted transition-colors text-sm font-medium"
                  >
                    (970) 481-6347
                  </a>
                  <a
                    href="mailto:kc@nillascreations.com" // TODO: replace
                    className="rounded-md px-3 py-2 hover:bg-muted transition-colors text-sm font-medium break-all"
                  >
                    KC@NillasCreations.com
                  </a>
                </div>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
