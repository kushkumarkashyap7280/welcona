import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeImageSrc(src: string) {
  const trimmed = src.trim();

  if (!trimmed) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();

    if (hostname === "drive.google.com") {
      const fileIdFromPath = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
      const fileId = fileIdFromPath ?? url.searchParams.get("id");

      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
      }
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

export function isGoogleHostedImageSrc(src: string) {
  try {
    const url = new URL(normalizeImageSrc(src));
    const hostname = url.hostname.toLowerCase();
    return hostname === "drive.google.com" || hostname.endsWith("googleusercontent.com");
  } catch {
    return false;
  }
}
