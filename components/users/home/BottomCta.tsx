"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";

export function BottomCta() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="px-5 py-16 md:px-8 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-primary/20 bg-linear-to-br from-primary/12 via-primary/5 to-background px-8 py-16 text-center shadow-xl md:px-16"
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, color-mix(in oklab, var(--primary) 30%, transparent) 0%, transparent 65%)",
          }}
        />

        {/* Decorative rings */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full border border-primary/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full border border-primary/8"
        />

        <div className="relative z-10">
          <span className="inline-block rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary">
            Start Your Journey
          </span>

          <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-5xl">
            Your Dream Bathroom
            <br />
            <span className="text-primary">Starts Here</span>
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground md:text-base">
            Browse our full range of factory-direct bath fittings — showers, taps, and
            accessories crafted for quality and priced without the middleman markup.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 gap-2 shadow-lg shadow-primary/20 font-semibold"
            >
              <Link href="/products">
                <ShoppingBag className="h-4 w-4" />
                Browse Collection
              </Link>
            </Button>

            {!isAuthenticated && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full px-8 gap-2 font-semibold"
              >
                <Link href="/signup">
                  <UserPlus className="h-4 w-4" />
                  Create Free Account
                </Link>
              </Button>
            )}

            {isAuthenticated && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full px-8 gap-2 font-semibold"
              >
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          {/* Small trust row */}
          <p className="mt-8 text-xs text-muted-foreground">
            Free delivery · 2-year warranty · Easy returns · Factory direct pricing
          </p>
        </div>
      </motion.div>
    </section>
  );
}
