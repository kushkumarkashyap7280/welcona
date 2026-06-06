# Welcona — SEO Restoration Guide

> **Purpose:** This file documents all SEO optimizations that were removed from the Welcona Next.js project. Use this as a prompt or reference for any AI agent to restore full SEO across the site.
>
> **Date Removed:** June 6, 2026
> **Tech Stack:** Next.js (App Router), TypeScript, Prisma ORM

---

## 🔧 AI Agent Prompt (Copy-Paste Ready)

```
Implement full SEO optimization for my Next.js (App Router) e-commerce project "Welcona" — a luxury bath fittings brand. Follow the exact specifications below for each file. Add metadata exports, Open Graph tags, Twitter cards, canonical URLs, structured data, and proper title templates. The site URL should be pulled from NEXT_PUBLIC_APP_URL or VERCEL_URL env vars with localhost:3000 fallback.
```

---

## 📁 Files to Modify

### 1. `app/layout.tsx` — Root Layout Metadata

Add the following root-level metadata with title template, description, manifest, and icon references:

```tsx
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "Welcona",
    template: "%s | Welcona",
  },
  description:
    "Welcona luxury bath fittings — premium design, modern engineering, and reliable quality.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
};
```

**What this does:**
- `title.template` → Every child page title gets ` | Welcona` appended automatically
- `description` → Default meta description for pages that don't define their own
- `manifest` → Links to PWA web manifest
- `icons` → Points to the dynamically generated favicon (`app/icon.tsx`) and apple icon (`app/apple-icon.tsx`)

---

### 2. `app/(users)/page.tsx` — Home Page

Add static metadata export:

```tsx
export const metadata = {
  title: "Welcona — Luxury Bath Fittings, Factory Direct",
  description:
    "Discover Welcona's curated collection of premium showers, taps, and bath accessories. Factory-direct pricing, 2-year warranty, pan India delivery.",
};
```

---

### 3. `app/(users)/products/page.tsx` — Products Listing Page

Add static metadata export:

```tsx
export const metadata = {
  title: "Products — Welcona Bath Fittings",
  description:
    "Browse Welcona's full collection of luxury bath fittings. Filter by category, price, tags and more.",
};
```

---

### 4. `app/(users)/about/page.tsx` — About Page

Add static metadata export with type annotation:

```tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Our Story & Journey | Welcona Luxury Bath Fittings",
  description:
    "Discover Welcona's factory-direct journey starting in 2008 in Shahdara, Delhi. Deeply rooted in Indian home emotions, premium CP fittings engineering, and a lifetime on-site warranty support.",
};
```

---

### 5. `app/(users)/products/[id]/page.tsx` — Product Detail Page (Dynamic SEO)

This is the most complex one. Add these helper functions and a `generateMetadata` function that fetches product data from Prisma and generates dynamic Open Graph + Twitter card metadata:

```tsx
import type { Metadata } from "next";
import prisma from "@/lib/db";
import { normalizeImageSrc } from "@/lib/utils";

// Helper: resolve site URL from env vars
function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

// Helper: build a description from product fields
function buildProductDescription(product: {
  description: string | null;
  category: { name: string };
  finish: string | null;
  material: string | null;
  warranty: string | null;
}) {
  if (product.description?.trim()) {
    return product.description.trim().slice(0, 180);
  }
  const details = [
    `Category: ${product.category.name}`,
    product.finish ? `Finish: ${product.finish}` : null,
    product.material ? `Material: ${product.material}` : null,
    product.warranty ? `Warranty: ${product.warranty}` : null,
  ].filter(Boolean);
  return details.join(" | ");
}

// Dynamic metadata generation
export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const siteUrl = getSiteUrl();
  const pageUrl = new URL(`/products/${id}`, siteUrl).toString();

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      finish: true,
      material: true,
      warranty: true,
      category: { select: { name: true } },
      images: {
        select: { image: true, isPrimary: true, index: true },
        orderBy: [{ isPrimary: "desc" }, { index: "asc" }],
      },
    },
  });

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product is not available.",
      alternates: {
        canonical: pageUrl,
      },
    };
  }

  const description = buildProductDescription(product);
  const primaryImage = product.images[0]?.image
    ? normalizeImageSrc(product.images[0].image)
    : undefined;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: product.name,
      description,
      url: pageUrl,
      siteName: "Welcona",
      type: "website",
      images: primaryImage ? [{ url: primaryImage, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: primaryImage ? [primaryImage] : undefined,
    },
  };
}
```

**Prisma fields used:** `name`, `description`, `finish`, `material`, `warranty`, `category.name`, `images` (with `isPrimary` sorting)

**Key features:**
- Canonical URL per product
- Open Graph with product image, title, description
- Twitter large image card
- Fallback description built from product attributes if `description` is empty
- Description capped at 180 chars

---

## 📌 Additional SEO Enhancements to Consider (Not Previously Implemented)

If the client pays for SEO in the future, also consider adding:

### Structured Data (JSON-LD)
Add `application/ld+json` scripts for:
- **Organization** schema on the home page
- **Product** schema on product detail pages (with price, availability, reviews)
- **BreadcrumbList** schema on all pages

### robots.txt
Create `app/robots.ts`:
```tsx
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://welcona.com/sitemap.xml",
  };
}
```

### Sitemap
Create `app/sitemap.ts`:
```tsx
import { MetadataRoute } from "next";
import prisma from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    select: { id: true, updatedAt: true },
  });

  const productUrls = products.map((p) => ({
    url: `https://welcona.com/products/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    { url: "https://welcona.com", lastModified: new Date(), priority: 1 },
    { url: "https://welcona.com/products", lastModified: new Date(), priority: 0.9 },
    { url: "https://welcona.com/about", lastModified: new Date(), priority: 0.5 },
    { url: "https://welcona.com/terms", lastModified: new Date(), priority: 0.3 },
    ...productUrls,
  ];
}
```

### Meta Tags for Social Sharing
Add to root layout metadata:
```tsx
metadataBase: new URL("https://welcona.com"),
openGraph: {
  type: "website",
  locale: "en_IN",
  siteName: "Welcona",
},
twitter: {
  card: "summary_large_image",
},
```

---

## 🏗 Project Structure Reference

```
app/
├── layout.tsx                          ← Root metadata (title template, description, icons)
├── icon.tsx                            ← Dynamic favicon generator (renders "W")
├── apple-icon.tsx                      ← Dynamic apple icon generator
├── (users)/
│   ├── page.tsx                        ← Home page metadata
│   ├── about/page.tsx                  ← About page metadata
│   ├── products/
│   │   ├── page.tsx                    ← Products listing metadata
│   │   └── [id]/page.tsx              ← Dynamic product metadata (generateMetadata)
│   ├── terms/page.tsx                  ← No metadata was set (add if needed)
│   └── privacy/page.tsx               ← Redirects to /terms
├── cart/page.tsx                        ← Redirects to /products
└── not-found.tsx                       ← No metadata needed
```

---

## ✅ Checklist for Full Restoration

- [ ] Root layout: title template + description + manifest + icons
- [ ] Home page: static metadata
- [ ] Products page: static metadata
- [ ] About page: static metadata (with Metadata type import)
- [ ] Product detail `[id]`: generateMetadata with OG + Twitter + canonical
- [ ] (Optional) Add robots.ts
- [ ] (Optional) Add sitemap.ts
- [ ] (Optional) Add JSON-LD structured data
- [ ] (Optional) Add metadataBase to root layout
