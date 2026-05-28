"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type Variants, useReducedMotion } from "framer-motion";

const HERO_IMAGES = [
  { url: "/productCatelogAnimationImages/image1.png", title: "Luxury Bath Fittings", subtitle: "Crafted for lasting elegance, delivered direct from factory" },
  { url: "/productCatelogAnimationImages/image2.png", title: "Premium Showers", subtitle: "Transform your daily ritual with rainfall perfection" },
  { url: "/productCatelogAnimationImages/image3.png", title: "Precision Taps", subtitle: "ISI-certified brass fittings with anti-scale technology" },
  { url: "/productCatelogAnimationImages/image4.png", title: "Modern Vanities", subtitle: "Contemporary aesthetics designed for Indian interiors" },
  { url: "/productCatelogAnimationImages/image5.png", title: "Complete Your Space", subtitle: "Pan India delivery · 10-year warranty · Factory direct pricing" },
];

const slideVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.65, ease: [0.32, 0.72, 0, 1] } },
  exit: (dir: number) => ({ x: dir > 0 ? "-25%" : "25%", opacity: 0, transition: { duration: 0.5, ease: "easeIn" } }),
};

const textVariants: Variants = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut", delay: 0.2 } } };

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  const [loadedSlides, setLoadedSlides] = useState<boolean[]>(() => Array(HERO_IMAGES.length).fill(false));
  const prefersReduced = useReducedMotion();

  const go = useCallback((next: number) => {
    const wrapped = (next + HERO_IMAGES.length) % HERO_IMAGES.length;
    setDir(next > current ? 1 : -1);
    setCurrent(wrapped);
  }, [current]);

  useEffect(() => {
    if (prefersReduced) return;
    const id = setInterval(() => go(current + 1), 5000);
    return () => clearInterval(id);
  }, [current, go, prefersReduced]);

  const slide = HERO_IMAGES[current];

  useEffect(() => {
    let cancelled = false;

    const updateLoaded = (index: number) => {
      if (cancelled) return;
      setLoadedSlides((previous) => {
        if (previous[index]) return previous;
        const next = [...previous];
        next[index] = true;
        return next;
      });
    };

    HERO_IMAGES.forEach((item, index) => {
      const preloadImage = new window.Image();
      preloadImage.src = item.url;
      if (preloadImage.complete) {
        updateLoaded(index);
      } else {
        preloadImage.onload = () => updateLoaded(index);
        preloadImage.onerror = () => updateLoaded(index);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative h-72 sm:h-80 md:h-96 overflow-hidden bg-[#e8dcc8] select-none">
      <AnimatePresence initial={false} custom={dir} mode="sync">
        <motion.div key={current} custom={dir} variants={prefersReduced ? {} : slideVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0">
          <Image src={slide.url} alt={slide.title} fill className="object-cover" priority={current === 0} sizes="100vw" />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div key={`text-${current}`} variants={textVariants} initial="hidden" animate={loadedSlides[current] ? "visible" : "hidden"} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 md:px-16 z-10 pointer-events-none">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">{current + 1} / {HERO_IMAGES.length} · Welcona Collection</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight max-w-xl">{slide.title}</h1>
          <p className="mt-2 text-white/75 text-sm sm:text-base max-w-md">{slide.subtitle}</p>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows removed — using autoplay and dot indicators only */}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {HERO_IMAGES.map((_, i) => (
          <button key={i} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} className={i === current ? "h-1.5 w-6 rounded-full bg-white transition-all duration-300" : "h-1.5 w-1.5 rounded-full bg-white/40 hover:bg-white/60 transition-all duration-300"} />
        ))}
      </div>
    </div>
  );
}
