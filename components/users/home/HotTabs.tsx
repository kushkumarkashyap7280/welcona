"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Star,
  AlertCircle,
  Flame,
  Sparkles,
  Package,
  PackageCheck,
  PackageX,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { normalizeImageSrc } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type CatalogProductImage = {
  image: string;
  isPrimary: boolean;
  index: number;
};

type CatalogItem = {
  id: string;
  name: string;
  sku: string;
  description?: string;
  tags: string[];
  retailPrice: number;
  discount?: number;
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number;
  inStock: boolean;
  category: { id: string; name: string };
  images: CatalogProductImage[];
};

type CatalogResponse = {
  items: CatalogItem[];
  total: number;
};

// ─── Tab icons ─────────────────────────────────────────────────────────────────

const TAB_ICONS: Record<string, React.ElementType> = {
  deals: Flame,
  new: Sparkles,
  bulk: Layers,
  showers: ShoppingBag,
  taps: Package,
  all: Package,
};

// ─── Product Card ─────────────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay: Math.min(i * 0.05, 0.4) },
  }),
};

function ProductCard({ item, index }: { item: CatalogItem; index: number }) {
  const primaryImage =
    item.images.find((img) => img.isPrimary)?.image ??
    item.images.sort((a, b) => a.index - b.index)[0]?.image;

  const priceFormatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(item.retailPrice);

  const discountedPrice =
    item.discount && item.discount > 0
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(item.retailPrice * (1 - item.discount / 100))
      : null;

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      initial="hidden"
      animate="visible"
      className="group relative bg-card rounded-2xl border border-border/70 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 flex flex-col"
    >
      <Link href={`/products/${item.id}`} className="flex-1 flex flex-col">
        {/* Image */}
        <div className="relative w-full aspect-4/5 bg-muted overflow-hidden">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={normalizeImageSrc(primaryImage)}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Package className="h-12 w-12 opacity-30" />
            </div>
          )}

          {/* Discount badge */}
          {item.discount && item.discount > 0 ? (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm z-10">
              -{Math.round(item.discount)}%
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2 flex-1 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {item.category.name}
            </Badge>
          </div>

          <p className="text-sm sm:text-base font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {item.name}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3">
            <div>
              <div className="text-lg font-bold text-foreground">
                {discountedPrice ?? priceFormatted}
              </div>
              {discountedPrice && (
                <div className="text-xs text-muted-foreground line-through">{priceFormatted}</div>
              )}
            </div>

            <div className="shrink-0">
              <Button size="sm" className="px-3 py-1">
                View
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl border overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-2.5 sm:p-3.5 space-y-1.5 sm:space-y-2">
        <div className="h-3 sm:h-4 bg-muted rounded w-1/3" />
        <div className="h-3 sm:h-4 bg-muted rounded w-3/4" />
        <div className="h-3 sm:h-4 bg-muted rounded w-1/2" />
        <div className="h-4 sm:h-5 bg-muted rounded w-1/3" />
      </div>
    </div>
  );
}

// ─── HotTabs Component ────────────────────────────────────────────────────────



interface Props {
  tabs: any[];
}

export function HotTabs({ tabs }: Props) {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "all");
  const tabsRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const apiUrl = activeTab?.apiFilter
    ? `/api/products?${activeTab.apiFilter}&pageSize=12`
    : `/api/products?pageSize=12`;

  const { data, isLoading, isError } = useQuery<CatalogResponse>({
    queryKey: ["hot-tabs", activeTabId, apiUrl],
    queryFn: async () => {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const scrollTabs = useCallback((dir: "left" | "right") => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    }
  }, []);

  return (
    <section className="py-12 border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
              Browse & Shop
            </p>
            <h2 className="text-2xl font-bold">Find Your Perfect Fit</h2>
          </div>
          <Link
            href="/products"
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Tabs row */}
        <div className="relative flex items-center gap-2 mb-8">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => scrollTabs("left")}
            className="shrink-0 rounded-full shadow-sm"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <div
            ref={tabsRef}
            className="flex gap-2 overflow-x-auto scrollbar-none scroll-smooth flex-1"
          >
            {tabs.map((tab) => {
              const Icon = TAB_ICONS[tab.id] ?? Package;
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => scrollTabs("right")}
            className="shrink-0 rounded-full shadow-sm"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <AlertCircle className="h-8 w-8 text-destructive/60" />
            <p className="text-sm">Failed to load products.</p>
            <Link href="/products" className="text-xs text-primary underline-offset-4 hover:underline">
              Browse all products instead
            </Link>
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground border-2 border-dashed rounded-2xl">
            <Package className="h-10 w-10 opacity-30" />
            <p className="text-sm">No products found for this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {data.items.map((item, i) => (
              <ProductCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
