"use client";

import * as React from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AdminLoginModal } from "@/components/admin/AdminLoginModal";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <AdminLoginModal />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
