"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ShoppingCart, Eye, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, normalizeImageSrc } from "@/lib/utils";
import { toast } from "sonner";

export type CatalogProductImage = {
  image: string;
  isPrimary: boolean;
  index: number;
};

export type SharedProduct = {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  tags: string[];
  retailPrice: number;
  discount?: number | null;
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number;
  inStock?: boolean;
  quantity?: number;
  category: { id: string; name: string };
  images: CatalogProductImage[];
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut", delay: Math.min(i * 0.05, 0.3) },
  }),
};

export function ProductCard({ item, index }: { item: SharedProduct; index: number }) {
  const primaryImage =
    item.images.find((img) => img.isPrimary)?.image ??
    item.images.sort((a, b) => a.index - b.index)[0]?.image;

  const isOutOfStock = item.inStock === false || (item.quantity !== undefined && item.quantity <= 0);

  const discountedPriceVal =
    item.discount && item.discount > 0
      ? item.retailPrice * (1 - item.discount / 100)
      : item.retailPrice;

  const savings = item.discount && item.discount > 0 ? item.retailPrice - discountedPriceVal : 0;

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock) {
      toast.error("Product is currently out of stock!");
      return;
    }

    try {
      const data = localStorage.getItem("welcona_cart");
      const cart = data ? JSON.parse(data) : [];
      const existing = cart.find((i: any) => i.productId === item.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          productId: item.id,
          name: item.name,
          sku: item.sku,
          retailPrice: item.retailPrice,
          discount: item.discount,
          wholesalePrice: item.wholesalePrice,
          wholesaleMinQuantity: item.wholesaleMinQuantity,
          image: primaryImage || "",
          quantity: 1,
        });
      }

      localStorage.setItem("welcona_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart-updated"));
      toast.success(`${item.name} added to cart!`);
    } catch {
      toast.error("Failed to add product to cart");
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative flex flex-col w-full h-full bg-card rounded-3xl border border-border/60 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300"
    >
      <Link href={`/products/${item.id}`} className="flex-1 flex flex-col">
        {/* Product Image Panel */}
        <div className="relative aspect-square sm:aspect-[1.35/1] w-full bg-muted overflow-hidden group">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={normalizeImageSrc(primaryImage)}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <Sparkles className="h-10 w-10 opacity-20 animate-pulse" />
            </div>
          )}

          {/* Top Badges overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-1.5 z-10 pointer-events-none">
            <Badge className="bg-background/90 hover:bg-background/90 text-foreground/80 text-[10px] font-semibold border-0 shadow-sm backdrop-blur-md rounded-full px-2.5 py-0.5">
              {item.category.name}
            </Badge>

            {item.discount && item.discount > 0 ? (
              <Badge className="bg-red-500 text-white text-[10px] font-bold border-0 shadow-md rounded-full px-2 py-0.5 animate-pulse">
                Save {Math.round(item.discount)}%
              </Badge>
            ) : null}
          </div>

          {/* Wholesale Offer Overlay */}
          {item.wholesalePrice && (
            <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
              <Badge className="bg-amber-500 text-white text-[9px] font-bold border-0 shadow-md rounded-full px-2.5 py-0.5 flex items-center gap-1">
                <span>Wholesale Option</span>
              </Badge>
            </div>
          )}

          {/* Stock Overlay */}
          <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
            {isOutOfStock ? (
              <Badge className="bg-destructive/90 text-destructive-foreground text-[9px] font-bold border-0 shadow-md rounded-full px-2.5 py-0.5 flex items-center gap-1 backdrop-blur-sm">
                <XCircle className="h-2.5 w-2.5" /> Out of stock
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/90 text-white text-[9px] font-bold border-0 shadow-md rounded-full px-2.5 py-0.5 flex items-center gap-1 backdrop-blur-sm">
                <CheckCircle2 className="h-2.5 w-2.5" /> In stock
              </Badge>
            )}
          </div>

          {/* Quick Actions Hover Mask */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300 font-semibold"
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
            <Button
              size="sm"
              variant="default"
              className="rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300 font-semibold"
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> View
            </Button>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            {/* Title */}
            <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200">
              {item.name}
            </h3>

            {/* SKU and Rating simulation */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>SKU: {item.sku}</span>
              <span className="flex items-center gap-0.5 text-amber-500 font-medium">
                ★ 4.8 <span className="text-muted-foreground">(Premium)</span>
              </span>
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1.5">
                {item.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-medium text-muted-foreground bg-muted border border-border/40 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Price section */}
          <div className="pt-3 mt-3 border-t border-border/50 flex flex-col justify-end">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-foreground">
                {formatPrice(discountedPriceVal)}
              </span>
              {item.discount && item.discount > 0 && (
                <span className="text-[11px] text-muted-foreground line-through">
                  {formatPrice(item.retailPrice)}
                </span>
              )}
            </div>

            {/* Savings & Wholesale Info */}
            {savings > 0 && (
              <div className="text-[10px] text-green-600 font-medium mt-0.5">
                You save {formatPrice(savings)} ({Math.round(item.discount || 0)}%)
              </div>
            )}
            {item.wholesalePrice && (
              <div className="text-[9px] text-amber-600 font-semibold mt-1">
                Wholesale: {formatPrice(item.wholesalePrice)} (Min Qty: {item.wholesaleMinQuantity})
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
