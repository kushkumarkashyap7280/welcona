"use client";

import Link from "next/link";

export function SiteFooter() {
  const openAdminLogin = () => {
    window.dispatchEvent(new Event("welcona:open-admin-login"));
  };

  return (
    <footer className="border-t border-border/60 bg-background/60 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">
        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="hover:text-foreground hover:underline underline-offset-4">
              Home
            </Link>
            <Link href="/about" className="hover:text-foreground hover:underline underline-offset-4">
              About
            </Link>
            <Link href="/products" className="hover:text-foreground hover:underline underline-offset-4">
              Products
            </Link>
            <Link href="/privacy" className="hover:text-foreground hover:underline underline-offset-4">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground hover:underline underline-offset-4">
              Terms & Conditions
            </Link>
            <button
              type="button"
              onClick={openAdminLogin}
              className="hover:text-foreground hover:underline underline-offset-4"
            >
              Admin
            </button>
          </div>
          <p className="text-center">
            &copy; {new Date().getFullYear()} Welcona. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
