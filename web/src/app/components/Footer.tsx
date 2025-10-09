"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8 mt-12">
      <div className="container mx-auto max-w-6xl px-4 text-center space-y-3">
        {/* Bible quote */}
        <p className="text-muted-foreground italic text-sm">
          “Give us this day our daily bread.” – Matthew 6:11
        </p>

        {/* Divider */}
        <div className="h-px w-16 mx-auto bg-border" />

        {/* Footer links */}
        <p className="text-xs text-muted-foreground">
          Built by{" "}
          <Link
            href="https://myevm.org"
            target="_blank"
            className="text-accent hover:underline font-medium"
          >
            MyEVM
          </Link>{" "}
          • © {new Date().getFullYear()} Nilla’s Creations. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
