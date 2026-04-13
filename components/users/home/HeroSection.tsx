"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Truck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HeroConfig } from "@/lib/home-config";
import { isGoogleHostedImageSrc, normalizeImageSrc } from "@/lib/utils";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const imageVariants: Variants = {
  hidden: { scale: 1.06, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 1.2, ease: "easeOut" } },
};

interface Props {
  config: HeroConfig;
}

export function HeroSection({ config }: Props) {
  const headlineLines = config.headline.split("\\n");
  const imageSrc = normalizeImageSrc(config.backgroundImage);

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <motion.div
        className="absolute inset-0 z-0"
        variants={imageVariants}
        initial="hidden"
        animate="visible"
      >
        <Image
          src={imageSrc}
          alt="Luxury bathroom"
          fill
          priority
          unoptimized={isGoogleHostedImageSrc(imageSrc)}
          className="object-cover"
          sizes="100vw"
        />
        {/* Layered overlays for depth */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
      </motion.div>

      {/* Shimmer ring decoration */}
      <div
        className="absolute right-[5%] top-1/3 w-80 h-80 rounded-full border border-white/10 animate-shimmer-ring pointer-events-none z-10"
        style={{ transform: "translateY(-50%)" }}
      />
      <div
        className="absolute right-[8%] top-1/3 w-52 h-52 rounded-full border border-primary/20 animate-shimmer-ring pointer-events-none z-10"
        style={{ transform: "translateY(-50%)", animationDelay: "1.5s" }}
      />

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          className="max-w-2xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Eyebrow badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Factory Direct · Pan India Delivery · 2-Year Warranty
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-6"
          >
            {headlineLines.map((line, i) =>
              i === headlineLines.length - 1 && headlineLines.length > 1 ? (
                <span
                  key={i}
                  className="block text-primary drop-shadow-[0_0_30px_rgba(201,161,79,0.4)]"
                >
                  {line}
                </span>
              ) : (
                <span key={i} className="block">
                  {line}
                </span>
              )
            )}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg text-white/75 max-w-xl leading-relaxed mb-8"
          >
            {config.subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mb-10">
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 gap-2 font-semibold bg-white text-black hover:bg-white/90 shadow-xl"
            >
              <Link href={config.primaryCtaLink}>
                {config.primaryCtaText}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full px-8 gap-2 font-semibold bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50"
            >
              <Link href={config.secondaryCtaLink}>{config.secondaryCtaText}</Link>
            </Button>
          </motion.div>

          {/* Trust micro-badges */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-4 text-white/60 text-sm"
          >
            {[
              { icon: ShieldCheck, text: "2-Year Warranty" },
              { icon: Truck, text: "Free Pan India Delivery" },
              { icon: Star, text: "4.8/5 Customer Rating" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {text}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
