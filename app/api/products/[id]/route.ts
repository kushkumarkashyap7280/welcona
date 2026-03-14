import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
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
                id: true,
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
          select: {
            id: true,
            rating: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add review stats to related products
    const relatedWithStats = related.map(item => {
      const relatedReviewCount = item.ratings.length;
      const relatedAvgRating = relatedReviewCount === 0
        ? 0
        : item.ratings.reduce((sum, entry) => sum + entry.rating, 0) / relatedReviewCount;

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        description: item.description,
        tags: item.tags,
        retailPrice: item.retailPrice,
        wholesalePrice: item.wholesalePrice,
        wholesaleMinQuantity: item.wholesaleMinQuantity,
        discount: item.discount,
        quantity: item.quantity,
        category: item.category,
        images: item.images,
        reviewCount: relatedReviewCount,
        avgRating: relatedAvgRating,
      };
    });

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        warranty: product.warranty,
        finish: product.finish,
        material: product.material,
        tags: product.tags,
        retailPrice: product.retailPrice,
        wholesalePrice: product.wholesalePrice,
        wholesaleMinQuantity: product.wholesaleMinQuantity,
        discount: product.discount,
        quantity: product.quantity,
        categoryId: product.categoryId,
        category: product.category,
        images: product.images,
        ratings: product.ratings.map(rating => ({
          id: rating.id,
          rating: rating.rating,
          review: rating.review,
          imageUrl: (rating as any).imageUrl || null,
          videoUrl: (rating as any).videoUrl || null,
          createdAt: rating.createdAt.toISOString(),
          user: rating.user,
        })),
        reviewCount,
        avgRating,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
      related: relatedWithStats,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    return NextResponse.json(
      { error: "Failed to fetch product details" },
      { status: 500 }
    );
  }
}