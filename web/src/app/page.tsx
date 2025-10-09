import Link from "next/link"
import { ArrowRight, Clock, Heart, Award } from "lucide-react"
import { Button } from "../app/components/ui/button"
import { Header } from "../app/components/header"
import { CartPanel } from "../app/components/cart-panel"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <CartPanel />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-balance leading-tight text-foreground">
                Artisan baking meets custom perfection
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Transform your celebrations into unforgettable moments with our handcrafted pastries and custom baked
                goods, made fresh daily with premium ingredients.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/shop">
                    Browse Our Selection
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#contact">Book Consultation</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/subscribe">Subscribe</Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              <img
                src="/artisan-bakery-display-with-fresh-pastries-and-cak.jpg"
                alt="Artisan bakery display"
                className="object-cover w-full h-full"
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
              <h3 className="text-xl font-serif font-bold text-foreground">Fresh Daily</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every item is baked fresh each morning using traditional techniques and the finest ingredients.
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
                From weddings to birthdays, we create bespoke designs tailored to your special occasion.
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
  )
}
