"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/users/SiteHeader";
import { SiteFooter } from "@/components/users/SiteFooter";
import { CartIndicator } from "@/components/users/CartIndicator";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      {!isDashboard && <SiteFooter />}
      {!isDashboard && <CartIndicator />}
    </div>
  );
}
