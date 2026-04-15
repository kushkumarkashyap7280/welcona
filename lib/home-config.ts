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
