"use client"

import { useState } from "react"
import Image from "next/image"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter } from "./ui/card"
import { useCart } from "./cart-provider"

interface Product {
  id: number
  name: string
  price: number
  image: string
  description: string
}

export function ProductCard({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      },
      quantity,
    )
    setQuantity(1)
  }

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-6 space-y-2">
        <h3 className="text-xl font-serif font-bold text-card-foreground">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{product.description}</p>
        <p className="text-2xl font-bold text-accent">${product.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-6 pt-0 flex items-center gap-3">
        <div className="flex items-center border border-border rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-r-none"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-medium text-card-foreground">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-l-none"
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button className="flex-1 gap-2" onClick={handleAddToCart}>
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  )
}
