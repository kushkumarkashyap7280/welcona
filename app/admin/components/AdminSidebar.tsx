"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Package,
  Tags,
  LogOut,
  Settings,
  ShoppingBag,
  Menu,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: Tags },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
];

export function AdminSidebar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const activeItem = navItems.find((item) => pathname.startsWith(item.href));
  const activeTitle = activeItem ? activeItem.name : "Control Center";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-45 bg-black/45 backdrop-blur-xs transition-opacity duration-300 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out md:static md:translate-x-0 shrink-0 shadow-lg md:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand header */}
        <div className="flex h-15 items-center justify-between border-b px-5">
          <Link href="/admin/products" className="flex items-center gap-3 font-bold tracking-tight text-lg text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Settings className="h-4 w-4 animate-[spin_8s_linear_infinite]" />
            </div>
            <div className="flex flex-col">
              <span className="leading-none text-sm font-extrabold uppercase tracking-wider text-primary">Welcona</span>
              <span className="text-[10px] text-muted-foreground mt-1">Control Panel</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        
        {/* Navigation links */}
        <div className="flex-1 overflow-auto py-4 px-3">
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground",
                    isActive 
                      ? "bg-primary/5 text-primary border-l-2 border-primary shadow-xs font-bold" 
                      : "hover:bg-muted/50 hover:translate-x-1"
                  )}
                >
                  <Icon className={cn("h-4.5 w-4.5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Footer profile & logout */}
        <div className="mt-auto p-4 border-t bg-muted/10">
          <form action={logoutAction}>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl px-3.5 py-3 transition-all duration-200"
            >
              <LogOut className="h-4.5 w-4.5" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-muted/20">
        {/* Global Page Header */}
        <header className="flex h-15 shrink-0 items-center justify-between border-b bg-card px-4 sm:px-6 shadow-xs z-30">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden h-9 w-9 rounded-lg hover:bg-muted"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <h1 className="font-bold text-base sm:text-lg text-foreground tracking-tight">
              {activeTitle}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Active
            </span>
          </div>
        </header>
        
        {/* Content container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
