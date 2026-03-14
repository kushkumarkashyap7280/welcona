import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      images: {
        orderBy: [{ isPrimary: "desc" }, { index: "asc" }, { createdAt: "asc" }],
      },
      ratings: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const reviewCount = product.ratings.length;
  const avgRating =
    reviewCount === 0
      ? 0
      : product.ratings.reduce((sum, entry) => sum + entry.rating, 0) / reviewCount;

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 4,
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { index: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    product: {
      ...product,
      reviewCount,
      avgRating,
    },
    related,
  });
}