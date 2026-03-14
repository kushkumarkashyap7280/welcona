"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Search, SlidersHorizontal, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductImage } from "@/components/ui/product-image";

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
  quantity: number;
  category: {
    id: string;
    name: string;
  };
  images: {
    id: string;
    image: string;
    detail: string | null;
    isPrimary: boolean;
    index: number;
  }[];
  reviewCount: number;
  avgRating: number;
};

type CatalogResponse = {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  categories: {
    id: string;
    name: string;
  }[];
  items: CatalogItem[];
};

type SortMode = "newest" | "priceAsc" | "priceDesc" | "discount";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

async function fetchCatalog({
  pageParam,
  categoryId,
  search,
  sort,
}: {
  pageParam: number;
  categoryId: string;
  search: string;
  sort: SortMode;
}) {
  const searchParams = new URLSearchParams({
    page: String(pageParam),
    pageSize: "9",
    sort,
  });

  if (categoryId !== "all") {
    searchParams.set("categoryId", categoryId);
  }
  if (search.trim()) {
    searchParams.set("q", search.trim());
  }

  const response = await fetch(`/api/products?${searchParams.toString()}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return (await response.json()) as CatalogResponse;
}

export function ProductCatalogClient() {
  const [categoryId, setCategoryId] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const query = useInfiniteQuery({
    queryKey: ["catalog-products", categoryId, searchTerm, sortMode],
    queryFn: ({ pageParam }) =>
      fetchCatalog({
        pageParam,
        categoryId,
        search: searchTerm,
        sort: sortMode,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  const firstPage = query.data?.pages[0];
  const categories = firstPage?.categories ?? [];
  const total = firstPage?.total ?? 0;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchTerm(searchInput);
  };

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-12 md:px-8 md:py-16">
      <div className="overflow-hidden rounded-[2.25rem] border border-border/70 bg-card/90 p-7 shadow-sm md:p-10">
        <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-primary">Welcona Marketplace</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl md:leading-[1.03]">
              Discover fittings that look premium in real projects.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              Filter by category, sort by price or offers, and load more products on demand. Built for a shopping flow similar to major commerce platforms.
            </p>
          </div>
          <div className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
            <p className="text-sm text-muted-foreground">Products discovered</p>
            <p className="text-4xl font-semibold tracking-tight">{total}</p>
            <p className="text-sm text-muted-foreground">Matching your current filter state</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.75rem] border border-border/70 bg-card/85 p-4 md:grid-cols-[1fr_auto_auto] md:items-center md:p-5">
        <form onSubmit={handleSearch} className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by product, SKU, or keyword"
            className="border-none bg-transparent px-0 focus-visible:ring-0"
          />
          <Button type="submit" size="sm">Search</Button>
        </form>

        <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
          <SelectTrigger className="h-10 min-w-48 rounded-xl bg-background/80">
            <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Sort products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="priceAsc">Price low to high</SelectItem>
            <SelectItem value="priceDesc">Price high to low</SelectItem>
            <SelectItem value="discount">Best discount</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            setCategoryId("all");
            setSearchInput("");
            setSearchTerm("");
            setSortMode("newest");
          }}
        >
          Reset
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={categoryId === "all" ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setCategoryId("all")}
        >
          All Categories
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={categoryId === category.id ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setCategoryId(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-105 animate-pulse rounded-[1.5rem] border border-border/70 bg-muted/30"
            />
          ))}
        </div>
      ) : query.isError ? (
        <div className="rounded-[1.75rem] border border-destructive/30 bg-destructive/10 px-6 py-16 text-center">
          <p className="text-xl font-semibold text-destructive">Unable to load products right now.</p>
          <p className="mt-2 text-sm text-destructive/80">Please retry in a moment.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-border/70 bg-card/70 px-6 py-16 text-center">
          <p className="text-xl font-semibold">No products found</p>
          <p className="mt-2 text-sm text-muted-foreground">Try another category or search keyword.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((product) => {
              const primaryImage =
                product.images.find((image) => image.isPrimary) ?? product.images[0];
              const discountedPrice = product.discount
                ? product.retailPrice * (1 - product.discount / 100)
                : product.retailPrice;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-72 overflow-hidden bg-muted">
                    {primaryImage ? (
                      <ProductImage
                        src={primaryImage.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        fallbackSize="lg"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
                    )}
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                      <Badge className="bg-background/90 text-foreground shadow-none">{product.category.name}</Badge>
                      {product.discount ? (
                        <Badge className="bg-emerald-600 text-white shadow-none">-{product.discount}%</Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight">{product.name}</h2>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {product.description || "Premium bath fitting crafted for long-term performance and elegant interiors."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-medium text-foreground">
                          {product.reviewCount ? product.avgRating.toFixed(1) : "New"}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {product.reviewCount ? `(${product.reviewCount})` : "No reviews"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {product.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-end justify-between border-t border-border/60 pt-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-semibold">{formatPrice(discountedPrice)}</span>
                          {product.discount ? (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(product.retailPrice)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-primary">View</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="flex justify-center pt-2">
            <Button
              size="lg"
              variant="outline"
              disabled={!query.hasNextPage || query.isFetchingNextPage}
              onClick={() => query.fetchNextPage()}
              className="rounded-full px-8"
            >
              {query.isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading more
                </>
              ) : query.hasNextPage ? (
                "Load More Products"
              ) : (
                "You have reached the end"
              )}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
