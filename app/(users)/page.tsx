import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getHomeConfig } from "@/lib/home-config";
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

export default async function HomePage() {
  const session = await getSessionUser();

  if (session?.role === "admin") {
    redirect("/admin");
  }

  const config = await getHomeConfig();

  return (
    <main>
      {/* 1 — Hero with background image */}
      {config.hero.enabled && <HeroSection config={config.hero} />}

      {/* 2 — Animated trust marquee strip */}
      {config.marquee.enabled && <MarqueeStrip />}

      {/* 3 — Hot tabs product browser */}
      {config.hotTabs.enabled && <HotTabs tabs={config.hotTabs.tabs} />}

      {/* 4 — Category showcase (alternating left/right with images) */}
      {config.categories.enabled && <CategorySection config={config.categories} />}

      {/* 5 — Animated stats counters */}
      {config.stats.enabled && <StatsSection config={config.stats} />}

      {/* 6 — Offers banner with image background */}
      {config.offersBanner.enabled && <OffersBanner config={config.offersBanner} />}

      {/* 7 — Why Welcona trust features */}
      {config.whyWelcona.enabled && <WhyWelcona />}

      {/* 8 — Bottom CTA */}
      {config.bottomCta.enabled && <BottomCta />}
    </main>
  );
}
