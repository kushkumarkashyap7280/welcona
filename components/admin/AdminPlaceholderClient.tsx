"use client";

import Link from "next/link";
import { SiteShell } from "@/components/users/SiteShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";

export function AdminPlaceholderClient() {
  const { isAuthenticated, user } = useAuth();
  const hasAdminAccess = isAuthenticated && user?.role === "admin";

  return (
    <SiteShell>
      <section className="px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto w-full max-w-5xl luxury-panel p-8 md:p-10">
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
            Admin Panel
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
            Admin Workspace Placeholder
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            This route is reserved for admin users only. Role-based checks can be
            connected once your auth backend is live.
          </p>
          {!hasAdminAccess && (
            <p className="mt-6 rounded-2xl border border-border/80 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
              Access denied for customer/public sessions.
            </p>
          )}
          {!isAuthenticated && (
            <Button asChild className="mt-6 rounded-full">
              <Link href="/login">Use Login Preview</Link>
            </Button>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
