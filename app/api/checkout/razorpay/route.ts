import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import prisma from "@/lib/db";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Bulk order threshold in paise (default ₹10,000 = 1000000 paise)
const BULK_THRESHOLD = parseInt(process.env.BULK_ORDER_THRESHOLD || "1000000");

// POST /api/checkout/razorpay — Generate a Razorpay payment order for guest checkout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartItems, deliveryOption } = body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!deliveryOption || !["CUSTOMER_PICKUP", "HOME_DELIVERY"].includes(deliveryOption)) {
      return NextResponse.json({ error: "Invalid delivery option" }, { status: 400 });
    }

    // ── Stock validation BEFORE creating payment order ──
    const stockIssues: { name: string; requested: number; available: number }[] = [];

    // Calculate total securely from actual DB records (no delivery charge — we don't handle delivery fees)
    let itemsTotal = 0;
    for (const item of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, retailPrice: true, discount: true, wholesalePrice: true, wholesaleMinQuantity: true, quantity: true }
      });

      if (!product) {
        return NextResponse.json({ error: `Product with ID ${item.productId} not found.` }, { status: 400 });
      }

      // Check stock availability
      if (product.quantity < item.quantity) {
        stockIssues.push({
          name: product.name,
          requested: item.quantity,
          available: product.quantity,
        });
        continue; // Skip price calculation for unavailable items but collect all issues
      }

      let price = product.retailPrice;
      if (
        product.wholesalePrice !== null &&
        product.wholesaleMinQuantity !== null &&
        item.quantity >= product.wholesaleMinQuantity
      ) {
        price = product.wholesalePrice;
      } else if (product.discount) {
        price = price * (1 - product.discount / 100);
      }
      itemsTotal += price * item.quantity;
    }

    // If any stock issues, reject the payment creation
    if (stockIssues.length > 0) {
      return NextResponse.json({
        error: "Some products are not available in the requested quantity.",
        stockIssues,
      }, { status: 409 });
    }

    // Total = items only (no delivery charge — we don't handle delivery fees)
    const total = itemsTotal;

    // Razorpay expects amount in paise (subunit)
    const amountInPaise = Math.round(total * 100);

    // Bulk order guard — orders at or above threshold must use WhatsApp flow
    if (amountInPaise >= BULK_THRESHOLD) {
      return NextResponse.json({
        error: "Orders above the bulk threshold use WhatsApp payment. Please use the bulk order flow.",
        isBulk: true,
      }, { status: 400 });
    }

    const receipt = `rcpt_guest_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
