import { Suspense } from "react";
import { ProductCatalogClient } from "@/components/users/ProductCatalogClient";

export const metadata = {
  title: "Products — Welcona Bath Fittings",
  description: "Browse Welcona's full collection of luxury bath fittings. Filter by category, price, tags and more.",
};

function CatalogSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="h-80 bg-muted animate-pulse" />
      {/* Grid skeleton */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <ProductCatalogClient />
    </Suspense>
  );
}
