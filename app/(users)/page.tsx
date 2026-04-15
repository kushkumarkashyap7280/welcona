import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { HeroSection } from "@/components/users/home/HeroSection";
import { MarqueeStrip } from "@/components/users/home/MarqueeStrip";
import { HotTabs } from "@/components/users/home/HotTabs";
import { CategorySection } from "@/components/users/home/CategorySection";
import { StatsSection } from "@/components/users/home/StatsSection";
import { WhyWelcona } from "@/components/users/home/WhyWelcona";
import { BottomCta } from "@/components/users/home/BottomCta";
import { OffersBanner } from "@/components/users/home/OffersBanner";

export const metadata = {
  title: "Welcona — Luxury Bath Fittings, Factory Direct",
  description:
    "Discover Welcona's curated collection of premium showers, taps, and bath accessories. Factory-direct pricing, 2-year warranty, pan India delivery.",
};

const HOT_TABS = [
  { id: "all", label: "All Products", apiFilter: "" },
  { id: "deals", label: "Hot Deals", apiFilter: "sort=discount" },
  { id: "new", label: "New Arrivals", apiFilter: "sort=newest" },
  { id: "showers", label: "Showers", apiFilter: "q=shower" },
  { id: "taps", label: "Taps", apiFilter: "q=tap" },
  { id: "bulk", label: "Bulk Orders", apiFilter: "sort=wholesale" },
];

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

const CATEGORY_CONFIG = {
  enabled: true,
  items: [
    {
      title: "Premium Showers",
      description:
        "Transform your daily shower into a spa-like ritual. Our premium shower systems deliver the perfect balance of pressure, temperature, and style.",
      image:
        "https://images.unsplash.com/photo-1620626011761-996317702519?auto=format&fit=crop&w=800&q=80",
      href: "/products?q=shower",
      tags: ["Rainfall", "Thermostatic", "Smart Control", "LED"],
    },
    {
      title: "Luxury Taps & Faucets",
      description:
        "Precision-engineered taps that combine timeless design with cutting-edge technology. Built to last decades, not years.",
      image:
        "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
      href: "/products?q=tap",
      tags: ["Chrome Finish", "Anti-scale", "Single Lever", "Eco Flow"],
    },
  ],
};

const STATS_CONFIG = {
  enabled: true,
  items: [
    { value: 500, suffix: "+", label: "Products" },
    { value: 10, suffix: "+", label: "Categories" },
    { value: 5000, suffix: "+", label: "Happy Customers" },
    { value: 2, suffix: " Yr", label: "Warranty" },
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

  return (
    <main>
      <HeroSection config={HERO_CONFIG} />

      {/* 2 — Animated trust marquee strip */}
      <MarqueeStrip />

      {/* 3 — Hot tabs product browser */}
      <HotTabs tabs={HOT_TABS} />

      {/* 4 — Category showcase (alternating left/right with images) */}
      <CategorySection config={CATEGORY_CONFIG} />

      {/* 5 — Animated stats counters */}
      <StatsSection config={STATS_CONFIG} />

      {/* 6 — Offers banner with image background */}
      <OffersBanner config={OFFERS_BANNER_CONFIG} />

      {/* 7 — Why Welcona trust features */}
      <WhyWelcona />

      {/* 8 — Bottom CTA */}
      <BottomCta />
    </main>
  );
}
