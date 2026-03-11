"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  User,
} from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
];

export function SiteHeader() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground"
        >
          Welcona
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {!loading && (
            <>
              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <LayoutDashboard className="size-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2 pl-2 border-l border-border">
                    <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="size-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="size-4" />
                      )}
                    </div>
                    <button
                      onClick={logout}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      title="Logout"
                    >
                      <LogOut className="size-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="flex flex-col px-5 py-4 gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-border my-2" />
            {!loading && (
              <>
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-2.5 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        logout();
                      }}
                      className="px-3 py-2.5 text-sm font-medium rounded-lg text-left text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-2.5 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-2.5 text-sm font-medium rounded-lg text-primary hover:bg-primary/10 transition-colors"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
