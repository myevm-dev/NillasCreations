import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Heart, Award } from "lucide-react";
import { Button } from "../app/components/ui/button";
import { Header } from "../app/components/header";
import { CartPanel } from "../app/components/cart-panel";
import ContactButton from "../app/components/contact-button";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <CartPanel />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-balance leading-tight text-foreground">
                Freshly baked joy, made to order
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                From classic banana bread to custom sweet treats, every order is baked fresh to your needs, ready within 48 hours or when you need it. Taste the comfort of homemade, every time.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/shop">
                    Browse Our Selection
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <ContactButton phone="(970)481-6347" email="KC@NillasCreations.com" />

                <Button asChild variant="secondary" size="lg">
                  <Link href="/subscribe">Subscribe</Link>
                </Button>
              </div>
            </div>

            {/* Image: intrinsic size, fills width, keeps ratio */}
<div className="rounded-2xl overflow-hidden bg-muted">
  <Image
    src="/heroimage.png"
    alt="Bakery display"
    width={740}        // ← use your actual image width
    height={608}       // ← use your actual image height
    className="w-full h-auto"  // keeps ratio, no letterboxing
    priority
  />

            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent text-accent-foreground">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-serif font-bold text-foreground">Fast Turnaround</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every item is baked fresh to be ready in 48 hours using the finest ingredients.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent text-accent-foreground">
                <Heart className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-serif font-bold text-foreground">Made with Love</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our passionate bakers pour their heart into every creation, ensuring exceptional quality and taste.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent text-accent-foreground">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-serif font-bold text-foreground">Custom Orders</h3>
              <p className="text-muted-foreground leading-relaxed">
                For birthdays or anyday, we create bespoke designs tailored to your special occasion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-balance text-foreground">
            Ready to taste the difference?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Explore our collection of handcrafted pastries, cakes, and breads. Each piece is a work of art designed to
            delight your senses.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/shop">
              Shop Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
