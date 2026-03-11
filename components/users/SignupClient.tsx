"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/users/SiteShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";

export function SignupClient() {
  const router = useRouter();
  const { isAuthenticated, loginAsCustomer } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  return (
    <SiteShell>
      <section className="px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto w-full max-w-3xl luxury-panel p-8 md:p-10">
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
            Customer Access
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">Signup</h1>
          <p className="mt-4 text-muted-foreground">
            MVP signup will be replaced by real onboarding with verification and
            secure account creation.
          </p>
          {!isAuthenticated && (
            <Button onClick={loginAsCustomer} size="lg" className="mt-6 rounded-full px-6">
              Continue with Demo Signup
            </Button>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
