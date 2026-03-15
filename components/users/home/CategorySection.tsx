"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CategoriesConfig } from "@/lib/home-config";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const imageRevealVariants: Variants = {
  hidden: (fromRight: boolean) => ({
    clipPath: fromRight ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)",
    opacity: 0,
  }),
  visible: {
    clipPath: "inset(0 0% 0 0%)",
    opacity: 1,
    transition: { duration: 0.95, ease: [0.77, 0, 0.175, 1] },
  },
};

const textVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const textItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

interface Props {
  config: CategoriesConfig;
}

export function CategorySection({ config }: Props) {
  if (!config.items.length) return null;

  return (
    <section className="py-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Curated Collections
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Shop by Category
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Explore our hand-picked categories. Every product is sourced directly from our
            factory and quality-checked before delivery.
          </p>
        </div>

        {/* Alternating sections */}
        <div className="space-y-24">
          {config.items.map((cat, i) => {
            const imageOnLeft = i % 2 === 0;

            return (
              <motion.div
                key={cat.title}
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className={cn(
                  "grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center",
                  !imageOnLeft && "lg:[&>*:first-child]:order-2"
                )}
              >
                {/* Image side */}
                <motion.div
                  custom={!imageOnLeft}
                  variants={imageRevealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  className="relative group overflow-hidden rounded-3xl aspect-4/3 shadow-2xl"
                >
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  {/* Gradient overlay */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent"
                    )}
                  />
                  {/* Floating category badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-black text-xs font-semibold border-0 shadow-sm">
                      {cat.tags[0]}
                    </Badge>
                  </div>
                </motion.div>

                {/* Content side */}
                <motion.div
                  variants={textVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  className={cn(
                    "space-y-6",
                    imageOnLeft ? "lg:pl-6" : "lg:pr-6"
                  )}
                >
                  <motion.div variants={textItemVariants}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                      Premium Collection
                    </p>
                    <h3 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                      {cat.title}
                    </h3>
                  </motion.div>

                  <motion.p
                    variants={textItemVariants}
                    className="text-muted-foreground leading-relaxed text-base"
                  >
                    {cat.description}
                  </motion.p>

                  {/* Feature tags */}
                  <motion.div variants={textItemVariants} className="flex flex-wrap gap-2">
                    {cat.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 text-sm text-foreground/80 bg-muted rounded-full px-3 py-1.5 border border-border/60"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        {tag}
                      </span>
                    ))}
                  </motion.div>

                  {/* CTA */}
                  <motion.div variants={textItemVariants}>
                    <Button
                      asChild
                      size="lg"
                      className="rounded-full px-8 gap-2 font-semibold group"
                    >
                      <Link href={cat.href}>
                        Shop {cat.title}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
