"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SiteShell } from "@/components/users/SiteShell";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/lib/actions/auth";

export function LoginClient() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <SiteShell>
      <section className="flex min-h-[80vh] items-center justify-center px-5 py-20 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          <div className="luxury-panel p-8 md:p-10">
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
              Customer Access
            </p>
            <h1 className="mt-3 text-2xl font-semibold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your Welcona account.
            </p>

            <form action={formAction} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-0 transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-0 transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {state?.error && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                  {state.error}
                </p>
              )}

              <Button
                type="submit"
                disabled={pending}
                size="lg"
                className="w-full rounded-xl"
              >
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>

            <p className="mt-4 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              <strong>Dev seed credentials:</strong> user1@gmail.com / password
            </p>
          </div>
        </motion.div>
      </section>
    </SiteShell>
  );
}
