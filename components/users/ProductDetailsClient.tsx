"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { addToCartAction } from "@/lib/actions/user";
import { useAuth } from "@/components/providers/AuthProvider";
import { AuthRequiredModal } from "@/components/users/AuthRequiredModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "@/components/ui/product-image";
import { ReviewsDisplay } from "./ReviewsDisplay";
import { ReviewForm } from "./ReviewForm";
import { cn } from "@/lib/utils";

type ProductDetails = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  warranty: string | null;
  finish: string | null;
  material: string | null;
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQuantity: number;
  discount: number | null;
  tags: string[];
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
  ratings: {
    id: string;
    rating: number;
    review: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    createdAt: string;
    user: {
      id: string;
      fullName: string | null;
    };
  }[];
  reviewCount: number;
  avgRating: number;
};

type RelatedProduct = {
  id: string;
  name: string;
  retailPrice: number;
  discount: number | null;
  tags: string[];
  reviewCount: number;
  avgRating: number;
  images: {
    id: string;
    image: string;
    isPrimary: boolean;
    index: number;
  }[];
};

type ProductDetailsResponse = {
  product: ProductDetails;
  related: RelatedProduct[];
};

type DetailTab = "overview" | "specs" | "reviews";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(rating);
        return <Star key={index} className={cn("h-4 w-4", filled && "fill-current")} />;
      })}
    </div>
  );
}

async function fetchProductDetails(id: string) {
  const response = await fetch(`/api/products/${id}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to load product");
  }

  return (await response.json()) as ProductDetailsResponse;
}

async function fetchSimilarProducts(
  productId: string,
  categoryId: string,
  tags: string[]
) {
  const response = await fetch("/api/products/similar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId,
      categoryId,
      tags,
      limit: 4,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to load similar products");
  }

  return response.json();
}

export function ProductDetailsClient({ productId }: { productId: string }) {
  const { isAuthenticated, user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState<DetailTab>("overview");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const query = useQuery({
    queryKey: ["product-details", productId],
    queryFn: () => fetchProductDetails(productId),
  });

  const product = query.data?.product;

  // Fetch similar products
  const similarProductsQuery = useQuery({
    queryKey: ["similar-products", productId, product?.category.id, product?.tags],
    queryFn: () =>
      product
        ? fetchSimilarProducts(productId, product.category.id, product.tags)
        : Promise.resolve({ products: [] }),
    enabled: !!product,
  });

  // Extract related products - prioritize similar products API, fallback to API response
  const relatedProducts = useMemo(
    () => similarProductsQuery.data?.products ?? query.data?.related ?? [],
    [similarProductsQuery.data, query.data]
  );

  // Check if user has already reviewed this product
  const userHasReviewed = useMemo(() => {
    if (!isAuthenticated || !user || !product) return false;
    return product.ratings.some((rating: any) => rating.user.id === user.id);
  }, [isAuthenticated, user, product]);

  const orderedImages = useMemo(
    () =>
      product
        ? [...product.images].sort(
            (left, right) => Number(right.isPrimary) - Number(left.isPrimary) || left.index - right.index
          )
        : [],
    [product]
  );

  const activeImage = orderedImages[activeImageIndex] ?? orderedImages[0];

  const discountedPrice =
    product && product.discount
      ? product.retailPrice * (1 - product.discount / 100)
      : product?.retailPrice ?? 0;

  const decrement = () => setQuantity((current) => Math.max(1, current - 1));
  const increment = () => setQuantity((current) => current + 1);
  const updateQuantity = (value: string) => {
    const next = Number(value);
    if (!Number.isFinite(next)) {
      setQuantity(1);
      return;
    }
    setQuantity(Math.max(1, Math.floor(next)));
  };

  const moveImage = (direction: "next" | "prev") => {
    if (orderedImages.length === 0) return;
    setActiveImageIndex((current) => {
      if (direction === "next") {
        return (current + 1) % orderedImages.length;
      }
      return (current - 1 + orderedImages.length) % orderedImages.length;
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated || user?.role !== "customer") {
      setAuthModalOpen(true);
      return;
    }

    setIsAddingToCart(true);
    const result = await addToCartAction(product.id, quantity);
    setIsAddingToCart(false);

    if (result.error) {
      if (result.error === "Not authenticated.") {
        setAuthModalOpen(true);
        return;
      }
      toast.error(result.error);
      return;
    }

    toast.success("Added to cart");
    window.dispatchEvent(new Event("cart-updated"));
  };

  if (query.isLoading) {
    return (
      <section className="mx-auto flex w-full max-w-7xl items-center justify-center px-5 py-24">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading product details...
        </div>
      </section>
    );
  }

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
    <>
      <AuthRequiredModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 md:px-8 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-sm">
              {activeImage ? (
                <ProductImage
                  src={activeImage.image}
                  alt={product.name}
                  className="h-105 w-full object-cover md:h-140"
                  fallbackSize="lg"
                />
              ) : (
                <div className="flex h-105 items-center justify-center text-sm text-muted-foreground md:h-140">
                  No image available
                </div>
              )}

              {orderedImages.length > 1 ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={() => moveImage("prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={() => moveImage("next")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              ) : null}
            </div>

            {activeImage?.detail ? (
              <p className="text-sm text-muted-foreground">{activeImage.detail}</p>
            ) : null}

            <div className="grid grid-cols-4 gap-3">
              {orderedImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={cn(
                    "overflow-hidden rounded-2xl border border-border/70 bg-card/80 transition",
                    index === activeImageIndex && "ring-2 ring-primary"
                  )}
                >
                  <ProductImage
                    src={image.image}
                    alt={product.name}
                    className="h-24 w-full object-cover md:h-28"
                    fallbackSize="sm"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4 rounded-[2rem] border border-border/70 bg-card/90 p-7 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full px-3 py-1">{product.category.name}</Badge>
                {product.discount ? (
                  <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white">Save {product.discount}%</Badge>
                ) : null}
                <Badge variant="outline" className="rounded-full px-3 py-1">SKU {product.sku}</Badge>
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl md:leading-[1.05]">{product.name}</h1>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  {product.description || "Built for premium bathroom projects with crisp detailing, durable internals, and a finish that stays refined over time."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <StarRating rating={product.avgRating || 0} />
                <span className="font-medium">{product.reviewCount ? product.avgRating.toFixed(1) : "New"}</span>
                <span className="text-muted-foreground">
                  {product.reviewCount ? `${product.reviewCount} reviews` : "No reviews yet"}
                </span>
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
                <div className="flex flex-wrap items-end gap-3">
                  <span className="text-4xl font-semibold tracking-tight">{formatPrice(discountedPrice)}</span>
                  {product.discount ? (
                    <span className="pb-1 text-base text-muted-foreground line-through">
                      {formatPrice(product.retailPrice)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-emerald-700">
                  Wholesale starts at {formatPrice(product.wholesalePrice)} from {product.wholesaleMinQuantity} units.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Quantity</p>
                  <div className="inline-flex items-center rounded-full border border-border bg-background/80 p-1">
                    <Button type="button" variant="ghost" size="icon-sm" onClick={decrement}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <input
                      value={quantity}
                      onChange={(event) => updateQuantity(event.target.value)}
                      type="number"
                      min={1}
                      className="h-9 w-16 border-none bg-transparent text-center text-base font-semibold outline-none"
                    />
                    <Button type="button" variant="ghost" size="icon-sm" onClick={increment}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button size="lg" onClick={handleAddToCart} disabled={isAddingToCart}>
                    {isAddingToCart ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="mr-2 h-4 w-4" />
                    )}
                    Add to Cart
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => toast("Quote workflow will be connected next.")}>Request Quote</Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="rounded-[1.5rem] border border-border/70 bg-card/85 py-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4 text-primary" /> Dispatch ready</CardTitle>
                </CardHeader>
                <CardContent className="pb-5 text-sm text-muted-foreground">Packed for safe handling with finish protection and fitting notes.</CardContent>
              </Card>
              <Card className="rounded-[1.5rem] border border-border/70 bg-card/85 py-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-primary" /> Warranty backed</CardTitle>
                </CardHeader>
                <CardContent className="pb-5 text-sm text-muted-foreground">{product.warranty || "Manufacturer-backed warranty details will appear here once configured."}</CardContent>
              </Card>
              <Card className="rounded-[1.5rem] border border-border/70 bg-card/85 py-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Finish first</CardTitle>
                </CardHeader>
                <CardContent className="pb-5 text-sm text-muted-foreground">{product.finish || "Finish information will appear here once provided in admin."}</CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="space-y-5 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap gap-3">
            {(["overview", "specs", "reviews"] as DetailTab[]).map((tab) => (
              <Button
                key={tab}
                type="button"
                variant={selectedTab === tab ? "default" : "outline"}
                onClick={() => setSelectedTab(tab)}
                className="rounded-full px-4"
              >
                {tab === "overview" ? "Overview" : tab === "specs" ? "Specifications" : "Reviews"}
              </Button>
            ))}
          </div>

          {selectedTab === "overview" ? (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  {product.description || "This product is designed for premium residential and hospitality spaces where clean geometry, smooth operation, and a refined finish matter."}
                </p>
                <p>
                  This page supports interactive gallery navigation, quantity control, and cart actions while keeping details easy to scan.
                </p>
              </div>
              <div className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-background/70 p-5 text-sm">
                <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{product.category.name}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                  <span className="text-muted-foreground">Retail price</span>
                  <span className="font-medium">{formatPrice(product.retailPrice)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                  <span className="text-muted-foreground">Wholesale price</span>
                  <span className="font-medium">{formatPrice(product.wholesalePrice)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">{product.discount ? `${product.discount}%` : "No active offer"}</span>
                </div>
              </div>
            </div>
          ) : null}

          {selectedTab === "specs" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Finish", value: product.finish || "Not specified" },
                { label: "Material", value: product.material || "Not specified" },
                { label: "Warranty", value: product.warranty || "Not specified" },
                { label: "Wholesale MOQ", value: `${product.wholesaleMinQuantity} units` },
              ].map((spec) => (
                <div key={spec.label} className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
                  <p className="text-sm text-muted-foreground">{spec.label}</p>
                  <p className="mt-2 text-lg font-semibold tracking-tight">{spec.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {selectedTab === "reviews" ? (
            <div className="space-y-6">
              {/* Write Review Section */}
              {isAuthenticated && !userHasReviewed && (
                <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Share Your Experience</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Help other customers by writing a review about this product
                  </p>
                  <Button
                    onClick={() => setReviewFormOpen(true)}
                    className="rounded-full"
                  >
                    Write a Review
                  </Button>
                </div>
              )}

              {/* Reviews Display */}
              <ReviewsDisplay
                reviews={product.ratings}
                productId={productId}
                productName={product.name}
                currentUserId={user?.id}
                onReviewUpdate={query.refetch}
              />

              {/* Review Form */}
              <ReviewForm
                productId={productId}
                productName={product.name}
                open={reviewFormOpen}
                onOpenChange={setReviewFormOpen}
                onReviewSubmitted={query.refetch}
              />
            </div>
          ) : null}
        </div>

        {relatedProducts.length > 0 ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Related Products</h2>
              <p className="text-sm text-muted-foreground mt-1">Based on tags and category</p>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {relatedProducts.map((related: RelatedProduct) => {
                const image = related.images.find((entry) => entry.isPrimary) ?? related.images[0];
                const relatedPrice = related.discount
                  ? related.retailPrice * (1 - related.discount / 100)
                  : related.retailPrice;

                return (
                  <Link
                    key={related.id}
                    href={`/products/${related.id}`}
                    className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-card/85 transition hover:-translate-y-1 hover:shadow-md group"
                  >
                    <div className="relative h-48 bg-muted overflow-hidden">
                      {image ? (
                        <ProductImage
                          src={image.image}
                          alt={related.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          fallbackSize="md"
                        />
                      ) : null}
                      {related.discount && (
                        <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          -{related.discount}%
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 p-4">
                      <p className="font-medium line-clamp-2 group-hover:text-primary transition-colors">{related.name}</p>

                      {/* Rating */}
                      {related.reviewCount > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.round(related.avgRating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({related.reviewCount})
                          </span>
                        </div>
                      )}

                      {/* Pricing */}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{formatPrice(relatedPrice)}</p>
                        {related.discount && (
                          <p className="text-xs text-muted-foreground line-through">{formatPrice(related.retailPrice)}</p>
                        )}
                      </div>

                      {/* Tags */}
                      {related.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {related.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0.5">
                              {tag}
                            </Badge>
                          ))}
                          {related.tags.length > 2 && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                              +{related.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
