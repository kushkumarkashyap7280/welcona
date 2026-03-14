"use client";

import { Suspense } from "react";
import { Package } from "lucide-react";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSize?: "sm" | "md" | "lg";
}

function ProductImageFallback({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div className="flex items-center justify-center bg-muted animate-pulse">
      <Package className={`${sizeClasses[size]} text-muted-foreground opacity-40`} />
    </div>
  );
}

function ProductImageInner({ src, alt, className = "" }: Omit<ProductImageProps, 'fallbackSize'>) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        // Replace with fallback if image fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent && !parent.querySelector('.image-error-fallback')) {
          const fallback = document.createElement('div');
          fallback.className = 'image-error-fallback flex items-center justify-center bg-muted w-full h-full';
          fallback.innerHTML = `
            <svg class="h-6 w-6 text-muted-foreground opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          `;
          parent.appendChild(fallback);
        }
      }}
    />
  );
}

export function ProductImage({ src, alt, className = "", fallbackSize = "md" }: ProductImageProps) {
  return (
    <Suspense fallback={<ProductImageFallback size={fallbackSize} />}>
      <ProductImageInner src={src} alt={alt} className={className} />
    </Suspense>
  );
}