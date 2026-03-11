"use client";

import { motion } from "framer-motion";
import { SiteShell } from "@/components/users/SiteShell";

type PublicPlaceholderClientProps = {
  title: string;
  description: string;
  note: string;
};

export function PublicPlaceholderClient({
  title,
  description,
  note,
}: PublicPlaceholderClientProps) {
  return (
    <SiteShell>
      <section className="px-5 py-20 md:px-8 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto w-full max-w-5xl"
        >
          <div className="luxury-panel p-8 md:p-10">
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
              Public Page
            </p>
            <h1 className="mt-3 text-3xl font-semibold md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              {description}
            </p>
            <p className="mt-8 rounded-2xl border border-border/80 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
              {note}
            </p>
          </div>
        </motion.div>
      </section>
    </SiteShell>
  );
}
