import type { Metadata } from "next";
import prisma from "@/lib/db";
import { normalizeImageSrc } from "@/lib/utils";
import { ProductDetailsClient } from "@/components/users/ProductDetailsClient";

type ProductDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  return <ProductDetailsClient productId={id} />;
}