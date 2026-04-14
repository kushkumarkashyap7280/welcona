"use client";

import { useMemo } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type ProductShareData = {
  id: string;
  name: string;
};

export function ProductShareButton({ product }: { product: ProductShareData }) {
  const productPath = useMemo(() => `/products/${product.id}`, [product.id]);

  const handleNativeShare = async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }

    const productUrl = new URL(productPath, window.location.origin).toString();

    if (typeof navigator.share !== "function") {
      try {
        await navigator.clipboard.writeText(productUrl);
        toast.success("Link copied");
      } catch {
        toast.error("Sharing is not supported on this device.");
      }
      return;
    }

    try {
      await navigator.share({
        title: product.name,
        url: productUrl,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(productUrl);
        toast.success("Link copied");
      } catch {
        toast.error("Could not open share dialog.");
      }
    }
  };

  return (
    <div className="space-y-2 rounded-2xl border border-border/70 bg-background/60 p-3">
      <p className="text-xs font-medium text-muted-foreground">Share this product</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="default" size="sm" className="rounded-full" onClick={handleNativeShare}>
          <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
        </Button>
      </div>
    </div>
  );
}
