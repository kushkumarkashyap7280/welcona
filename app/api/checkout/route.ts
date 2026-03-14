import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/db";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// POST /api/checkout — Create a Razorpay order
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.sub },
      include: {
        cartItems: {
          include: {
            product: {
              select: {
                id: true,
                retailPrice: true,
                wholesalePrice: true,
                wholesaleMinQuantity: true,
                discount: true,
                quantity: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Calculate total with wholesale pricing
    let total = 0;
    for (const item of cart.cartItems) {
      const product = item.product;
      let unitPrice = product.retailPrice;
      if (item.quantity >= product.wholesaleMinQuantity) {
        unitPrice = product.wholesalePrice;
      }
      if (product.discount) {
        unitPrice = unitPrice * (1 - product.discount / 100);
      }
      total += unitPrice * item.quantity;
    }

    // Razorpay expects amount in paise (smallest currency unit)
    const amountInPaise = Math.round(total * 100);

    // Receipt max 40 chars - use short user id + timestamp
    const shortUserId = session.sub.slice(0, 8);
    const receipt = `rcpt_${shortUserId}_${Date.now()}`;

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

// PATCH /api/checkout — Verify Razorpay payment signature
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification data" },
        { status: 400 }
      );
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verified: true,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
