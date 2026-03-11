"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/users/SiteShell";

const highlights = [
  {
    title: "Premium Materials",
    description:
      "Engineered brass, ceramic cartridges, and precision finishes crafted for longevity.",
    icon: Sparkles,
  },
  {
    title: "Factory-Direct Reliability",
    description:
      "Quality batches, strict checks, and dependable fulfillment designed for modern projects.",
    icon: ShieldCheck,
  },
  {
    title: "Nationwide Delivery",
    description:
      "Transparent timelines with shipment updates from dispatch to doorstep.",
    icon: Truck,
  },
];

export function LuxuryHomeClient() {
  return (
    <SiteShell>
      <section className="relative overflow-hidden px-5 pb-24 pt-20 md:px-8 md:pt-24">
        <div className="mx-auto grid w-full max-w-7xl gap-10 md:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="space-y-8"
          >
            <p className="inline-flex rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-xs tracking-[0.18em] text-muted-foreground uppercase">
              Luxury Bath Fittings
            </p>

            <div className="space-y-5">
              <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-6xl">
                Crafted Elegance for
                <span className="block text-primary">Modern Bathrooms</span>
              </h1>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                Welcona blends timeless aesthetics with industrial precision to
                create fittings that elevate every bath space.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/products">
                  Explore Collection <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-6">
                <Link href="/about">Our Story</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="luxury-panel p-6 md:p-7"
          >
            <div className="luxury-surface flex h-full flex-col justify-between rounded-3xl p-6 md:p-8">
              <div>
                <p className="text-sm text-muted-foreground">Featured Line</p>
                <h2 className="mt-2 text-2xl font-semibold">Aurum Collection</h2>
                <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                  Signature faucet and shower system range designed for premium
                  residential and hospitality interiors.
                </p>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <p className="text-muted-foreground">Warranty</p>
                  <p className="mt-1 text-lg font-semibold">10 Years</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <p className="text-muted-foreground">Lead Time</p>
                  <p className="mt-1 text-lg font-semibold">72 Hours</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-4 md:grid-cols-3">
          {highlights.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 * (index + 1) }}
              className="luxury-card"
            >
              <item.icon className="mb-4 text-primary" />
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
