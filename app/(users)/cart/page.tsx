"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import {
  getCartAction,
  updateCartItemAction,
  removeCartItemAction,
} from "@/lib/actions/user";
import { Button } from "@/components/ui/button";

type Cart = Awaited<ReturnType<typeof getCartAction>>;
type CartItem = NonNullable<Cart>["cartItems"][number];

export default function CartPage() {
  const [cart, setCart] = useState<Cart>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const reload = () =>
    getCartAction().then((c) => {
      setCart(c);
      setLoading(false);
    });

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQty = (item: CartItem, delta: number) => {
    const next = item.quantity + delta;
    startTransition(async () => {
      await updateCartItemAction(item.id, next);
      reload();
    });
  };

  const handleRemove = (id: string) => {
    startTransition(async () => {
      await removeCartItemAction(id);
      reload();
    });
  };

  const total =
    cart?.cartItems.reduce(
      (s, i) => s + i.product.retailPrice * i.quantity,
      0
    ) ?? 0;

  const items = cart?.cartItems ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Cart</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-24 animate-pulse rounded-2xl border border-border/60 bg-muted/30"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="luxury-panel flex flex-col items-center gap-4 py-20 text-center"
        >
          <ShoppingBag className="size-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="rounded-full">
            <Link href="/products">Browse Products</Link>
          </Button>
        </motion.div>
      ) : (
        <>
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/70 p-4"
              >
                {/* Image / SKU placeholder */}
                <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground text-xs">
                  {item.product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="size-full rounded-xl object-cover"
                    />
                  ) : (
                    "IMG"
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SKU: {item.product.sku}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    ₹{(item.product.retailPrice * item.quantity).toFixed(2)}
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleQty(item, -1)}
                    disabled={isPending}
                    className="flex size-7 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition hover:bg-muted disabled:opacity-40"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQty(item, 1)}
                    disabled={isPending || item.quantity >= item.product.quantity}
                    className="flex size-7 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition hover:bg-muted disabled:opacity-40"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                  className="ml-1 flex size-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                >
                  <Trash2 className="size-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="luxury-panel flex items-center justify-between p-5"
          >
            <div>
              <p className="text-xs text-muted-foreground">Order total</p>
              <p className="text-2xl font-semibold">₹{total.toFixed(2)}</p>
            </div>
            <Button size="lg" className="rounded-full px-6">
              Proceed to Checkout
            </Button>
          </motion.div>
        </>
      )}
    </div>
  );
}
