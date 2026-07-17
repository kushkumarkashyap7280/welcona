"use client";

import { useEffect } from "react";

/**
 * Redirects the user to the live production site (welcona.com).
 * This project was built for a client and is deployed on their domain.
 * This redirect ensures visitors are sent to the actual live site.
 */
export function RedirectToLive() {
  useEffect(() => {
    window.location.replace("https://www.welcona.com/");
  }, []);

  return null;
}
