"use client";

import { Header } from "../components/header";
import { CartPanel } from "../components/cart-panel";
import { ProductCard } from "../components/product-card";

const products = [
  {
    id: 1,
    name: "Loaf Banana Bread (8 slices)",
    price: 13,
    image: "/bananabread.png",
    description:
      "Moist, banana rich loaf with a hint of vanilla, perfect toasted with butter.",
  },
  {
    id: 2,
    name: "Loaf Pumpkin Bread (8 slices)",
    price: 16,
    image: "/pumpkingbread.png",
    description:
      "Spiced pumpkin loaf with cinnamon and nutmeg for cozy fall forward flavor.",
  },
  {
    id: 3,
    name: "12x Brownies",
    price: 27,
    image: "/brownies.png",
    description:
      "Fudgy chocolate brownies with a crackly top, rich, dense, and crowd pleasing.",
  },
  {
    id: 4,
    name: "9x Rice Crispy Bars",
    price: 25,
    image: "/ricecrispy.png",
    description:
      "Chewy, buttery marshmallow bars with the perfect crispy bite.",
  },
  {
    id: 5,
    name: "12x Apple Cider Donuts",
    price: 60,
    image: "/ciderdonuts.png",
    description:
      "Tender apple cider donuts with cozy fall flavor in every bite.",
  },
  {
    id: 6,
    name: "12x White Chocolate Cranberry Oatmeal Cookies",
    price: 24,
    image: "/whitechocolatecranoatmealcookies.png",
    description:
      "Soft oatmeal cookies studded with tart cranberries and creamy white chocolate.",
  },
  {
    id: 7,
    name: "12x Chocolate Chip Cookies",
    price: 18,
    image: "/chocchipcookies.png",
    description:
      "Golden edge, soft center cookies packed with semisweet chocolate chips.",
  },
  {
    id: 8,
    name: "Pecan Praline Bundt Cake",
    price: 32,
    image: "/bundtcake.png",
    description:
      "Buttery pecan bundt cake topped with a rich caramel-praline glaze.",
  },
  {
    id: 9,
    name: "Pumpkin Pie",
    price: 22,
    image: "/pumpkinpie.png",
    description:
      "Silky pumpkin filling in a flaky crust with warm fall spices.",
  },
  {
    id: 10,
    name: "Pecan Pie",
    price: 25,
    image: "/pecanpie.jpg",
    description:
      "Sweet, gooey pecan filling crowned with toasted caramelized pecans.",
  },
  {
    id: 11,
    name: "Deep Dish Dutch Apple Pie",
    price: 28,
    image: "/deepdish.png",
    description:
      "Deep dish apple pie with cinnamon spice and a buttery crumble topping.",
  },
  {
    id: 12,
    name: "Butterscotch Toffee Cookies",
    price: 25,
    image: "/toffeecookies.png",
    description:
      "Soft cookies packed with buttery toffee and sweet butterscotch chips.",
  },

  {
    id: 99,
    name: "TEST Bologna Sammy ",
    price: 1,
    image: "/shopitemphotosoon.png",
    description:
      "Nothing Here :) Please do not order",
  },

  // {
  //   id: 9,
  //   name: "12x Blueberry Muffins",
  //   price: 24,
  //   image: "/shopitemphotosoon.png",
  //   description:
  //     "Bakery style muffins bursting with juicy blueberries and a tender crumb.",
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
