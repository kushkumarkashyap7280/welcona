"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { logoutAction } from "@/lib/actions/auth";

type SiteShellProps = {
  children: React.ReactNode;
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
];

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const { isAuthenticated, user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="text-lg font-semibold tracking-[0.22em]">
            WELCONA
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!loading && (
              isAuthenticated ? (
                <>
                  <Button asChild variant="ghost" size="sm" className="rounded-full">
                    <Link href="/dashboard">
                      {user?.fullName ?? user?.email ?? "Account"}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href="/cart">Cart</Link>
                  </Button>
                  <form action={logoutAction}>
                    <Button variant="ghost" size="sm" className="rounded-full" type="submit">
                      Logout
                    </Button>
                  </form>
                </>
              ) : (
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/login">Login</Link>
                </Button>
              )
            )}
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.main>
    </div>
  );
}
