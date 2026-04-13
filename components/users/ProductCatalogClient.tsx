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

// ─── Types ────────────────────────────────────────────────────────────────────

type CatalogItem = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  tags: string[];
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQuantity: number;
  discount: number | null;
  inStock: boolean;
  category: { id: string; name: string };
  images: { id: string; image: string; detail: string | null; isPrimary: boolean; index: number }[];
  reviewCount: number;
  avgRating: number;
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
    url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1920&q=80",
    title: "Luxury Bath Fittings",
    subtitle: "Crafted for lasting elegance, delivered direct from factory",
  },
  {
    url: "https://images.unsplash.com/photo-1620626011761-996317702519?auto=format&fit=crop&w=1920&q=80",
    title: "Premium Showers",
    subtitle: "Transform your daily ritual with rainfall perfection",
  },
  {
    url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=1920&q=80",
    title: "Precision Taps",
    subtitle: "ISI-certified brass fittings with anti-scale technology",
  },
  {
    url: "https://images.unsplash.com/photo-1552242718-c5360894aecd?auto=format&fit=crop&w=1920&q=80",
    title: "Modern Vanities",
    subtitle: "Contemporary aesthetics designed for Indian interiors",
  },
  {
    url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1920&q=80",
    title: "Complete Your Space",
    subtitle: "Pan India delivery · 2-year warranty · Factory direct pricing",
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

function HeroSlider({ total }: { total: number }) {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  const prefersReduced = useReducedMotion();

  const go = useCallback(
    (next: number) => {
      const wrapped = (next + HERO_IMAGES.length) % HERO_IMAGES.length;
      setDir(next > current ? 1 : -1);
      setCurrent(wrapped);
    },
    [current]
  );

  // Auto-advance
  useEffect(() => {
    if (prefersReduced) return;
    const id = setInterval(() => go(current + 1), 5000);
    return () => clearInterval(id);
  }, [current, go, prefersReduced]);

  const slide = HERO_IMAGES[current];
  const slideImageSrc = normalizeImageSrc(slide.url);

  return (
    <div className="relative h-72 sm:h-80 md:h-96 overflow-hidden bg-muted select-none">
      <AnimatePresence initial={false} custom={dir} mode="sync">
        <motion.div
          key={current}
          custom={dir}
          variants={prefersReduced ? {} : slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <Image
            src={slideImageSrc}
            alt={slide.title}
            fill
            unoptimized={isGoogleHostedImageSrc(slideImageSrc)}
            className="object-cover"
            priority={current === 0}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/30 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Text overlay */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`text-${current}`}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 md:px-16 z-10 pointer-events-none"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            {current + 1} / {HERO_IMAGES.length} · Welcona Collection
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight max-w-xl">
            {slide.title}
          </h1>
          <p className="mt-2 text-white/75 text-sm sm:text-base max-w-md">{slide.subtitle}</p>
          {total > 0 && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-white/60">
              <Package className="h-3.5 w-3.5" />
              {total.toLocaleString()} products available
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next arrows */}
      <button
        onClick={() => go(current - 1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => go(current + 1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
        aria-label="Next image"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === current ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Category Tabs ─────────────────────────────────────────────────────────────

function CategoryTabs({
  categories,
  activeId,
  onSelect,
}: {
  categories: { id: string; name: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const allCategories = [{ id: "all", name: "All Products" }, ...categories];

  const scroll = (dir: "left" | "right") => {
    tabsRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/70 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 py-3">
          <button
            onClick={() => scroll("left")}
            className="shrink-0 w-8 h-8 rounded-full border bg-background flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <div
            ref={tabsRef}
            className="flex gap-2 overflow-x-auto scrollbar-none scroll-smooth flex-1"
          >
            {allCategories.map((cat) => {
              const isActive = cat.id === activeId;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelect(cat.id)}
                  className={cn(
                    "relative shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="cat-active-bg"
                      className="absolute inset-0 bg-primary rounded-full z-[-1]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  {cat.name}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scroll("right")}
            className="shrink-0 w-8 h-8 rounded-full border bg-background flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

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

          {/* Rating */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground">
              {item.reviewCount > 0 ? item.avgRating.toFixed(1) : "New"}
            </span>
            {item.reviewCount > 0 && <span>({item.reviewCount})</span>}
          </div>

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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
  const sort = (searchParams.get("sort") as SortMode) ?? "newest";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const tag = searchParams.get("tag") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";

  // ── Local input state (debounced for search, price) ─────────────────────
  const [searchInput, setSearchInput] = useState(q);
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 450);
  const debouncedMinPrice = useDebounce(minPriceInput, 600);
  const debouncedMaxPrice = useDebounce(maxPriceInput, 600);

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

  // ── Sync debounced values to URL ────────────────────────────────────────
  useEffect(() => {
    if (debouncedSearch !== q) {
      updateURL({ q: debouncedSearch || null });
    }
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (debouncedMinPrice !== minPrice) {
      updateURL({ minPrice: debouncedMinPrice || null });
    }
  }, [debouncedMinPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (debouncedMaxPrice !== maxPrice) {
      updateURL({ maxPrice: debouncedMaxPrice || null });
    }
  }, [debouncedMaxPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Query ────────────────────────────────────────────────────────────────
  const apiParams = new URLSearchParams({ page: String(page), pageSize: "12", sort });
  if (categoryId !== "all") apiParams.set("categoryId", categoryId);
  if (q) apiParams.set("q", q);
  if (tag) apiParams.set("tag", tag);
  if (minPrice) apiParams.set("minPrice", minPrice);
  if (maxPrice) apiParams.set("maxPrice", maxPrice);

  const { data, isLoading, isError, isFetching } = useQuery<CatalogResponse>({
    queryKey: ["catalog", page, sort, categoryId, q, tag, minPrice, maxPrice],
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
  const allTags = data?.allTags ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // ── Active filter count ──────────────────────────────────────────────────
  const activeFilterCount = [
    categoryId !== "all" ? 1 : 0,
    q ? 1 : 0,
    tag ? 1 : 0,
    minPrice || maxPrice ? 1 : 0,
    sort !== "newest" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleReset = () => {
    setSearchInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  return (
    <div className="min-h-screen pb-16">
      {/* ── Hero Slider ─────────────────────────────────────────────── */}
      <HeroSlider total={total} />

      {/* ── Category Tabs ───────────────────────────────────────────── */}
      {categories.length > 0 && (
        <CategoryTabs
          categories={categories}
          activeId={categoryId}
          onSelect={(id) => updateURL({ categoryId: id === "all" ? null : id })}
        />
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ── Filters Bar ─────────────────────────────────────────── */}
        <div className="mb-6 space-y-3">
          {/* Top bar: search + sort + filters toggle */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products, SKU, keyword…"
                className="pl-9 h-10 rounded-full bg-background border-border/70"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort */}
            <Select value={sort} onValueChange={(v) => updateURL({ sort: v })}>
              <SelectTrigger className="h-10 w-44 rounded-full bg-background border-border/70">
                <SlidersHorizontal className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="priceAsc">Price: Low to High</SelectItem>
                <SelectItem value="priceDesc">Price: High to Low</SelectItem>
                <SelectItem value="discount">Best Discount</SelectItem>
              </SelectContent>
            </Select>

            {/* Filters toggle */}
            <Button
              variant="outline"
              onClick={() => setFiltersOpen((v) => !v)}
              className="h-10 rounded-full gap-2 border-border/70"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="h-4 w-4 p-0 flex items-center justify-center text-xs rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
              {filtersOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>

            {/* Reset */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-10 rounded-full gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>

          {/* Expandable filter panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="border border-border/70 rounded-2xl bg-card/80 p-5 space-y-5">
                  {/* Price Range */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Price Range (₹)
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={minPriceInput}
                          onChange={(e) => setMinPriceInput(e.target.value)}
                          placeholder="Min"
                          className="pl-7 h-9 text-sm rounded-xl"
                          min={0}
                        />
                      </div>
                      <span className="text-muted-foreground text-sm">–</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={maxPriceInput}
                          onChange={(e) => setMaxPriceInput(e.target.value)}
                          placeholder="Max"
                          className="pl-7 h-9 text-sm rounded-xl"
                          min={0}
                        />
                      </div>
                    </div>
                    {(minPriceInput || maxPriceInput) && (
                      <button
                        onClick={() => { setMinPriceInput(""); setMaxPriceInput(""); }}
                        className="mt-1.5 text-xs text-primary hover:underline"
                      >
                        Clear price filter
                      </button>
                    )}
                  </div>

                  {/* Tags */}
                  {allTags.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Tag className="h-3 w-3" />
                        Filter by Tag
                        {tag && (
                          <button
                            onClick={() => updateURL({ tag: null })}
                            className="text-primary hover:underline normal-case tracking-normal font-normal ml-auto"
                          >
                            Clear
                          </button>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {allTags.map((t) => (
                          <button
                            key={t}
                            onClick={() => updateURL({ tag: t === tag ? null : t })}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                              t === tag
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border/60 hover:border-primary/50 hover:text-foreground"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
              <>
                <span className="font-semibold text-foreground">{total.toLocaleString()}</span>{" "}
                {total === 1 ? "product" : "products"}{" "}
                {activeFilterCount > 0 ? "found" : "available"}
              </>
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
              key={`${page}-${sort}-${categoryId}-${q}-${tag}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
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
