import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

interface SimilarProductsRequest {
  productId: string;
  categoryId: string;
  tags: string[];
  limit?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SimilarProductsRequest;
    const { productId, categoryId, tags, limit = 4 } = body;

    // Find products with similar tags or same category
    const similarProducts = await prisma.product.findMany({
      where: {
        AND: [
          { id: { not: productId } }, // Exclude current product
          {
            OR: [
              {
                categoryId: categoryId, // Same category
              },
              {
                tags: {
                  hasSome: tags, // Has some of the same tags
                },
              },
            ],
          },
        ],
      },
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          orderBy: [{ isPrimary: "desc" }, { index: "asc" }, { createdAt: "asc" }],
          take: 1,
        },
        ratings: {
          select: {
            id: true,
            rating: true,
          },
        },
      },
      orderBy: {
        // Prioritize by category match + tag matches
        createdAt: "desc",
      },
    });

    // Add review stats
    const productsWithStats = similarProducts.map((product) => {
      const reviewCount = product.ratings.length;
      const avgRating =
        reviewCount === 0
          ? 0
          : product.ratings.reduce((sum, entry) => sum + entry.rating, 0) /
            reviewCount;

      // Calculate match score (for better sorting)
      const categoryMatch = product.categoryId === categoryId ? 10 : 0;
      const tagMatches = tags.filter((tag) =>
        product.tags.includes(tag)
      ).length;
      const matchScore = categoryMatch + tagMatches * 2;

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        tags: product.tags,
        retailPrice: product.retailPrice,
        discount: product.discount,
        quantity: product.quantity,
        category: product.category,
        images: product.images,
        reviewCount,
        avgRating,
        matchScore,
      };
    });

    // Sort by match score (higher first)
    productsWithStats.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      products: productsWithStats,
    });
  } catch (error) {
    console.error("Error fetching similar products:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar products" },
      { status: 500 }
    );
  }
}
