import Link from "next/link"
import { Check, ArrowRight, Package } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Header } from "../components/header"
import { CartPanel } from "../components/cart-panel"

const subscriptionTiers = [
  {
    name: "Essential",
    price: 60,
    description: "Perfect for individuals or small households",
    features: [
      "4-6 assorted pastries",
      "1 artisan bread loaf",
      "2 seasonal treats",
      "Weekly delivery",
      "Flexible cancellation",
    ],
  },
  {
    name: "Deluxe",
    price: 115,
    description: "Ideal for families and pastry enthusiasts",
    features: [
      "8-10 assorted pastries",
      "2 artisan bread loaves",
      "4 seasonal treats",
      "1 specialty cake or tart",
      "Weekly delivery",
      "Priority support",
      "Flexible cancellation",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: 170,
    description: "The ultimate baking experience",
    features: [
      "12-15 assorted pastries",
      "3 artisan bread loaves",
      "6 seasonal treats",
      "2 specialty cakes or tarts",
      "Weekly delivery",
      "Priority support",
      "Custom requests included",
      "Flexible cancellation",
    ],
  },
]

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
            Enjoy a curated selection of our finest baked goods delivered fresh to your door every week. Choose the
            perfect size for your household.
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
                Choose your delivery day and we'll bring fresh pastries right to your doorstep every week.
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
            Browse our full selection and order individual items whenever you'd like.
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