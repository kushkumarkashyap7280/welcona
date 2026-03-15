"use client";

import { useRef, useEffect, useState } from "react";
import { useInView, animate } from "framer-motion";
import { motion, type Variants } from "framer-motion";
import type { StatsConfig } from "@/lib/home-config";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

// ─── Animated Counter ─────────────────────────────────────────────────────────

function CounterNumber({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(0, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate(latest) {
        setDisplay(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString("en-IN")}
      <span className="text-primary">{suffix}</span>
    </span>
  );
}

// ─── Stats Section ────────────────────────────────────────────────────────────

interface Props {
  config: StatsConfig;
}

export function StatsSection({ config }: Props) {
  return (
    <section className="py-16 border-y border-border/50 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            By the Numbers
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Trusted by Thousands Across India
          </h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {config.items.map((stat) => (
            <motion.div
              key={stat.label}
              variants={cardVariants}
              className="relative text-center group"
            >
              {/* Card */}
              <div className="bg-card border border-border/70 rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300 hover:border-primary/30">
                {/* Number */}
                <div className="text-4xl sm:text-5xl font-bold tracking-tight mb-1 text-foreground">
                  <CounterNumber value={stat.value} suffix={stat.suffix} />
                </div>

                {/* Divider with glow */}
                <div className="w-8 h-0.5 bg-primary/50 mx-auto mb-2 rounded-full" />

                {/* Label */}
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
