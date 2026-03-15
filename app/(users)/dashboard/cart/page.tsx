"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  ArrowRight,
  PackageOpen,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

import {
  getCartAction,
  updateCartItemAction,
  removeCartItemAction,
} from "@/lib/actions/user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ui/product-image";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    retailPrice: number;
    wholesalePrice: number;
    wholesaleMinQuantity: number;
    discount: number | null;
    images: { id: string; image: string; isPrimary: boolean; index: number }[];
    sku: string;
    quantity: number;
  };
};

type Cart = {
  id: string;
  cartItems: CartItem[];
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function getUnitPrice(item: CartItem) {
  const product = item.product;
  let unitPrice = product.retailPrice;

  // Auto-apply wholesale rate when quantity meets minimum
  if (item.quantity >= product.wholesaleMinQuantity) {
    unitPrice = product.wholesalePrice;
  }

  // Apply discount if available
  if (product.discount) {
    unitPrice = unitPrice * (1 - product.discount / 100);
  }

  return unitPrice;
}

function getPrimaryImage(images: CartItem["product"]["images"]) {
  const primary = images.find((img) => img.isPrimary);
  return primary ?? images[0];
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingItems, setPendingItems] = useState<Set<string>>(new Set());
  const [draftQty, setDraftQty] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const fetchCart = async () => {
    const data = await getCartAction();
    setCart(data as Cart | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    setPendingItems((prev) => new Set(prev).add(cartItemId));
    startTransition(async () => {
      const result = await updateCartItemAction(cartItemId, newQuantity);
      if (result.error) {
        toast.error(result.error);
      }
      await fetchCart();
      setPendingItems((prev) => {
        const next = new Set(prev);
        next.delete(cartItemId);
        return next;
      });
    });
  };

  const handleRemoveItem = async (cartItemId: string) => {
    setPendingItems((prev) => new Set(prev).add(cartItemId));
    startTransition(async () => {
      const result = await removeCartItemAction(cartItemId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Item removed from cart");
      }
      await fetchCart();
      setPendingItems((prev) => {
        const next = new Set(prev);
        next.delete(cartItemId);
        return next;
      });
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading cart...</span>
      </div>
    );
  }

  const items = cart?.cartItems ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <PackageOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Looks like you haven&apos;t added any products yet.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + getUnitPrice(item) * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cart</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item) => {
            const image = getPrimaryImage(item.product.images);
            const unitPrice = getUnitPrice(item);
            const isWholesale = item.quantity >= item.product.wholesaleMinQuantity;
            const isItemPending = pendingItems.has(item.id);

            return (
              <div
                key={item.id}
                className={`relative rounded-2xl border border-border/70 bg-card/90 p-4 transition ${
                  isItemPending ? "opacity-60" : ""
                }`}
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link
                    href={`/products/${item.product.id}`}
                    className="shrink-0 overflow-hidden rounded-xl"
                  >
                    {image ? (
                      <ProductImage
                        src={image.image}
                        alt={item.product.name}
                        className="h-24 w-24 object-cover sm:h-28 sm:w-28"
                        fallbackSize="sm"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center bg-muted sm:h-28 sm:w-28">
                        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </Link>

                  {/* Product Details */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <Link
                        href={`/products/${item.product.id}`}
                        className="font-medium hover:text-primary transition-colors line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        SKU: {item.product.sku}
                      </p>

                      {/* Wholesale badge */}
                      {isWholesale && (
                        <Badge
                          className="mt-1.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white"
                        >
                          <Tag className="mr-1 h-3 w-3" />
                          Wholesale rate applied
                        </Badge>
                      )}

                      {!isWholesale && item.quantity > 0 && (
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          Add {item.product.wholesaleMinQuantity - item.quantity} more for wholesale price ({formatPrice(item.product.wholesalePrice)}/unit)
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      {/* Quantity Controls */}
                      <div className="inline-flex items-center rounded-full border border-border bg-background p-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          disabled={isItemPending || item.quantity <= 1}
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <input
                          type="number"
                          min={1}
                          max={item.product.quantity}
                          disabled={isItemPending}
                          value={draftQty[item.id] ?? item.quantity}
                          onChange={(e) =>
                            setDraftQty((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          onBlur={(e) => {
                            const raw = Number(e.target.value);
                            const clamped = Math.max(
                              1,
                              Math.min(item.product.quantity, Number.isFinite(raw) ? raw : 1)
                            );
                            setDraftQty((prev) => {
                              const next = { ...prev };
                              delete next[item.id];
                              return next;
                            });
                            if (clamped !== item.quantity) {
                              handleUpdateQuantity(item.id, clamped);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="w-12 border-none bg-transparent text-center text-sm font-semibold outline-none disabled:opacity-50"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          disabled={
                            isItemPending ||
                            item.quantity >= item.product.quantity
                          }
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      {item.quantity >= item.product.quantity && item.product.quantity > 0 && (
                        <p className="text-[11px] text-amber-600 mt-1">Max stock reached</p>
                      )}

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatPrice(unitPrice * item.quantity)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatPrice(unitPrice)} / unit
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-3 h-7 w-7 text-muted-foreground hover:text-destructive"
                    disabled={isItemPending}
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="h-fit space-y-4 rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm lg:sticky lg:top-20">
          <h2 className="text-lg font-semibold">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Subtotal ({totalItems} items)
              </span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium text-emerald-600">Free</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>

          <Button asChild className="w-full" size="lg">
            <Link href="/dashboard/checkout">
              Proceed to Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full" size="sm">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
