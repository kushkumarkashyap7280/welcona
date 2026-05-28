"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

export function CartIndicator() {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  const fetchCount = () => {
    try {
      const cartData = localStorage.getItem("welcona_cart");
      if (!cartData) {
        setCount(0);
        setVisible(false);
        return;
      }
      
      const cart = JSON.parse(cartData);
      if (!Array.isArray(cart) || cart.length === 0) {
        setCount(0);
        setVisible(false);
        return;
      }

      // Sum quantities of all items
      const totalCount = cart.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
      setCount(totalCount);
      setVisible(totalCount > 0);
    } catch {
      setCount(0);
      setVisible(false);
    }
  };

  useEffect(() => {
    fetchCount();
  }, []);

  // Listen for custom cart-updated events so we can refresh in real time
  useEffect(() => {
    window.addEventListener("cart-updated", fetchCount);
    return () => window.removeEventListener("cart-updated", fetchCount);
  }, []);

  if (!visible) return null;

  return (
    <Link
      href="/cart"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
    >
      <ShoppingCart className="h-5 w-5 animate-pulse" />
      <span className="text-sm font-semibold">
        Checkout Cart &middot; {count} {count === 1 ? "item" : "items"}
      </span>
    </Link>
  );
}
