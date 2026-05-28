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
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  AnimatePresence,
  motion,
  type Variants,
  useReducedMotion,
} from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Star,
  Package,
  PackageCheck,
  PackageX,
  X,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { isGoogleHostedImageSrc, normalizeImageSrc } from "@/lib/utils";
import HeroSlider from "@/components/users/catalog/HeroSlider";
import CategoryTabs from "@/components/users/catalog/CategoryTabs";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  images: { id: string; image: string; detail: string | null; isPrimary: boolean; index: number }[];
};

type CatalogResponse = {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
  categories: { id: string; name: string }[];
  allTags: string[];
  items: CatalogItem[];
};

type SortMode = "newest" | "priceAsc" | "priceDesc" | "discount";

// ─── Hero Images ──────────────────────────────────────────────────────────────

const HERO_IMAGES = [
  {
    url: "/productCatelogAnimationImages/image1.png",
    title: "Luxury Bath Fittings",
    subtitle: "Crafted for lasting elegance, delivered direct from factory",
  },
  {
    url: "/productCatelogAnimationImages/image2.png",
    title: "Premium Showers",
    subtitle: "Transform your daily ritual with rainfall perfection",
  },
  {
    url: "/productCatelogAnimationImages/image3.png",
    title: "Precision Taps",
    subtitle: "ISI-certified brass fittings with anti-scale technology",
  },
  {
    url: "/productCatelogAnimationImages/image4.png",
    title: "Modern Vanities",
    subtitle: "Contemporary aesthetics designed for Indian interiors",
  },
  {
    url: "/productCatelogAnimationImages/image5.png",
    title: "Complete Your Space",
    subtitle: "Pan India delivery · 10-year warranty · Factory direct pricing",
  },
];

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

// ─── Hero Slider ──────────────────────────────────────────────────────────────

const slideVariants: Variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.65, ease: [0.32, 0.72, 0, 1] },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-25%" : "25%",
    opacity: 0,
    transition: { duration: 0.5, ease: "easeIn" },
  }),
};

const textVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut", delay: 0.2 } },
};



// ─── Category Tabs ─────────────────────────────────────────────────────────────



// ─── Product Card ──────────────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut", delay: Math.min(i * 0.04, 0.32) },
  }),
};

function ProductCard({ item, index }: { item: CatalogItem; index: number }) {
  const primaryImage =
    item.images.find((img) => img.isPrimary) ?? item.images.sort((a, b) => a.index - b.index)[0];
  const discountedPrice = item.discount
    ? item.retailPrice * (1 - item.discount / 100)
    : item.retailPrice;

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      initial="hidden"
      animate="visible"
      layout
      className="group bg-card rounded-2xl border border-border/70 overflow-hidden hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
    >
      <Link href={`/products/${item.id}`} className="block">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={normalizeImageSrc(primaryImage.image)}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex w-full h-full items-center justify-center text-muted-foreground/40">
              <Package className="h-10 w-10" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1">
            <Badge className="bg-background/90 text-foreground text-[10px] sm:text-xs px-1.5 py-0 sm:px-2.5 sm:py-0.5 shadow-none border-0 font-medium">
              {item.category.name}
            </Badge>
            {item.discount && item.discount > 0 ? (
              <Badge className="bg-red-500 text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 border-0 shadow-sm">
                -{Math.round(item.discount)}%
              </Badge>
            ) : null}
          </div>

          <div className="absolute bottom-0 inset-x-0 text-center py-0.5 sm:py-1 font-medium text-[10px] sm:text-xs bg-black/55 text-white backdrop-blur-sm">
            {item.inStock ? (
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
        <div className="p-2.5 sm:p-4 space-y-1.5 sm:space-y-2.5">
          <h3 className="text-xs sm:text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {item.name}
          </h3>



          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] sm:text-xs text-muted-foreground bg-muted px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-1.5 pt-1 border-t border-border/50">
            <span className="text-sm sm:text-base font-bold text-foreground">
              {formatPrice(discountedPrice)}
            </span>
            {item.discount && item.discount > 0 ? (
              <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                {formatPrice(item.retailPrice)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────

function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 pt-8 pb-4">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-full"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">
            ···
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={cn(
              "h-8 w-8 rounded-full text-sm font-medium transition-all",
              p === page
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {p}
          </button>
        )
      )}

      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-full"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>

      <span className="text-xs text-muted-foreground ml-2">
        Page {page} of {totalPages}
      </span>
    </div>
  );
}

// ─── Skeleton Grid ─────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-2xl border overflow-hidden animate-pulse">
          <div className="aspect-square bg-muted" />
          <div className="p-2.5 sm:p-4 space-y-1.5 sm:space-y-2">
            <div className="h-3 sm:h-3.5 bg-muted rounded w-1/3" />
            <div className="h-3 sm:h-4 bg-muted rounded w-3/4" />
            <div className="h-2.5 sm:h-3 bg-muted rounded w-1/2" />
            <div className="h-4 sm:h-5 bg-muted rounded w-1/3" />
          </div>
        </div>
      ))}
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
      // Reset page on filter changes (except when explicitly setting page)
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

  // ── Query ────────────────────────────────────────────────────────────────
  const apiParams = new URLSearchParams({ page: String(page), pageSize: "12", sort: "newest" });
  if (categoryId !== "all") apiParams.set("categoryId", categoryId);
  if (q) apiParams.set("q", q);

  const { data, isLoading, isError, isFetching } = useQuery<CatalogResponse>({
    queryKey: ["catalog", page, categoryId, q],
    queryFn: async () => {
      const res = await fetch(`/api/products?${apiParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const items = data?.items ?? [];
  const categories = data?.categories ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // ── Active filter count ──────────────────────────────────────────────────
  const activeFilterCount = [
    categoryId !== "all" ? 1 : 0,
    q ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleReset = () => {
    setSearchInput("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  return (
    <div className="min-h-screen pb-16">
      {/* ── Hero Slider ─────────────────────────────────────────────── */}
      <HeroSlider />

      {/* ── Category Tabs ───────────────────────────────────────────── */}
      <CategoryTabs />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ── Filters Bar ─────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products by name, SKU, or keywords..."
                className="pl-10 h-11 rounded-full bg-background border-border/70"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Reset */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                onClick={handleReset}
                className="h-11 rounded-full gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* ── Results header ───────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {isFetching && !isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                Updating…
              </span>
            ) : (
              <span className="text-foreground font-medium uppercase tracking-wider text-xs">
                Collection
              </span>
            )}
          </p>
          {totalPages > 1 && (
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
          )}
        </div>

        {/* ── Product Grid ─────────────────────────────────────────── */}
        {isLoading ? (
          <SkeletonGrid />
        ) : isError ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl">
            <p className="text-lg font-semibold text-destructive">Failed to load products</p>
            <p className="text-sm text-muted-foreground mt-1">Please try again.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border/60 rounded-3xl">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-lg font-semibold">No products found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or search term.
            </p>
            <Button variant="outline" onClick={handleReset} className="mt-4 rounded-full gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              Clear all filters
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${page}-${categoryId}-${q}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
            >
              {items.map((item, i) => (
                <ProductCard key={item.id} item={item} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Pagination ───────────────────────────────────────────── */}
        {!isLoading && !isError && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              updateURL({ page: String(p) });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}
      </div>
    </div>
  );
}
