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
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

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
      },
      orderBy: { createdAt: "desc" },
    });

    const relatedSanitized = related.map(item => {
      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        description: item.description,
        tags: item.tags,
        retailPrice: item.retailPrice,
        discount: item.discount,
        quantity: item.quantity,
        category: item.category,
        images: item.images,
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
        discount: product.discount,
        wholesalePrice: product.wholesalePrice,
        wholesaleMinQuantity: product.wholesaleMinQuantity,
        quantity: product.quantity,
        categoryId: product.categoryId,
        category: product.category,
        images: product.images,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
      related: relatedSanitized,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    return NextResponse.json(
      { error: "Failed to fetch product details" },
      { status: 500 }
    );
  }
}