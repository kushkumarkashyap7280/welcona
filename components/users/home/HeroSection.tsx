"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Truck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";


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



export function HeroSection() {
  // Use locally added responsive hero images from `public/`
  const desktopHero = "/hero1672x940.png";
  const mobileHero = "/hero1448x1086.png";

  return (
    <section className="relative h-80 lg:h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <motion.div
        className="absolute inset-0 z-0"
        variants={imageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Desktop (large) image shown on lg and up; mobile image shown below lg */}
        <Image
          src={desktopHero}
          alt="Luxury bathroom - desktop"
          fill
          priority
          className="hidden lg:block object-cover object-center"
          sizes="(min-width:1024px) 100vw, 100vw"
        />

        <div className="block lg:hidden w-full h-80">
          <Image
            src={mobileHero}
            alt="Luxury bathroom - mobile"
            width={1200}
            height={800}
            priority
            style={{ width: "100%", height: "320px", objectFit: "contain", objectPosition: "center" }}
          />
        </div>

        {/* No overlays: show image as-is (no brightness reduction) */}
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

      {/* NOTE: Overlaid textual content removed because the hero image already contains branding/text. */}
    </section>
  );
}
