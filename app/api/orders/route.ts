import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/orders?ids=id1,id2,id3... — Fetch orders for client tracking
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsString = searchParams.get("ids") || "";

    if (!idsString) {
      return NextResponse.json({ orders: [] });
    }

    const ids = idsString.split(",").map(id => id.trim()).filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching guest tracking orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders details" },
      { status: 500 }
    );
  }
}
