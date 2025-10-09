"use client";

import { useState } from "react";
import { Button } from "./ui/button";

type Props = {
  phone?: string;
  // email?: string; // commented out per request
};

export default function ContactButton({
  phone = "(970) 481-6347",
  // email = "KC@NillasCreations.com",
}: Props) {
  const [showContact, setShowContact] = useState(false);

  if (showContact) {
    // show only the phone (email commented out below)
    return (
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <a href="tel:+19704816347" className="text-sm font-medium underline">
          {phone}
        </a>
        {/* <span className="hidden md:inline-block text-muted-foreground">•</span>
        <a href={`mailto:${email}`} className="text-sm font-medium underline">
          {email}
        </a> */}
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => setShowContact(true)}
      aria-label="Show contact options"
    >
      Book Consultation
    </Button>
  );
}
