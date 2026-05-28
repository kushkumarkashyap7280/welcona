import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json({ error: "Invalid product IDs" }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        retailPrice: true,
        discount: true,
        wholesalePrice: true,
        wholesaleMinQuantity: true,
        quantity: true, // to verify current stock
      }
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching current cart prices:", error);
    return NextResponse.json({ error: "Failed to fetch current prices" }, { status: 500 });
  }
}
