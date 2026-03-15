import {
  ShieldCheck,
  Factory,
  Truck,
  Star,
  Headphones,
  RefreshCcw,
  Award,
  Zap,
} from "lucide-react";

const TRUST_ITEMS = [
  { icon: Factory, text: "Factory Direct Sourcing" },
  { icon: ShieldCheck, text: "2-Year Warranty" },
  { icon: Truck, text: "Pan India Delivery" },
  { icon: Star, text: "4.8 / 5 Avg Rating" },
  { icon: Award, text: "Premium Quality" },
  { icon: Headphones, text: "24 / 7 Support" },
  { icon: RefreshCcw, text: "Easy Returns" },
  { icon: Zap, text: "Fast Dispatch" },
];

// Duplicate for seamless loop
const ITEMS = [...TRUST_ITEMS, ...TRUST_ITEMS];

export function MarqueeStrip() {
  return (
    <div className="relative overflow-hidden border-y border-border/60 bg-muted/40 py-3.5">
      {/* Fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-linear-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-linear-to-l from-background to-transparent" />

      <div className="flex animate-marquee whitespace-nowrap will-change-transform">
        {ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <span
              key={i}
              className="inline-flex items-center gap-2.5 px-8 text-sm font-medium text-muted-foreground"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" />
              {item.text}
              <span className="mx-2 text-border/80">·</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
