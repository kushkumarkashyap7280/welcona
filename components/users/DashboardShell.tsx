"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";

const SIDEBAR_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/cart", label: "Cart", icon: ShoppingCart },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Welcona
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-border px-3 py-4 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="size-4" />
            Back to Site
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-5 md:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1 text-muted-foreground hover:text-foreground"
          >
            <Menu className="size-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-none">
                {user?.fullName || "User"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user?.email}
              </p>
            </div>
            <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 text-primary">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="size-9 rounded-full object-cover"
                />
              ) : (
                <User className="size-4" />
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 px-5 py-6 md:px-8 md:py-8">{children}</div>
      </div>
    </div>
  );
}
