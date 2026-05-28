"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  PackageCheck,
  PackageX,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "@/components/ui/product-image";
import { cn, normalizeImageSrc } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductImg = {
  id: string;
  image: string;
  detail: string | null;
  isPrimary: boolean;
  index: number;
};

type ProductDetails = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  warranty: string | null;
  finish: string | null;
  material: string | null;
  retailPrice: number;
  discount: number | null;
  wholesalePrice: number | null;
  wholesaleMinQuantity: number;
  quantity: number;
  tags: string[];
  category: { id: string; name: string };
  images: ProductImg[];
};

type RelatedProduct = {
  id: string;
  name: string;
  retailPrice: number;
  discount: number | null;
  tags: string[];
  images: { id: string; image: string; isPrimary: boolean; index: number }[];
};

type ProductDetailsResponse = {
  product: ProductDetails;
  related: RelatedProduct[];
};

type DetailTab = "overview" | "specs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

const slideVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? "55%" : "-55%", opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
  exit: (dir: number) => ({
    x: dir < 0 ? "55%" : "-55%",
    opacity: 0,
    transition: { duration: 0.25, ease: "easeIn" },
  }),
};

function ProductGallery({ images, name }: { images: ProductImg[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = images.length;

  const go = useCallback(
    (nextIdx: number, dir: number) => {
      setDirection(dir);
      setCurrent(((nextIdx % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    intervalRef.current = setInterval(() => go(current + 1, 1), 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [current, paused, count, go]);

  const activeImage = images[current];

  return (
    <div className="space-y-3">
      {/* Main frame */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-sm aspect-square">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
          >
            {activeImage ? (
              <ProductImage
                src={activeImage.image}
                alt={name}
                className="h-full w-full object-cover"
                fallbackSize="lg"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No image available
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next */}
        {count > 1 && (
          <>
            <button
              onClick={() => go(current - 1, -1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(current + 1, 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Pause / Play + dots */}
        {count > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
            <button
              onClick={() => setPaused((p) => !p)}
              className="text-white/80 hover:text-white transition-colors"
              aria-label={paused ? "Resume slideshow" : "Pause slideshow"}
            >
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
            <div className="flex items-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i, i > current ? 1 : -1)}
                  aria-label={`Go to image ${i + 1}`}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === current
                      ? "w-4 h-2 bg-white"
                      : "w-2 h-2 bg-white/50 hover:bg-white/75"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Caption overlay */}
        {activeImage?.detail && (
          <div className="absolute top-3 left-3 right-14 rounded-xl bg-black/50 backdrop-blur-sm px-3 py-1.5">
            <p className="text-xs text-white/90 line-clamp-1">{activeImage.detail}</p>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => go(i, i > current ? 1 : -1)}
              className={cn(
                "shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
                i === current
                  ? "border-primary scale-105 shadow-md"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <ProductImage
                src={img.image}
                alt={name}
                className="h-16 w-16 object-cover"
                fallbackSize="sm"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stock Badge ──────────────────────────────────────────────────────────────

function StockBadge({ quantity }: { quantity: number }) {
  if (quantity === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <PackageX className="h-3.5 w-3.5" /> Out of Stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      <PackageCheck className="h-3.5 w-3.5" /> In Stock
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductDetailsClient({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState<DetailTab>("overview");
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const query = useQuery({
    queryKey: ["product-details", productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error("Failed to load product");
      return (await res.json()) as ProductDetailsResponse;
    },
  });

  const product = query.data?.product;
  const relatedProducts = query.data?.related ?? [];

  const stockCount = product?.quantity ?? 0;
  const outOfStock = stockCount === 0;

  useEffect(() => {
    if (stockCount > 0 && quantity > stockCount) setQuantity(stockCount);
  }, [stockCount, quantity]);

  const orderedImages = useMemo(
    () =>
      product
        ? [...product.images]
            .map((image) => ({
              ...image,
              image: normalizeImageSrc(image.image),
            }))
            .sort(
            (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.index - b.index
          )
        : [],
    [product]
  );

  const discountedPrice =
    product && product.discount
      ? product.retailPrice * (1 - product.discount / 100)
      : product?.retailPrice ?? 0;

  const atMaxStock = stockCount > 0 && quantity >= stockCount;

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAddingToCart(true);

    try {
      // Get existing localStorage cart
      const currentCartRaw = localStorage.getItem("welcona_cart");
      let currentCart = currentCartRaw ? JSON.parse(currentCartRaw) : [];

      if (!Array.isArray(currentCart)) {
        currentCart = [];
      }

      // Check if product is already inside the cart
      const existingItem = currentCart.find((item: any) => item.productId === product.id);

      if (existingItem) {
        existingItem.quantity = Math.min(stockCount, existingItem.quantity + quantity);
      } else {
        const primaryImage = product.images.find(img => img.isPrimary) ?? product.images[0];
        currentCart.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          retailPrice: product.retailPrice,
          discount: product.discount,
          wholesalePrice: product.wholesalePrice,
          wholesaleMinQuantity: product.wholesaleMinQuantity,
          image: primaryImage ? primaryImage.image : "",
          quantity: quantity,
        });
      }

      // Write updated cart back to local storage
      localStorage.setItem("welcona_cart", JSON.stringify(currentCart));
      
      toast.success("Added to cart");
      
      // Dispatch cart update event
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      toast.error("Failed to add item to cart.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // ── Loading ──
  if (query.isLoading) {
    return (
      <section className="mx-auto flex w-full max-w-7xl items-center justify-center px-5 py-24">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading product details…
        </div>
      </section>
    );
  }

  // ── Error ──
  if (query.isError || !product) {
    return (
      <section className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-4 px-5 py-24 text-center">
        <p className="text-2xl font-semibold">Unable to load this product.</p>
        <p className="text-muted-foreground">It may have been removed or is temporarily unavailable.</p>
        <Button asChild>
          <Link href="/products">Back to products</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-10 md:px-8 md:py-14">
      {/* ── Gallery + Info ── */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ProductGallery images={orderedImages} name={product.name} />

        <div className="space-y-5">
          {/* Info card */}
          <div className="space-y-4 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm">
            {/* Badge row */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full px-3 py-1">{product.category.name}</Badge>
              {product.discount ? (
                <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white">
                  Save {product.discount}%
                </Badge>
              ) : null}
              <Badge variant="outline" className="rounded-full px-3 py-1 font-mono text-xs">
                SKU {product.sku}
              </Badge>
              <StockBadge quantity={stockCount} />
            </div>

            {/* Name */}
            <h1 className="text-2xl font-semibold tracking-tight md:text-4xl md:leading-[1.1]">
              {product.name}
            </h1>

            {/* Description — only if it exists */}
            {product.description && (
              <p className="text-sm leading-7 text-muted-foreground">{product.description}</p>
            )}

            {/* Price block */}
            <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5 shadow-sm space-y-3">
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5 font-medium">Retail Price</span>
                <div className="flex flex-wrap items-end gap-3">
                  <span className="text-3xl font-semibold tracking-tight">
                    {formatPrice(discountedPrice)}
                  </span>
                  {product.discount ? (
                    <span className="pb-0.5 text-sm text-muted-foreground line-through">
                      {formatPrice(product.retailPrice)}
                    </span>
                  ) : null}
                </div>
              </div>
              
              {product.wholesalePrice ? (
                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block mb-0.5">Wholesale Price</span>
                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">
                      {formatPrice(product.wholesalePrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block mb-0.5 font-medium">Wholesale Min Qty</span>
                    <span className="text-base font-semibold text-foreground">
                      {product.wholesaleMinQuantity} units
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Quantity + CTA */}
            {outOfStock ? (
              <Button size="lg" className="w-full rounded-full" disabled>
                <PackageX className="mr-2 h-4 w-4" /> Currently Unavailable
              </Button>
            ) : (
              <div className="space-y-3">
                {/* Quantity control */}
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Quantity</p>
                  <div className="inline-flex items-center rounded-full border border-border bg-background/80 p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <input
                      value={quantity}
                      onChange={(e) => {
                        const v = Math.max(1, Math.min(stockCount, Number(e.target.value) || 1));
                        setQuantity(v);
                      }}
                      type="number"
                      min={1}
                      max={stockCount}
                      className="h-9 w-14 border-none bg-transparent text-center text-base font-semibold outline-none"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setQuantity((q) => Math.min(stockCount, q + 1))}
                      disabled={atMaxStock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {atMaxStock && (
                    <p className="text-xs text-amber-600">Max stock reached</p>
                  )}
                </div>

                {/* Add to Cart button */}
                <Button
                  size="lg"
                  className="w-full rounded-full"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="mr-2 h-4 w-4" />
                  )}
                  Add to Cart
                </Button>
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Trust cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="rounded-2xl border-border/70 bg-card/85 py-0">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-primary" /> Dispatch Ready
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-xs text-muted-foreground">
                Packed with finish protection and fitting notes.
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/70 bg-card/85 py-0">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Warranty
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-xs text-muted-foreground">
                {product.warranty || "Manufacturer-backed warranty."}
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/70 bg-card/85 py-0">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" /> Finish
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-xs text-muted-foreground">
                {product.finish || "Premium quality finish."}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Tabs: Overview / Specs ── */}
      <div className="space-y-5 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap gap-2">
          {(["overview", "specs"] as DetailTab[]).map((tab) => (
            <Button
              key={tab}
              type="button"
              variant={selectedTab === tab ? "default" : "outline"}
              onClick={() => setSelectedTab(tab)}
              className="rounded-full px-5"
            >
              {tab === "overview" ? "Overview" : "Specifications"}
            </Button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {selectedTab === "overview" ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
            >
              <div className="space-y-3 text-sm leading-7 text-muted-foreground">
                {product.description ? (
                  <p>{product.description}</p>
                ) : (
                  <p className="italic text-muted-foreground/60">No overview added yet.</p>
                )}
              </div>
              <div className="grid gap-0 rounded-[1.5rem] border border-border/70 bg-background/70 p-5 text-sm">
                {[
                  { label: "Category", value: product.category.name },
                  { label: "Retail price", value: formatPrice(product.retailPrice) },
                  {
                    label: "Discount",
                    value: product.discount ? `${product.discount}%` : "No active offer",
                  },
                  ...(product.wholesalePrice ? [
                    { label: "Wholesale Price", value: formatPrice(product.wholesalePrice) },
                    { label: "Wholesale Min Qty", value: `${product.wholesaleMinQuantity} units` }
                  ] : [])
                ].map((row, i, arr) => (
                  <div
                     key={row.label}
                    className={cn(
                      "flex items-center justify-between gap-4 py-2.5",
                      i < arr.length - 1 && "border-b border-border/60"
                    )}
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="specs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid gap-4 sm:grid-cols-3"
            >
              {[
                { label: "Finish", value: product.finish },
                { label: "Material", value: product.material },
                { label: "Warranty", value: product.warranty },
              ].map((spec) => (
                <div
                  key={spec.label}
                  className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5"
                >
                  <p className="text-xs text-muted-foreground mb-1.5">{spec.label}</p>
                  {spec.value ? (
                    <p className="text-base font-semibold tracking-tight">{spec.value}</p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/60">Not specified</p>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Related Products ── */}
      {relatedProducts.length > 0 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Related Products</h2>
            <p className="text-sm text-muted-foreground mt-1">From the same category</p>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {relatedProducts.map((rel) => {
              const img = rel.images.find((i) => i.isPrimary) ?? rel.images[0];
              const relPrice = rel.discount
                ? rel.retailPrice * (1 - rel.discount / 100)
                : rel.retailPrice;
              return (
                <Link
                  key={rel.id}
                  href={`/products/${rel.id}`}
                  className="group overflow-hidden rounded-[1.25rem] border border-border/70 bg-card/85 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {img ? (
                      <ProductImage
                        src={img.image}
                        alt={rel.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        fallbackSize="md"
                      />
                    ) : null}
                    {rel.discount ? (
                      <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        -{rel.discount}%
                      </div>
                    ) : null}
                  </div>
                  <div className="p-3 space-y-1.5">
                    <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {rel.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatPrice(relPrice)}</span>
                      {rel.discount ? (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(rel.retailPrice)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
