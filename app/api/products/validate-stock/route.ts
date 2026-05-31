import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST /api/products/validate-stock — Validate stock availability for cart items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartItems } = body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const productIds = cartItems.map((item: any) => item.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        quantity: true,
        retailPrice: true,
        discount: true,
        wholesalePrice: true,
        wholesaleMinQuantity: true,
      },
    });

    const stockIssues: { productId: string; name: string; requested: number; available: number }[] = [];
    const validItems: typeof products = [];

    for (const item of cartItems) {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        stockIssues.push({
          productId: item.productId,
          name: item.name || "Unknown product",
          requested: item.quantity,
          available: 0,
        });
        continue;
      }

      if (product.quantity < item.quantity) {
        stockIssues.push({
          productId: product.id,
          name: product.name,
          requested: item.quantity,
          available: product.quantity,
        });
      }

      validItems.push(product);
    }

    return NextResponse.json({
      valid: stockIssues.length === 0,
      stockIssues,
      products: validItems,
    });
  } catch (error) {
    console.error("Error validating stock:", error);
    return NextResponse.json({ error: "Failed to validate stock" }, { status: 500 });
  }
}
