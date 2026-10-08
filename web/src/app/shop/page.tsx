import { Header } from "../components/header";
import { CartPanel } from "../components/cart-panel";
import { ProductCard } from "../components/product-card";

import { getProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getProducts();
  return (
    <div className="min-h-screen">
      <Header />
      <CartPanel />

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
              Our Collection
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Handcrafted in El Paso. Delivery within 20 miles of 79936 for $16. Order at least 48 hours ahead.
            </p>
          </div>

          {products.length === 0 && <p className="text-center text-muted-foreground">Our menu is being updated. Please contact us for a custom order.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
