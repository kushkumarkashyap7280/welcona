import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

type SortMode = "newest" | "priceAsc" | "priceDesc" | "discount";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(Number(searchParams.get("page") || "1"), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") || "12"), 1), 24);
  const categoryId = searchParams.get("categoryId");
  const query = (searchParams.get("q") || "").trim();
  const sort = (searchParams.get("sort") as SortMode) || "newest";
  const tag = searchParams.get("tag") ?? null;
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;

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
    ...(tag ? { tags: { hasSome: [tag] } } : {}),
    ...(minPrice !== null || maxPrice !== null
      ? {
          retailPrice: {
            ...(minPrice !== null ? { gte: minPrice } : {}),
            ...(maxPrice !== null ? { lte: maxPrice } : {}),
          },
        }
      : {}),
    ...(searchParams.get("wholesale") === "true"
      ? {
          wholesalePrice: { not: null },
        }
      : {}),
  };

  const orderBy =
    sort === "priceAsc"
      ? [{ retailPrice: "asc" as const }, { createdAt: "desc" as const }]
      : sort === "priceDesc"
        ? [{ retailPrice: "desc" as const }, { createdAt: "desc" as const }]
        : sort === "discount"
          ? [{ discount: "desc" as const }, { createdAt: "desc" as const }]
          : [{ createdAt: "desc" as const }];

  // Fetch tags from all products in selected category (ignoring active tag/price filter)
  const tagSourceWhere = {
    ...(categoryId && categoryId !== "all" ? { categoryId } : {}),
  };

  const [total, items, categories, tagSourceProducts] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
          id: true,
          name: true,
          sku: true,
          description: true,
          tags: true,
          retailPrice: true,
          discount: true,
          wholesalePrice: true,
          wholesaleMinQuantity: true,
          quantity: true,
          category: { select: { id: true, name: true } },
          images: {
            select: { image: true, isPrimary: true, index: true },
            orderBy: [{ isPrimary: "desc" }, { index: "asc" }, { createdAt: "asc" }],
          },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: tagSourceWhere,
      select: { tags: true },
    }),
  ]);

  const allTags = [...new Set(tagSourceProducts.flatMap((p) => p.tags))].sort();

  const data = items.map((item) => {
    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      description: item.description,
      tags: item.tags,
      retailPrice: item.retailPrice,
      discount: item.discount,
      wholesalePrice: item.wholesalePrice,
      wholesaleMinQuantity: item.wholesaleMinQuantity,
      inStock: item.quantity > 0,
      category: item.category,
      images: item.images,
    };
  });

  return NextResponse.json({
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
    totalPages: Math.ceil(total / pageSize),
    categories,
    allTags,
    items: data,
  });
}
