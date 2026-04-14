"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      const unregisterAll = async () => {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((reg) => reg.unregister()));
        } catch {
          // Ignore failures in dev cleanup.
        }
      };

      void unregisterAll();
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Ignore registration failures in unsupported/private contexts.
      }
    };

    void register();
  }, []);

  return null;
}
