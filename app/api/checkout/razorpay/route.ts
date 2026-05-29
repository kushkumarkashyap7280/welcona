import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import prisma from "@/lib/db";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Delivery charge map
const DELIVERY_CHARGES: Record<string, number> = {
  CUSTOMER_PICKUP: 0,
  DELHI: 150,
  OUTSIDE_DELHI: 250,
};

// POST /api/checkout/razorpay — Generate a Razorpay payment order for guest checkout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartItems, deliveryOption } = body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!deliveryOption || !["CUSTOMER_PICKUP", "DELHI", "OUTSIDE_DELHI"].includes(deliveryOption)) {
      return NextResponse.json({ error: "Invalid delivery option" }, { status: 400 });
    }

    // Calculate total securely from actual DB records
    let itemsTotal = 0;
    for (const item of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { retailPrice: true, discount: true, wholesalePrice: true, wholesaleMinQuantity: true }
      });

      if (!product) {
        return NextResponse.json({ error: `Product with ID ${item.productId} not found.` }, { status: 400 });
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

    // Add delivery charge
    const deliveryCharge = DELIVERY_CHARGES[deliveryOption] ?? 0;
    const total = itemsTotal + deliveryCharge;

    // Razorpay expects amount in paise (subunit)
    const amountInPaise = Math.round(total * 100);
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
