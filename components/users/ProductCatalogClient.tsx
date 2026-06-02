"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery, keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import {
  AnimatePresence,
  motion,
  type Variants,
} from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  PackageCheck,
  X,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import HeroSlider from "@/components/users/catalog/HeroSlider";
import CategoryTabs from "@/components/users/catalog/CategoryTabs";
import { ProductCard, type SharedProduct } from "@/components/users/ProductCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
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

function SkeletonRow() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-48 bg-muted rounded-full" />
      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-none w-full">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-[240px] shrink-0 flex flex-col">
            <SkeletonCard />
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="w-full flex flex-col">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}

// ─── Infinite Catalog Row Component ──────────────────────────────────────────
interface CatalogRowProps {
  id: string;
  label: string;
  apiFilter: string;
}

function CatalogRow({ id, label, apiFilter }: CatalogRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["infinite-row-products", id, apiFilter],
    queryFn: async ({ pageParam = 1 }) => {
      let url = `/api/products?page=${pageParam}&pageSize=8`;
      if (apiFilter) {
        url += `&${apiFilter}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });

  const products = data?.pages.flatMap((p) => p.items) ?? [];

  const scrollCarousel = (dir: "left" | "right") => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return <SkeletonRow />;
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 py-6 text-muted-foreground bg-card/25 rounded-2xl border border-dashed p-4">
        <AlertCircle className="h-5 w-5 text-destructive/60 animate-bounce" />
        <p className="text-xs font-semibold">Failed to load {label} collection.</p>
      </div>
    );
  }

  if (!products.length) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Row Header */}
      <div className="flex items-end justify-between border-b border-border/40 pb-3">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground uppercase">
            {label}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Showing {products.length} fittings {hasNextPage && "• Scroll to load more"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
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

      {/* Dynamic Swipe Carousel */}
      <div 
        ref={containerRef}
        className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-none w-full scroll-smooth"
      >
        {products.map((item, i) => (
          <div key={item.id} className="w-[240px] shrink-0 snap-start flex flex-col">
            <ProductCard item={item} index={i} />
          </div>
        ))}

        {/* Load More Card */}
        {hasNextPage ? (
          <div className="w-[240px] shrink-0 snap-start flex flex-col min-h-[350px]">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="group relative flex flex-col items-center justify-center text-center w-full h-full p-6 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-3xl hover:border-primary/45 shadow-sm hover:shadow-xl transition-all duration-300 flex-1 cursor-pointer disabled:opacity-70"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner mb-4">
                <ChevronRight className={`h-6 w-6 ${isFetchingNextPage ? "animate-spin" : ""}`} />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </h4>
              <p className="text-[10px] text-muted-foreground max-w-[150px] mt-1">
                Click to load next products in this section.
              </p>
            </button>
          </div>
        ) : (
          <div className="w-[240px] shrink-0 snap-start flex flex-col min-h-[350px]">
            <div className="flex flex-col items-center justify-center text-center w-full h-full p-6 bg-muted/20 border border-dashed border-border/80 rounded-3xl flex-1 select-none">
              <PackageCheck className="h-8 w-8 text-muted-foreground/30 mb-4" />
              <h4 className="text-sm font-semibold text-muted-foreground">All Caught Up!</h4>
              <p className="text-[10px] text-muted-foreground/80 max-w-[150px] mt-1">
                You've viewed all {products.length} fittings in {label}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function ProductCatalogClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // ── Read filter state from URL ──────────────────────────────────────────
  const q = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "all";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  // ── Local input state (debounced for search) ─────────────────────────────
  const [searchInput, setSearchInput] = useState(q);
  const debouncedSearch = useDebounce(searchInput, 450);

  // ── URL updater ─────────────────────────────────────────────────────────
  const updateURL = useCallback(
    (updates: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value) current.delete(key);
        else current.set(key, value);
      }
      if (!("page" in updates)) current.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${current.toString()}`, { scroll: false });
      });
    },
    [searchParams, router, pathname]
  );

  // ── Sync debounced search to URL ────────────────────────────────────────
  useEffect(() => {
    if (debouncedSearch !== q) {
      updateURL({ q: debouncedSearch || null });
    }
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch dynamic categories for browse rows ────────────────────────────
  const { data: initialData, isLoading: categoriesLoading, isError: categoriesError } = useQuery({
    queryKey: ["catalog-categories-init"],
    queryFn: async () => {
      const res = await fetch("/api/products?pageSize=1");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  // ── Query for standard SEARCH mode ──────────────────────────────────────
  const searchApiParams = new URLSearchParams({ page: String(page), pageSize: "12", sort: "newest" });
  if (categoryId !== "all") searchApiParams.set("categoryId", categoryId);
  if (q) searchApiParams.set("q", q);

  const { data: searchData, isLoading: searchLoading, isError: searchError } = useQuery({
    queryKey: ["catalog-search", page, categoryId, q],
    queryFn: async () => {
      const res = await fetch(`/api/products?${searchApiParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!q,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const searchItems = searchData?.items ?? [];
  const searchTotal = searchData?.total ?? 0;
  const searchTotalPages = searchData?.totalPages ?? 1;

  // ── Build rows to render in BROWSE mode ──────────────────────────────────
  const categoriesList = initialData?.categories ?? [];
  let rowsToRender = [
    { id: "deals", label: "Best Deals", apiFilter: "sort=discount" },
    { id: "bulk", label: "Bulk Orders", apiFilter: "wholesale=true" },
    ...categoriesList.map((cat: any) => ({
      id: cat.id,
      label: cat.name,
      apiFilter: `categoryId=${cat.id}`,
    })),
  ];

  // If a specific category tab is selected, filter rows to only render that one
  if (categoryId !== "all") {
    rowsToRender = rowsToRender.filter((r) => r.id === categoryId);
  }

  const handleReset = () => {
    setSearchInput("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  const isSearchActive = !!q;

  return (
    <div className="min-h-screen pb-20 bg-background/30">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Category Tabs Navigation */}
      <CategoryTabs />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products by name, SKU, or keywords..."
                className="pl-10 h-12 rounded-full bg-background border-border/70 shadow-sm"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {isSearchActive && (
              <Button
                variant="ghost"
                onClick={handleReset}
                className="h-12 rounded-full gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* ── MODE 1: SEARCH / QUERY ACTIVE ─────────────────────────────────── */}
        {isSearchActive ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-black tracking-tight text-foreground uppercase">
                Search Results ({searchTotal})
              </h2>
              {searchTotalPages > 1 && (
                <p className="text-xs text-muted-foreground">
                  Page {page} of {searchTotalPages}
                </p>
              )}
            </div>

            {searchLoading ? (
              <SearchSkeletonGrid />
            ) : searchError ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl bg-card/40">
                <AlertCircle className="h-10 w-10 text-destructive/60 mx-auto mb-3 animate-bounce" />
                <p className="text-lg font-semibold text-destructive">Failed to load search results</p>
                <p className="text-sm text-muted-foreground mt-1">Please try again.</p>
              </div>
            ) : searchItems.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border/60 rounded-3xl bg-card/40">
                <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-lg font-semibold">No matches found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search terms or filters.
                </p>
                <Button variant="outline" onClick={handleReset} className="mt-4 rounded-full gap-2">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear search query
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchItems.map((item: any, i: number) => (
                  <ProductCard key={item.id} item={item} index={i} />
                ))}
              </div>
            )}

            {/* Standard Pagination for search results */}
            {!searchLoading && !searchError && searchTotalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateURL({ page: String(page - 1) })}
                  disabled={page === 1}
                  className="rounded-full"
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  Page {page} of {searchTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateURL({ page: String(page + 1) })}
                  disabled={page === searchTotalPages}
                  className="rounded-full"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* ── MODE 2: BROWSE FEED SEQUENTIAL SHELVES ──────────────────────── */
          <div className="space-y-16">
            {categoriesLoading ? (
              <div className="space-y-16">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : categoriesError ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl bg-card/40">
                <AlertCircle className="h-10 w-10 text-destructive/60 mx-auto mb-3 animate-bounce" />
                <p className="text-lg font-semibold text-destructive">Failed to initialize catalog</p>
                <p className="text-sm text-muted-foreground mt-1">Please try reloading the page.</p>
              </div>
            ) : (
              <div className="space-y-16">
                {rowsToRender.map((row) => (
                  <CatalogRow
                    key={row.id}
                    id={row.id}
                    label={row.label}
                    apiFilter={row.apiFilter}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
