"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Plus, Edit, Trash, Package, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteProductAction } from "@/lib/actions/products";
import { ProductImage } from "@/components/ui/product-image";

type ProductWithCategory = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  quantity: number;
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQuantity: number;
  discount: number | null;
  description: string | null;
  warranty: string | null;
  finish: string | null;
  material: string | null;
  tags: string[];
  category: { id: string; name: string };
  images: {
    id: string;
    image: string;
    detail: string | null;
    isPrimary: boolean;
    index: number;
  }[];
  reviewCount: number;
  avgRating: number;
  createdAt: string;
  updatedAt: string;
};

interface ProductClientProps {
  categories: { id: string; name: string }[];
}

interface AdminProductsResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  items: ProductWithCategory[];
  categories: { id: string; name: string }[];
}

// Hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function ProductClient({ categories }: ProductClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("newest");

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const hasCategories = categories.length > 0;

  // Fetch products using TanStack Query
  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useQuery<AdminProductsResponse>({
    queryKey: ["admin-products", currentPage, debouncedSearchQuery, categoryFilter, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "20",
        ...(debouncedSearchQuery && { q: debouncedSearchQuery }),
        ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
        sort: sortBy,
      });

      const response = await fetch(`/api/admin/products?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    retry: 3,
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    const res = await deleteProductAction(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Product deleted");
      // Refetch the current data
      refetch();
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const products = productsData?.items || [];
  const totalPages = productsData?.totalPages || 0;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium text-destructive mb-2">Error Loading Products</h3>
          <p className="text-muted-foreground mb-4">Failed to load products. Please try again.</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground mt-2">
            Manage your inventory, pricing, and product details.
            {productsData && (
              <span className="block mt-1 text-sm">
                Showing {products.length} of {productsData.total} products
              </span>
            )}
          </p>
        </div>
        <Button
          disabled={!hasCategories}
          asChild
        >
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      {!hasCategories && (
        <Card className="mt-6 border-amber-200 bg-amber-50/80">
          <CardContent className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-950">Add at least one category first.</p>
              <p className="text-sm text-amber-900/80">
                Products need a category before they can be created.
              </p>
            </div>
            <Button asChild variant="outline" className="border-amber-300 bg-white text-amber-950 hover:bg-amber-100">
              <Link href="/admin/categories">Go to Categories</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader className="py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              All Products
            </CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="sku">SKU</SelectItem>
                  <SelectItem value="priceAsc">Price: Low to High</SelectItem>
                  <SelectItem value="priceDesc">Price: High to Low</SelectItem>
                  <SelectItem value="stock">Stock Quantity</SelectItem>
                  <SelectItem value="discount">Best Discount</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, or tags..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading products...</span>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-20">Image</TableHead>
                    <TableHead>Product Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-center">Reviews</TableHead>
                    <TableHead className="text-right py-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {searchQuery || categoryFilter !== "all"
                          ? "No products found matching your filters."
                          : "No products found."
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => {
                      const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0];

                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted">
                              {primaryImage ? (
                                <ProductImage
                                  src={primaryImage.image}
                                  alt={product.name}
                                  className="object-cover w-full h-full"
                                  fallbackSize="sm"
                                />
                              ) : (
                                <Package className="h-6 w-6 absolute inset-0 m-auto text-muted-foreground opacity-20" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-base">{product.name}</div>
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">SKU: {product.sku}</div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {product.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-[11px]">
                                  {tag}
                                </Badge>
                              ))}
                              {product.tags.length > 3 && (
                                <Badge variant="outline" className="text-[11px]">
                                  +{product.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{product.category.name}</TableCell>
                          <TableCell className="text-right font-medium">
                            <div>${product.retailPrice.toFixed(2)}</div>
                            {product.discount ? (
                              <div className="text-xs text-emerald-600">-{product.discount}% off</div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={
                              product.quantity === 0
                                ? "text-destructive font-medium"
                                : product.quantity < 10
                                ? "text-amber-600 font-medium"
                                : ""
                            }>
                              {product.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="text-sm">
                              {product.reviewCount > 0 ? (
                                <>
                                  <div className="font-medium">{product.avgRating.toFixed(1)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    ({product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''})
                                  </div>
                                </>
                              ) : (
                                <span className="text-muted-foreground text-xs">No reviews</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                            >
                              <Link href={`/admin/products/${product.id}/edit`}>
                                <Edit className="h-4 w-4 text-blue-500" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(product.id, product.name)}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {/* Enhanced Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-4 px-6 py-4 border-t sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({productsData?.total} total products)
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(totalPages, currentPage + 2);
                        const pages = [];

                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={i === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(i)}
                              className="min-w-8 h-8"
                            >
                              {i}
                            </Button>
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
