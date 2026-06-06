import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { HeroSection } from "@/components/users/home/HeroSection";
import { MarqueeStrip } from "@/components/users/home/MarqueeStrip";
import { HotTabs } from "@/components/users/home/HotTabs";
import { CategorySection } from "@/components/users/home/CategorySection";
import { StatsSection } from "@/components/users/home/StatsSection";
import prisma from "@/lib/db";



const HERO_CONFIG = {
  enabled: true,
  headline: "Elevate Your\nBathroom Experience",
  subtitle:
    "Factory-direct luxury bath fittings crafted for perfection. Premium quality, unbeatable prices, delivered across India.",
  backgroundImage:
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1920&q=80",
  primaryCtaText: "Shop Collection",
  primaryCtaLink: "/products",
  secondaryCtaText: "View Offers",
  secondaryCtaLink: "/products?sort=discount",
};

const STATS_CONFIG = {
  enabled: true,
  items: [
    { value: 500, suffix: "+", label: "Products" },
    { value: 10, suffix: "+", label: "Categories" },
    { value: 5000, suffix: "+", label: "Happy Customers" },
    { value: 10, suffix: " Yr", label: "Warranty" },
  ],
};

const OFFERS_BANNER_CONFIG = {
  enabled: true,
  title: "Factory Direct Savings",
  subtitle:
    "Cut out the middleman. Get luxury bath fittings straight from our factory floor at prices that make sense.",
  backgroundImage:
    "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1920&q=80",
  highlights: ["Up to 40% Off Taps", "Up to 30% Off Showers", "Bulk Wholesale Deals"],
  ctaText: "Shop All Deals",
  ctaLink: "/products?sort=discount",
};

export default async function HomePage() {
  const session = await getSessionUser();

  if (session?.role === "admin") {
    redirect("/admin");
  }

  // ─── Fetch Categories Dynamically from Prisma ─────────────────────────────
  const dbCategories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  // ─── Dynamic Hot Tabs Generation (No Hardcoded Categories) ──────────────────
  const dynamicHotTabs = [
    { id: "all", label: "All Products", apiFilter: "" },
    { id: "deals", label: "Best Deals", apiFilter: "sort=discount" },
    { id: "bulk", label: "Bulk Orders", apiFilter: "wholesale=true" },
    ...dbCategories.map((cat) => ({
      id: cat.name.toLowerCase().replace(/\s+/g, "-"),
      label: cat.name,
      apiFilter: `categoryId=${cat.id}`,
    })),
  ];

  // ─── Dynamic Category Section Config ──────────────────────────────────────
  const categoryImages: Record<string, string> = {
    "Basin Mixers": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    "Showers": "https://images.unsplash.com/photo-1620626011761-996317702519?auto=format&fit=crop&w=800&q=80",
    "Kitchen Taps": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    "Bath Accessories": "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=800&q=80",
  };

  const categoryTags: Record<string, string[]> = {
    "Basin Mixers": ["Brushed Gold", "Chrome Finishes", "Solid Brass", "Ceramic Cartridge"],
    "Showers": ["Rainfall Spray", "Multi-Flow", "Thermostatic Controls", "Anti-Clog"],
    "Kitchen Taps": ["Pull-Out Spray", "High Arch Spout", "Dual Function", "Swivel 360°"],
    "Bath Accessories": ["Designer Robe Hooks", "Solid Towel Rails", "Premium Soap Holders", "Rust Proof"],
  };

  const dynamicCategoryItems = dbCategories.map((cat) => ({
    title: cat.name,
    description: cat.description || "Premium bathroom fittings and accessories designed with pure elegance and engineering excellence.",
    image: cat.image || categoryImages[cat.name] || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    href: `/products?categoryId=${cat.id}`,
    tags: categoryTags[cat.name] || ["Premium Finish", "Solid Build", "Modern Style", "7 Year Warranty"],
  }));

  const dynamicCategoryConfig = {
    enabled: true,
    items: dynamicCategoryItems,
  };

  return (
    <main>
      <HeroSection  />

      {/* 2 — Animated trust marquee strip */}
      <MarqueeStrip />

      {/* 3 — Hot tabs product browser */}
      <HotTabs tabs={dynamicHotTabs} />

      {/* 4 — Category showcase (alternating left/right with images) */}
      <CategorySection />

      {/* 5 — Animated stats counters */}
      <StatsSection config={STATS_CONFIG} />
    </main>
  );
}
