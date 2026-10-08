"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { z } from "zod";
const savedCart = z.array(z.object({ id: z.string().min(1).max(100), name: z.string().max(200), price: z.number().nonnegative(),
  image: z.string().max(1000), quantity: z.number().int().min(1).max(24) })).max(24);
export type CartItem = z.infer<typeof savedCart>[number];
interface CartContextType {
  items: CartItem[]; addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  removeItem: (id: string) => void; updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void; total: number; itemCount: number; isOpen: boolean; setIsOpen: (open: boolean) => void;
}
const CartContext = createContext<CartContextType | undefined>(undefined);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    try {
      const parsed = savedCart.safeParse(JSON.parse(localStorage.getItem("nillas-cart-v1") || "[]"));
      if (parsed.success) setItems(parsed.data);
    } catch { /* Storage may be blocked. The cart still works in memory. */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) { try { localStorage.setItem("nillas-cart-v1", JSON.stringify(items)); } catch { /* Storage is optional. */ } }
  }, [items, loaded]);
  const addItem = (item: Omit<CartItem, "quantity">, quantity: number) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...item, quantity: Math.min(24, i.quantity + quantity) } : i);
      return [...prev, { ...item, quantity: Math.min(24, quantity) }];
    });
    setIsOpen(true);
  };
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) { removeItem(id); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.min(24, quantity) } : i));
  };
  return <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart: () => setItems([]),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0), itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    isOpen, setIsOpen }}>{children}</CartContext.Provider>;
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
