import Link from "next/link"
import { Check, ArrowRight, Package } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Header } from "../components/header"
import { CartPanel } from "../components/cart-panel"

const subscriptionTiers = [
  {
    name: "Coffee Break",
    price: 52, // ~$55 value w/ ~5% off
    description: "Great for small offices, salons, and front desks",
    features: [
      "1× Loaf Banana Bread (8 slices)",
      "12× Chocolate Chip Cookies",
      "12× Blueberry Muffins",
      "Weekly delivery included",
      "Flexible pause/skip/cancel"
    ],
  },
  {
    name: "Office Favorites",
    price: 89, // ~$94 value w/ ~5% off
    description: "Perfect for teams (10–20 people)",
    features: [
      "18× Brownies",
      "18× Rice Crispy Bars",
      "1× Loaf Banana Bread (8 slices)",
      "12× White Choc Cranberry Oatmeal Cookies",
      "Weekly delivery included",
      "Priority support",
      "Flexible pause/skip/cancel"
    ],
    popular: true,
  },
  {
    name: "Shop Partner",
    price: 181, // ~$191 value w/ ~5% off
    description: "Designed for coffee shops & busy offices",
    features: [
      "30× Vanilla Cake Pops",
      "30× Chocolate Cake Pops",
      "1× Loaf Banana Bread + 1× Loaf Pumpkin Bread",
      "12× Blueberry Muffins & 12× Chocolate Chip Cookies",
      "Weekly delivery included",
      "Priority support",
      "Custom requests included",
      "Flexible pause/skip/cancel"
    ],
  },
];


export default function SubscribePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <CartPanel />

      {/* Hero Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent text-accent-foreground mb-4">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-balance text-foreground">
            Weekly Variety Baskets
          </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Weekly bakery bundles made for <strong>coffee shops, offices, salons, and co-working spaces</strong>.
                Fresh, consistent, and ready within 48 hours—save with our subscription pricing.
            </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {subscriptionTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative flex flex-col ${tier.popular ? "border-accent shadow-lg scale-105" : ""}`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-serif font-bold text-foreground">{tier.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold text-foreground">${tier.price}</span>
                    <span className="text-muted-foreground">/week</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-2" variant={tier.popular ? "default" : "outline"} size="lg">
                    Subscribe Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 text-foreground">
            Why Subscribe?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-xl font-serif font-bold text-foreground">Fresh Every Week</h3>
              <p className="text-muted-foreground leading-relaxed">
                Receive a rotating selection of our finest baked goods, ensuring you always have something new to try.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-serif font-bold text-foreground">Convenient Delivery</h3>
              <p className="text-muted-foreground leading-relaxed">
                Choose your delivery day and we’ll bring fresh pastries right to your doorstep every week.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-serif font-bold text-foreground">Flexible Plans</h3>
              <p className="text-muted-foreground leading-relaxed">
                Pause, skip, or cancel anytime. No long-term commitments, just delicious baked goods.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-serif font-bold text-foreground">Best Value</h3>
              <p className="text-muted-foreground leading-relaxed">
                Save up to 15% compared to individual purchases while enjoying premium variety.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-balance text-foreground">
            Not ready to subscribe?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Browse our full selection and order individual items whenever you&apos;d like.
          </p>
          <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent">
            <Link href="/shop">
              Shop Individual Items
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}