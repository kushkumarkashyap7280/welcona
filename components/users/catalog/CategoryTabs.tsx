"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CategoryTabs() {
  const tabsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("categoryId") ?? "all";

  const { data } = useQuery({
    queryKey: ["catalog-cats"],
    queryFn: async () => {
      const res = await fetch(`/api/products?page=1&pageSize=1`);
      if (!res.ok) throw new Error("Failed to load categories");
      const json = await res.json();
      return json.categories ?? [];
    },
    staleTime: 60 * 1000,
  });

  const categories = data ?? [];

  const allCategories = [{ id: "all", name: "All Products" }, ...categories];

  const scroll = (dir: "left" | "right") => tabsRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });

  const onSelect = (id: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (id === "all") params.delete("categoryId"); else params.set("categoryId", id);
    router.push(`${location.pathname}?${params.toString()}`);
  };

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/70 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 py-3">
          <button onClick={() => scroll("left")} className="shrink-0 w-8 h-8 rounded-full border bg-background flex items-center justify-center hover:bg-muted transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <div ref={tabsRef} className="flex gap-2 overflow-x-auto scrollbar-none scroll-smooth flex-1">
            {allCategories.map((cat) => {
              const isActive = cat.id === activeId;
              return (
                <button key={cat.id} onClick={() => onSelect(cat.id)} className={cn("relative shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border", isActive ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-primary/40")}>
                  {isActive && <motion.span layoutId="cat-active-bg" className="absolute inset-0 bg-primary rounded-full z-[-1]" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />}
                  {cat.name}
                </button>
              );
            })}
          </div>
          <button onClick={() => scroll("right")} className="shrink-0 w-8 h-8 rounded-full border bg-background flex items-center justify-center hover:bg-muted transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  );
}
