import prisma from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeroConfig {
  enabled: boolean;
  headline: string;
  subtitle: string;
  backgroundImage: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
}

export interface HotTabItem {
  id: string;
  label: string;
  apiFilter: string;
}

export interface HotTabsConfig {
  enabled: boolean;
  tabs: HotTabItem[];
}

export interface CategoryItemConfig {
  title: string;
  description: string;
  image: string;
  href: string;
  tags: string[];
}

export interface CategoriesConfig {
  enabled: boolean;
  items: CategoryItemConfig[];
}

export interface StatItemConfig {
  value: number;
  suffix: string;
  label: string;
}

export interface StatsConfig {
  enabled: boolean;
  items: StatItemConfig[];
}

export interface OffersBannerConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  backgroundImage: string;
  highlights: string[];
  ctaText: string;
  ctaLink: string;
}

export interface MarqueeConfig {
  enabled: boolean;
  items: string[];
}

export interface WhyWelconaConfig {
  enabled: boolean;
}

export interface BottomCtaConfig {
  enabled: boolean;
  headline: string;
  subtitle: string;
}

export interface HomePageConfig {
  hero: HeroConfig;
  marquee: MarqueeConfig;
  hotTabs: HotTabsConfig;
  categories: CategoriesConfig;
  stats: StatsConfig;
  offersBanner: OffersBannerConfig;
  whyWelcona: WhyWelconaConfig;
  bottomCta: BottomCtaConfig;
}

// ─── Unsplash Image Constants ─────────────────────────────────────────────────

export const UNSPLASH_IMAGES = {
  hero: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1920&q=80",
  showers:
    "https://images.unsplash.com/photo-1620626011761-996317702519?auto=format&fit=crop&w=800&q=80",
  taps: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
  offers:
    "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1920&q=80",
  bathroom2:
    "https://images.unsplash.com/photo-1552242718-c5360894aecd?auto=format&fit=crop&w=1200&q=80",
};

// ─── Default Config ───────────────────────────────────────────────────────────

export const DEFAULT_HOME_CONFIG: HomePageConfig = {
  hero: {
    enabled: true,
    headline: "Elevate Your\nBathroom Experience",
    subtitle:
      "Factory-direct luxury bath fittings crafted for perfection. Premium quality, unbeatable prices, delivered across India.",
    backgroundImage: UNSPLASH_IMAGES.hero,
    primaryCtaText: "Shop Collection",
    primaryCtaLink: "/products",
    secondaryCtaText: "View Offers",
    secondaryCtaLink: "/products?sort=discount",
  },
  marquee: {
    enabled: true,
    items: [
      "Factory Direct",
      "2-Year Warranty",
      "Pan India Delivery",
      "4.8/5 Rating",
      "Premium Quality",
      "24/7 Support",
      "Easy Returns",
      "Fast Dispatch",
    ],
  },
  hotTabs: {
    enabled: true,
    tabs: [
      { id: "all", label: "All Products", apiFilter: "" },
      { id: "deals", label: "Hot Deals", apiFilter: "sort=discount" },
      { id: "new", label: "New Arrivals", apiFilter: "sort=newest" },
      { id: "showers", label: "Showers", apiFilter: "q=shower" },
      { id: "taps", label: "Taps", apiFilter: "q=tap" },
      { id: "bulk", label: "Bulk Orders", apiFilter: "sort=wholesale" },
    ],
  },
  categories: {
    enabled: true,
    items: [
      {
        title: "Premium Showers",
        description:
          "Transform your daily shower into a spa-like ritual. Our premium shower systems deliver the perfect balance of pressure, temperature, and style.",
        image: UNSPLASH_IMAGES.showers,
        href: "/products?q=shower",
        tags: ["Rainfall", "Thermostatic", "Smart Control", "LED"],
      },
      {
        title: "Luxury Taps & Faucets",
        description:
          "Precision-engineered taps that combine timeless design with cutting-edge technology. Built to last decades, not years.",
        image: UNSPLASH_IMAGES.taps,
        href: "/products?q=tap",
        tags: ["Chrome Finish", "Anti-scale", "Single Lever", "Eco Flow"],
      },
    ],
  },
  stats: {
    enabled: true,
    items: [
      { value: 500, suffix: "+", label: "Products" },
      { value: 10, suffix: "+", label: "Categories" },
      { value: 5000, suffix: "+", label: "Happy Customers" },
      { value: 2, suffix: " Yr", label: "Warranty" },
    ],
  },
  offersBanner: {
    enabled: true,
    title: "Factory Direct Savings",
    subtitle:
      "Cut out the middleman. Get luxury bath fittings straight from our factory floor at prices that make sense.",
    backgroundImage: UNSPLASH_IMAGES.offers,
    highlights: [
      "Up to 40% Off Taps",
      "Up to 30% Off Showers",
      "Bulk Wholesale Deals",
    ],
    ctaText: "Shop All Deals",
    ctaLink: "/products?sort=discount",
  },
  whyWelcona: {
    enabled: true,
  },
  bottomCta: {
    enabled: true,
    headline: "Ready to Transform Your Bathroom?",
    subtitle:
      "Join thousands of happy customers who chose Welcona for their luxury bath upgrades.",
  },
};

// ─── Deep Merge Helper ────────────────────────────────────────────────────────

function deepMerge<T extends object>(base: T, override: Partial<T>): T {
  const result = { ...base };
  for (const key in override) {
    const overrideVal = override[key];
    const baseVal = base[key];
    if (
      overrideVal !== null &&
      typeof overrideVal === "object" &&
      !Array.isArray(overrideVal) &&
      baseVal !== null &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(baseVal as object, overrideVal as object) as T[typeof key];
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal as T[typeof key];
    }
  }
  return result;
}

// ─── Fetch Config from DB ─────────────────────────────────────────────────────

export async function getHomeConfig(): Promise<HomePageConfig> {
  try {
    const record = await prisma.siteConfig.findUnique({
      where: { key: "home_page" },
    });
    if (!record) return DEFAULT_HOME_CONFIG;
    return deepMerge(DEFAULT_HOME_CONFIG, record.value as Partial<HomePageConfig>);
  } catch {
    return DEFAULT_HOME_CONFIG;
  }
}
