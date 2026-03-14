"use client";

import * as React from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { AdminLoginModal } from "@/components/admin/AdminLoginModal";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ReactQueryProvider>
        <AuthProvider>
          {children}
          <AdminLoginModal />
          <Toaster />
        </AuthProvider>
      </ReactQueryProvider>
    </ThemeProvider>
  );
}
