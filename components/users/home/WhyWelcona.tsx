"use client";

import { motion, type Variants } from "framer-motion";
import {
  Factory,
  ShieldCheck,
  Truck,
  IndianRupee,
  Headphones,
  Leaf,
  Award,
  RefreshCcw,
} from "lucide-react";

const FEATURES = [
  {
    icon: Factory,
    title: "Factory Direct",
    description:
      "We source directly from our manufacturing unit — cutting out middlemen so you get better pricing and guaranteed authenticity.",
    color: "from-violet-500/10 to-violet-500/5",
    iconColor: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-500/10",
  },
  {
    icon: ShieldCheck,
    title: "2-Year Warranty",
    description:
      "Every product ships with a comprehensive 2-year warranty. If anything fails under normal use, we make it right — no questions asked.",
    color: "from-emerald-500/10 to-emerald-500/5",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10",
  },
  {
    icon: IndianRupee,
    title: "Best Price Guarantee",
    description:
      "Factory-gate pricing, wholesale tiers for bulk buyers, and transparent discounts. No hidden markups, ever.",
    color: "from-amber-500/10 to-amber-500/5",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10",
  },
  {
    icon: Truck,
    title: "Pan India Delivery",
    description:
      "Delivered to your doorstep across India. We partner with reliable logistics providers for safe, timely shipments.",
    color: "from-blue-500/10 to-blue-500/5",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10",
  },
  {
    icon: Award,
    title: "Premium Quality",
    description:
      "Crafted from ISI-certified brass and stainless steel. Every fitting passes multi-stage QC before leaving the factory.",
    color: "from-rose-500/10 to-rose-500/5",
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-500/10",
  },
  {
    icon: Headphones,
    title: "Expert Support",
    description:
      "Our bath-fitting specialists are available to help you choose the right products, plan installations, and handle after-sales queries.",
    color: "from-cyan-500/10 to-cyan-500/5",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-500/10",
  },
  {
    icon: RefreshCcw,
    title: "Easy Returns",
    description:
      "Changed your mind? Received a wrong item? Our hassle-free return process ensures you are never stuck with a purchase.",
    color: "from-orange-500/10 to-orange-500/5",
    iconColor: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-500/10",
  },
  {
    icon: Leaf,
    title: "Sustainable Sourcing",
    description:
      "Our production follows eco-conscious processes — water-efficient designs and responsible material sourcing for a greener future.",
    color: "from-teal-500/10 to-teal-500/5",
    iconColor: "text-teal-600 dark:text-teal-400",
    iconBg: "bg-teal-500/10",
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function WhyWelcona() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="mb-12 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Why Welcona
        </p>
        <h2 className="mt-2.5 text-3xl font-bold tracking-tight md:text-4xl">
          Built on Trust. Delivered with Quality.
        </h2>
        <p className="mt-3 mx-auto max-w-2xl text-sm text-muted-foreground">
          From the factory floor to your bathroom — here's why thousands of Indian
          homeowners and contractors rely on Welcona for their bath fitting needs.
        </p>
      </motion.div>

      {/* Feature grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className={`group rounded-2xl border border-border/70 bg-linear-to-b ${feature.color} bg-card/85 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${feature.iconColor}`} />
              </div>
              <h3 className="mb-2 text-sm font-bold tracking-tight">{feature.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
