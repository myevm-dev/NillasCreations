"use client";

import { Header } from "../components/header";
import { CartPanel } from "../components/cart-panel";
import { ProductCard } from "../components/product-card";

const products = [
  {
    id: 1,
    name: "Loaf Banana Bread (8 slices)",
    price: 13,
    image: "/shopitemphotosoon.png",
    description:
      "Moist, banana-rich loaf with a hint of vanilla—perfect toasted with butter.",
  },
  {
    id: 2,
    name: "Loaf Pumpkin Bread (8 slices)",
    price: 16,
    image: "/shopitemphotosoon.png",
    description:
      "Spiced pumpkin loaf with cinnamon and nutmeg for cozy, fall-forward flavor.",
  },
  {
    id: 3,
    name: "12x Brownies",
    price: 27,
    image: "/shopitemphotosoon.png",
    description:
      "Fudgy chocolate brownies with a crackly top—rich, dense, and crowd-pleasing.",
  },
  {
    id: 4,
    name: "9x Rice Crispy Bars",
    price: 25,
    image: "/shopitemphotosoon.png",
    description:
      "Chewy, buttery marshmallow bars with the perfect crispy bite.",
  },
  {
    id: 5,
    name: "30x Vanilla Cake Pops",
    price: 60,
    image: "/shopitemphotosoon.png",
    description:
      "Classic vanilla cake dipped in smooth coating and finished with sprinkles.",
  },
  {
    id: 6,
    name: "30x Chocolate Cake Pops",
    price: 60,
    image: "/shopitemphotosoon.png",
    description:
      "Decadent chocolate cake pops with a glossy chocolate shell.",
  },
  {
    id: 7,
    name: "12x White Chocolate Cranberry Oatmeal Cookies",
    price: 24,
    image: "/shopitemphotosoon.png",
    description:
      "Soft oatmeal cookies studded with tart cranberries and creamy white chocolate.",
  },
  {
    id: 8,
    name: "12x Chocolate Chip Cookies",
    price: 18,
    image: "/shopitemphotosoon.png",
    description:
      "Golden-edge, soft-center cookies packed with semisweet chocolate chips.",
  },
//  {
//    id: 9,
//    name: "12x Blueberry Muffins",
//    price: 24,
//    image: "/shopitemphotosoon.png",
//    description:
//      "Bakery-style muffins bursting with juicy blueberries and a tender crumb.",
 // },
] as const;

export default function ShopPage() {
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
              Handcrafted with premium ingredients and traditional techniques
            </p>
          </div>

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
