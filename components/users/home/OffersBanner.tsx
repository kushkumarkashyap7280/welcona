"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OffersBannerConfig } from "@/lib/home-config";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

interface Props {
  config: OffersBannerConfig;
}

export function OffersBanner({ config }: Props) {
  return (
    <section className="py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative overflow-hidden rounded-3xl min-h-85 flex items-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Background */}
          <div className="absolute inset-0 z-0">
            <Image
              src={config.backgroundImage}
              alt="Offers background"
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-black/30" />
          </div>

          {/* Content */}
          <motion.div
            className="relative z-10 px-8 py-12 md:px-14 max-w-2xl"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.p
              variants={itemVariants}
              className="text-xs font-semibold uppercase tracking-widest text-primary mb-3"
            >
              Limited Time · Factory Direct
            </motion.p>

            <motion.h2
              variants={itemVariants}
              className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3"
            >
              {config.title}
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="text-white/70 text-base mb-6 leading-relaxed"
            >
              {config.subtitle}
            </motion.p>

            {/* Highlight pills */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-2 mb-8">
              {config.highlights.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-medium"
                >
                  <Tag className="h-3 w-3 text-primary" />
                  {h}
                </span>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div variants={itemVariants}>
              <Button
                asChild
                size="lg"
                className="rounded-full px-8 gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg group"
              >
                <Link href={config.ctaLink}>
                  {config.ctaText}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
