import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DEFAULT_SUPABASE_BUCKET = "welcona-assets";

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function getSupabaseStorageBucket() {
  return process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET
    ?? process.env.SUPABASE_STORAGE_BUCKET
    ?? DEFAULT_SUPABASE_BUCKET;
}

export function normalizeImageValueForStorage(src: string) {
  const trimmed = src.trim();

  if (!trimmed) {
    return trimmed;
  }

  if (!isHttpUrl(trimmed)) {
    return trimmed.replace(/^\/+/, "");
  }

  return trimmed;
}

export function normalizeImageSrc(src: string) {
  const normalized = normalizeImageValueForStorage(src);

  if (!normalized) {
    return normalized;
  }

  if (isHttpUrl(normalized)) {
    return normalized;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return normalized;
  }

  const encodedPath = normalized
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${supabaseUrl}/storage/v1/object/public/${getSupabaseStorageBucket()}/${encodedPath}`;
}

export function isSupabaseStoragePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !isHttpUrl(trimmed) && !trimmed.startsWith("data:");
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
