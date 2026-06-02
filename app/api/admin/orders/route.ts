import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/db";
import { sendBulkOrderConfirmedEmail, OrderItemForEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || "20"), 1),
      50
    );
    const status = searchParams.get("status") || "";
    const query = (searchParams.get("q") || "").trim();

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }
    if (query) {
      where.OR = [
        { id: { contains: query, mode: "insensitive" } },
        { customerEmail: { contains: query, mode: "insensitive" } },
        { customerName: { contains: query, mode: "insensitive" } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: {
                select: { name: true, images: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
      orders,
    });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders — Update order status
// For WHATSAPP (bulk) orders being CONFIRMED: atomically deduct stock + send confirmation email
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch the current order to check if it's a bulk (WHATSAPP) order
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: { select: { id: true, name: true, quantity: true } },
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // ─── SPECIAL HANDLING: Bulk (WHATSAPP) order being CONFIRMED ───
    // When admin confirms a bulk order → atomically deduct stock + mark completed + send email
    if (
      existingOrder.paymentMethod === "WHATSAPP" &&
      existingOrder.status !== "CONFIRMED" &&
      status === "CONFIRMED"
    ) {
      const result = await prisma.$transaction(async (tx) => {
        const stockIssues: {
          name: string;
          requested: number;
          available: number;
        }[] = [];

        // Lock and validate stock for each order item
        for (const item of existingOrder.orderItems) {
          const lockedProducts = await tx.$queryRaw<
            { id: string; name: string; quantity: number }[]
          >`
            SELECT id, name, quantity
            FROM "Product"
            WHERE id = ${item.productId}
            FOR UPDATE
          `;

          if (lockedProducts.length === 0) {
            throw new Error(`Product ${item.productId} not found.`);
          }

          const product = lockedProducts[0];

          if (product.quantity < item.quantity) {
            stockIssues.push({
              name: product.name,
              requested: item.quantity,
              available: product.quantity,
            });
          }
        }

        // If stock issues, abort
        if (stockIssues.length > 0) {
          throw { stockIssues, message: "Insufficient stock for bulk order" };
        }

        // Deduct stock
        for (const item of existingOrder.orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: { decrement: item.quantity },
            },
          });
        }

        // Update order to CONFIRMED
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            status: "CONFIRMED",
          },
        });

        return updatedOrder;
      });

      // Send confirmation email to customer
      const emailItems: OrderItemForEmail[] = existingOrder.orderItems.map(
        (item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })
      );

      sendBulkOrderConfirmedEmail(
        existingOrder.customerEmail,
        existingOrder.customerName,
        existingOrder.id,
        existingOrder.total,
        existingOrder.deliveryOption,
        emailItems
      ).catch((err) =>
        console.error("Error sending bulk confirmed email:", err)
      );

      return NextResponse.json({ order: result });
    }

    // ─── REGULAR STATUS UPDATE (non-bulk or non-confirm actions) ───
    const data: any = {};
    if (status) data.status = status;

    const order = await prisma.order.update({
      where: { id: orderId },
      data,
    });

    return NextResponse.json({ order });
  } catch (error: any) {
    // Handle stock issues from bulk confirm
    if (error?.stockIssues) {
      return NextResponse.json(
        {
          error: "Insufficient stock to confirm this bulk order.",
          stockIssues: error.stockIssues,
        },
        { status: 409 }
      );
    }

    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
