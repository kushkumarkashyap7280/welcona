"use client";

import { useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Star,
  Loader2,
  AlertCircle,
  Package,
  PackageCheck,
  PackageX,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";

/* ------------------------------------------------------------------ */
/* Types (mirrors CatalogResponse from the products API)               */
/* ------------------------------------------------------------------ */

type CatalogItem = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  tags: string[];
  retailPrice: number;
  discount: number | null;
  inStock: boolean;
  category: { id: string; name: string };
  images: {
    id: string;
    image: string;
    detail: string | null;
    isPrimary: boolean;
    index: number;
  }[];
};

type CatalogResponse = {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  categories: { id: string; name: string }[];
  items: CatalogItem[];
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

/* ------------------------------------------------------------------ */
/* Skeleton card                                                        */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="flex-none w-65 md:w-70 rounded-[1.5rem] border border-border/70 bg-muted/30 overflow-hidden animate-pulse">
      <div className="h-56 bg-muted/50" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-5 bg-muted rounded w-1/2 mt-2" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product Card                                                         */
/* ------------------------------------------------------------------ */

function ProductCard({ product, index }: { product: CatalogItem; index: number }) {
  const primaryImage =
    product.images.find((img) => img.isPrimary) ?? product.images[0];
  const discountedPrice = product.discount
    ? product.retailPrice * (1 - product.discount / 100)
    : product.retailPrice;

  return (
    <motion.div
      initial={{ opacity: 0, x: 48 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
        delay: Math.min(index * 0.06, 0.45),
      }}
      className="flex-none w-65 md:w-70"
    >
      <Link
        href={`/products/${product.id}`}
        className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/30"
      >
        {/* Image */}
        <div className="relative h-52 overflow-hidden bg-muted">
          {primaryImage ? (
            <ProductImage
              src={primaryImage.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              fallbackSize="lg"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}

          {/* Overlay badges */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <Badge className="bg-background/90 text-foreground/80 shadow-none text-[10px] font-medium">
              {product.category.name}
            </Badge>
            {product.discount ? (
              <Badge className="bg-emerald-600 text-white shadow-none text-[10px] font-semibold">
                -{product.discount}%
              </Badge>
            ) : null}
          </div>

          <div className="absolute bottom-0 inset-x-0 py-1 text-center text-[10px] font-semibold text-white bg-black/55 backdrop-blur-sm">
            {product.inStock ? (
              <span className="inline-flex items-center gap-1">
                <PackageCheck className="h-3 w-3" /> In Stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <PackageX className="h-3 w-3" /> Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2.5 p-4">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
            {product.name}
          </h3>



          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {product.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Price row */}
          <div className="flex items-end justify-between border-t border-border/60 pt-3 mt-auto">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Price</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-bold">{formatPrice(discountedPrice)}</span>
                {product.discount ? (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(product.retailPrice)}
                  </span>
                ) : null}
              </div>
            </div>
            <span className="text-xs font-semibold text-primary transition-colors group-hover:text-primary/80">
              View →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* ProductRow                                                           */
/* ------------------------------------------------------------------ */

export interface ProductRowProps {
  /** Row heading */
  title: string;
  /** Small label above the heading */
  subtitle: string;
  /** Optional secondary copy */
  description?: string;
  /** URL passed to /api/products  e.g. "/api/products?sort=discount&pageSize=10" */
  apiUrl: string;
  /** Link for the "View all" button */
  viewAllHref?: string;
  /** TanStack Query cache key suffix (must be unique per row) */
  queryKey: string;
}

export function ProductRow({
  title,
  subtitle,
  description,
  apiUrl,
  viewAllHref = "/products",
  queryKey,
}: ProductRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["home-product-row", queryKey],
    queryFn: async () => {
      const res = await fetch(apiUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json() as Promise<CatalogResponse>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const items = data?.items ?? [];

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.78;
    scrollRef.current.scrollBy({
      left: dir === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-7 flex items-end justify-between"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {subtitle}
          </p>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
          {description && (
            <p className="mt-1.5 text-sm text-muted-foreground max-w-lg">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-full"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-full"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Link
            href={viewAllHref}
            className="hidden items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors sm:inline-flex ml-1"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.div>

      {/* ── Scrollable row ── */}
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/8 px-6 py-10 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Unable to load products. Please refresh the page.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-14 text-center text-sm text-muted-foreground">
          No products found in this section yet.
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="scrollbar-none flex gap-4 overflow-x-auto pb-2 scroll-smooth"
        >
          {items.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}

          {/* "See more" end card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="flex-none w-45 md:w-50"
          >
            <Link
              href={viewAllHref}
              className="group flex h-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-muted/20 p-6 text-center transition-colors hover:bg-muted/40"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
              <p className="text-sm font-semibold text-foreground">View All</p>
              <p className="mt-1 text-xs text-muted-foreground">See full collection</p>
            </Link>
          </motion.div>
        </div>
      )}

      {/* Mobile view-all link */}
      <div className="mt-4 flex sm:hidden">
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pre-configured convenient exports                                    */
/* ------------------------------------------------------------------ */

export function FeaturedProductsRow() {
  return (
    <ProductRow
      queryKey="featured"
      title="Popular Products"
      subtitle="Bestsellers"
      description="Our most-loved bath fittings — chosen by thousands of satisfied customers."
      apiUrl="/api/products?sort=newest&pageSize=10"
      viewAllHref="/products"
    />
  );
}

export function OffersRow() {
  return (
    <ProductRow
      queryKey="offers"
      title="Best Deals & Offers"
      subtitle="Limited Offers"
      description="Factory-direct savings on premium fittings — discounts applied directly at source."
      apiUrl="/api/products?sort=discount&pageSize=10"
      viewAllHref="/products?sort=discount"
    />
  );
}

export function NewArrivalsRow() {
  return (
    <ProductRow
      queryKey="new"
      title="New Arrivals"
      subtitle="Just Added"
      description="Fresh designs straight from our production line — be the first to upgrade your space."
      apiUrl="/api/products?sort=newest&pageSize=10"
      viewAllHref="/products?sort=newest"
    />
  );
}
