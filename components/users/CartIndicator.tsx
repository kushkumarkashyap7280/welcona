"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

import { getCartCountAction } from "@/lib/actions/user";
import { useAuth } from "@/components/providers/AuthProvider";

export function CartIndicator() {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  const fetchCount = async () => {
    if (!isAuthenticated) {
      setCount(0);
      setVisible(false);
      return;
    }
    const c = await getCartCountAction();
    setCount(c);
    setVisible(c > 0);
  };

  useEffect(() => {
    fetchCount();
  }, [isAuthenticated]);

  // Listen for custom cart-updated events so we can refresh
  useEffect(() => {
    const handler = () => fetchCount();
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, [isAuthenticated]);

  if (!visible) return null;

  return (
    <Link
      href="/dashboard/cart"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="text-sm font-semibold">
        Checkout Cart &middot; {count} {count === 1 ? "item" : "items"}
      </span>
    </Link>
  );
}
