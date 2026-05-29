"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  AlertCircle,
  Flame,
  Sparkles,
  Package,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductCard, type SharedProduct } from "@/components/users/ProductCard";

// ─── Tab icons ─────────────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, React.ElementType> = {
  deals: Flame,
  new: Sparkles,
  bulk: Layers,
  all: Package,
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-card rounded-3xl border overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-5 bg-muted rounded w-1/3" />
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
  
  // Build the correct API URL based on active tab to load 10 items on demand
  let apiParams = "pageSize=10";
  if (activeTab?.apiFilter) {
    apiParams += `&${activeTab.apiFilter}`;
  }
  const apiUrl = `/api/products?${apiParams}`;

  const { data, isLoading, isError } = useQuery<{ items: SharedProduct[]; total: number }>({
    queryKey: ["hot-tabs-products", activeTabId, apiUrl],
    queryFn: async () => {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const scrollTabs = (dir: "left" | "right") => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  // Determine standard redirection link based on selected active tab
  let viewAllLink = "/products";
  if (activeTabId === "deals") {
    viewAllLink = "/products?sort=discount";
  } else if (activeTabId === "bulk") {
    viewAllLink = "/products?wholesale=true";
  } else if (activeTab?.apiFilter?.includes("categoryId")) {
    const catId = activeTab.apiFilter.split("categoryId=")[1];
    viewAllLink = `/products?categoryId=${catId}`;
  }

  // Handle display logic: Max 10 items total. If total > 9, show 9 items and a "View More" card.
  const displayItems = data?.items ? data.items.slice(0, 9) : [];
  const hasMoreThanNine = data?.items && data.items.length >= 10;

  return (
    <section className="py-16 border-b border-border/50 bg-background/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
              Browse & Shop
            </p>
            <h2 className="text-3xl font-bold tracking-tight">Our Premium Collections</h2>
          </div>
          <Link
            href={viewAllLink}
            className="text-sm font-semibold text-primary hover:underline transition-colors flex items-center gap-1"
          >
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Tabs row */}
        <div className="relative flex items-center gap-2 mb-10">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => scrollTabs("left")}
            className="shrink-0 rounded-full shadow-sm hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div
            ref={tabsRef}
            className="flex gap-2 overflow-x-auto scrollbar-none scroll-smooth flex-1 py-1"
          >
            {tabs.map((tab) => {
              const Icon = TAB_ICONS[tab.id] ?? Package;
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 shrink-0 border shadow-sm",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary scale-102 shadow-md"
                      : "bg-card text-muted-foreground border-border hover:border-primary/45 hover:text-foreground hover:bg-muted/10"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => scrollTabs("right")}
            className="shrink-0 rounded-full shadow-sm hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-fade-in">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <AlertCircle className="h-10 w-10 text-destructive/60 animate-bounce" />
            <p className="text-sm font-medium">Failed to load products.</p>
            <Link href="/products" className="text-xs text-primary underline underline-offset-4 hover:text-primary/80">
              Browse all products instead
            </Link>
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground border-2 border-dashed border-border/80 bg-card/40 rounded-3xl animate-fade-in">
            <ShoppingBag className="h-12 w-12 opacity-30 text-primary" />
            <p className="text-sm font-semibold">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {/* Display products */}
            {displayItems.map((item, i) => (
              <ProductCard key={item.id} item={item} index={i} />
            ))}

            {/* Render 10th Card: View More card if there are more than 9 products */}
            {hasMoreThanNine && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative flex flex-col items-center justify-center text-center w-full min-h-[300px] p-6 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-3xl hover:border-primary/45 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner mb-6">
                  <ArrowRight className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">View More Products</h3>
                <p className="text-xs text-muted-foreground max-w-[180px] mt-2 mb-6">
                  Explore our complete range of premium {activeTab?.label} items.
                </p>
                <Link href={viewAllLink} className="w-full">
                  <Button className="w-full rounded-full font-semibold shadow-md">
                    Explore All
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
