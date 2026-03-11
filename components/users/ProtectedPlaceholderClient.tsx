"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SiteShell } from "@/components/users/SiteShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";

type ProtectedPlaceholderClientProps = {
  title: string;
  description: string;
};

export function ProtectedPlaceholderClient({
  title,
  description,
}: ProtectedPlaceholderClientProps) {
  const { isAuthenticated } = useAuth();

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
              Customer Panel
            </p>
            <h1 className="mt-3 text-3xl font-semibold md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              {description}
            </p>

            {!isAuthenticated ? (
              <div className="mt-8 rounded-2xl border border-border/80 bg-card/70 p-5">
                <p className="text-sm text-muted-foreground">
                  This section is for logged-in users only in the final product.
                </p>
                <Button asChild className="mt-4 rounded-full">
                  <Link href="/login">Go to Login</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-border/80 bg-card/70 p-5 text-sm text-muted-foreground">
                Logged-in preview active for MVP.
              </div>
            )}
          </div>
        </motion.div>
      </section>
    </SiteShell>
  );
}
