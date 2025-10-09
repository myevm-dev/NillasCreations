import { Header } from "../components/header"
import { CartPanel } from "../components/cart-panel"
import { ProductCard } from "../components/product-card"

const products = [
  {
    id: 1,
    name: "Classic Croissant",
    price: 4.5,
    image: "/buttery-golden-croissant-on-white-background.jpg",
    description: "Buttery, flaky layers of perfection",
  },
  {
    id: 2,
    name: "Chocolate Éclair",
    price: 6.0,
    image: "/chocolate-eclair-with-glossy-glaze.jpg",
    description: "Choux pastry filled with vanilla cream",
  },
  {
    id: 3,
    name: "Strawberry Tart",
    price: 8.5,
    image: "/fresh-strawberry-tart-with-custard.jpg",
    description: "Fresh berries on silky custard",
  },
  {
    id: 4,
    name: "Almond Biscotti",
    price: 3.5,
    image: "/almond-biscotti-cookies.jpg",
    description: "Twice-baked Italian cookies",
  },
  {
    id: 5,
    name: "Lemon Meringue Pie",
    price: 12.0,
    image: "/lemon-meringue-pie-slice.jpg",
    description: "Tangy lemon with fluffy meringue",
  },
  {
    id: 6,
    name: "Cinnamon Roll",
    price: 5.5,
    image: "/cinnamon-roll-with-cream-cheese-frosting.jpg",
    description: "Warm spiced roll with cream cheese",
  },
  {
    id: 7,
    name: "Macaron Box",
    price: 18.0,
    image: "/colorful-french-macarons-in-box.jpg",
    description: "Assorted flavors, 12 pieces",
  },
  {
    id: 8,
    name: "Sourdough Loaf",
    price: 7.0,
    image: "/artisan-sourdough-loaf.png",
    description: "Crusty artisan bread, naturally leavened",
  },
  {
    id: 9,
    name: "Tiramisu Slice",
    price: 9.0,
    image: "/tiramisu-cake-slice-with-cocoa.jpg",
    description: "Coffee-soaked layers with mascarpone",
  },
]

export default function ShopPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <CartPanel />

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">Our Collection</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Handcrafted daily with premium ingredients and traditional techniques
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
  )
}