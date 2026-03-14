import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") || "20"), 1), 50);
    const categoryId = searchParams.get("categoryId");
    const query = (searchParams.get("q") || "").trim();
    const sort = searchParams.get("sort") || "newest";

    const where = {
      ...(categoryId && categoryId !== "all" ? { categoryId } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { sku: { contains: query, mode: "insensitive" as const } },
              { tags: { hasSome: query.split(" ").filter(Boolean) } },
            ],
          }
        : {}),
    };

    const orderBy = (() => {
      switch (sort) {
        case "priceAsc":
          return [{ retailPrice: "asc" as const }, { createdAt: "desc" as const }];
        case "priceDesc":
          return [{ retailPrice: "desc" as const }, { createdAt: "desc" as const }];
        case "discount":
          return [{ discount: "desc" as const }, { createdAt: "desc" as const }];
        case "name":
          return [{ name: "asc" as const }];
        case "sku":
          return [{ sku: "asc" as const }];
        case "stock":
          return [{ quantity: "desc" as const }, { createdAt: "desc" as const }];
        default:
          return [{ createdAt: "desc" as const }];
      }
    })();

    const [total, items, categories] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
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
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    const data = items.map((item) => {
      const reviewCount = item.ratings.length;
      const avgRating =
        reviewCount === 0
          ? 0
          : item.ratings.reduce((sum, entry) => sum + entry.rating, 0) / reviewCount;

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        categoryId: item.categoryId,
        description: item.description,
        warranty: item.warranty,
        finish: item.finish,
        material: item.material,
        tags: item.tags,
        retailPrice: item.retailPrice,
        wholesalePrice: item.wholesalePrice,
        wholesaleMinQuantity: item.wholesaleMinQuantity,
        discount: item.discount,
        quantity: item.quantity,
        category: item.category,
        images: item.images,
        reviewCount,
        avgRating,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
      categories,
      items: data,
    });
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}