"use client";

import { useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  AlertCircle,
  Flame,
  Layers,
  ArrowRight,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard, type SharedProduct } from "@/components/users/ProductCard";

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

// ─── Category Row Component ───────────────────────────────────────────────────
interface CategoryRowProps {
  tab: {
    id: string;
    label: string;
    apiFilter: string;
  };
}

export function CategoryRow({ tab }: CategoryRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Build the correct API URL to load products (up to 10 items to select 6)
  let apiParams = "pageSize=10";
  if (tab.apiFilter) {
    apiParams += `&${tab.apiFilter}`;
  }
  const apiUrl = `/api/products?${apiParams}`;

  const { data, isLoading, isError } = useQuery<{ items: SharedProduct[]; total: number }>({
    queryKey: ["category-feed-products", tab.id, apiUrl],
    queryFn: async () => {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Determine standard redirection link based on selected active category
  let viewAllLink = "/products";
  if (tab.id === "deals") {
    viewAllLink = "/products?sort=discount";
  } else if (tab.id === "bulk") {
    viewAllLink = "/products?wholesale=true";
  } else if (tab.apiFilter?.includes("categoryId")) {
    const catId = tab.apiFilter.split("categoryId=")[1];
    viewAllLink = `/products?categoryId=${catId}`;
  }

  const displayItems = data?.items ? data.items.slice(0, 6) : [];

  const scrollCarousel = (dir: "left" | "right") => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
    }
  };

  // If there's no data and not loading, hide empty categories
  if (!isLoading && !isError && !data?.items?.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Category Row Header */}
      <div className="flex items-end justify-between border-b border-border/40 pb-3">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            {tab.id === "deals" && <Flame className="h-5 w-5 text-amber-500 animate-pulse" />}
            {tab.id === "bulk" && <Layers className="h-5 w-5 text-amber-500" />}
            {tab.id !== "deals" && tab.id !== "bulk" && <Package className="h-5 w-5 text-muted-foreground" />}
            {tab.label}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href={viewAllLink}
            className="text-xs font-bold text-primary hover:underline transition-colors flex items-center gap-0.5 mr-2"
          >
            Explore All <ArrowRight className="h-3 w-3" />
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollCarousel("left")}
              className="h-7 w-7 rounded-full shadow-sm hover:bg-muted"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollCarousel("right")}
              className="h-7 w-7 rounded-full shadow-sm hover:bg-muted"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Product carousel / loading / error */}
      {isLoading ? (
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-none sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6 w-full">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[240px] sm:w-auto shrink-0 snap-start flex flex-col">
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground bg-card/25 rounded-2xl border border-dashed border-border/85">
          <AlertCircle className="h-8 w-8 text-destructive/60" />
          <p className="text-xs font-semibold">Failed to load {tab.label} items.</p>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-none sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6 w-full scroll-smooth"
        >
          {/* Display exactly 6 products */}
          {displayItems.map((item, i) => (
            <div key={item.id} className="w-[240px] sm:w-auto shrink-0 snap-start flex flex-col">
              <ProductCard item={item} index={i} />
            </div>
          ))}

          {/* Unconditionally Render 7th Card: View More card at the end of the row */}
          <div className="w-[240px] sm:w-auto shrink-0 snap-start flex flex-col min-h-[350px] sm:min-h-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative flex flex-col items-center justify-center text-center w-full h-full p-6 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-3xl hover:border-primary/45 shadow-sm hover:shadow-xl transition-all duration-300 flex-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner mb-4">
                <ArrowRight className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Explore All</h4>
              <p className="text-[10px] text-muted-foreground max-w-[150px] mt-1 mb-4">
                View complete range of premium {tab.label} fittings.
              </p>
              <Link href={viewAllLink} className="w-full">
                <Button size="sm" className="w-full rounded-full font-bold shadow-md text-xs">
                  View More
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main HotTabs (Multi-Category Feed) Component ─────────────────────────────
interface Props {
  tabs: any[];
}

export function HotTabs({ tabs }: Props) {
  // Filter out "all" because we want distinct categories/offers rows down the page
  const rows = tabs.filter((t) => t.id !== "all");

  return (
    <section className="py-16 border-b border-border/50 bg-background/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Section Header */}
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Browse & Shop
          </p>
          <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">
            Our Premium Collections
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Explore our curated, top-selling lines of premium luxury bath fittings direct from the factory floor.
          </p>
        </div>

        {/* Categories sequential feeds */}
        <div className="space-y-16">
          {rows.map((row) => (
            <CategoryRow key={row.id} tab={row} />
          ))}
        </div>
      </div>
    </section>
  );
}
