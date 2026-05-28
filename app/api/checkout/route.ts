import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { sendPaymentSuccessEmail, sendAdminOrderNotificationEmail, OrderItemForEmail } from "@/lib/email";

// POST /api/checkout — Place guest order (handles both COD & verified Online Razorpay)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      shippingAddress, 
      paymentMethod, 
      cartItems,
      // Online payment credentials (if ONLINE)
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = body;

    // 1. Basic validation
    if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !paymentMethod || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "Missing required order information." }, { status: 400 });
    }

    if (paymentMethod !== "CASH_ON_DELIVERY" && paymentMethod !== "ONLINE") {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
    }

    // 2. Signature verification for ONLINE payments
    if (paymentMethod === "ONLINE") {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json({ error: "Missing Razorpay verification credentials." }, { status: 400 });
      }

      const secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (generatedSignature !== razorpaySignature) {
        return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
      }
    }

    // 3. Retrieve database products and calculate totals securely
    let total = 0;
    const orderItemsToCreate: { productId: string; quantity: number; price: number }[] = [];
    const emailItems: OrderItemForEmail[] = [];

    for (const item of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return NextResponse.json({ error: `Product with ID ${item.productId} not found.` }, { status: 400 });
      }

      if (product.quantity < item.quantity) {
        return NextResponse.json({ error: `Insufficient inventory for product: ${product.name}.` }, { status: 400 });
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

      total += price * item.quantity;

      orderItemsToCreate.push({
        productId: product.id,
        quantity: item.quantity,
        price: price
      });

      emailItems.push({
        name: product.name,
        quantity: item.quantity,
        price: price
      });
    }

    // 4. Create order and deduct stock in a single transaction
    const order = await prisma.$transaction(async (tx) => {
      // Deduct quantities
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      // Create Order
      return tx.order.create({
        data: {
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          total,
          paymentMethod,
          paymentStatus: paymentMethod === "ONLINE" ? "COMPLETED" : "PENDING",
          status: paymentMethod === "ONLINE" ? "CONFIRMED" : "PENDING",
          razorpayOrderId: paymentMethod === "ONLINE" ? razorpayOrderId : null,
          razorpayPaymentId: paymentMethod === "ONLINE" ? razorpayPaymentId : null,
          orderItems: {
            create: orderItemsToCreate
          }
        }
      });
    });

    // 5. Send Resend transactional emails asynchronously
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@welcona.com";
    
    // Email to customer
    sendPaymentSuccessEmail(customerEmail, order.id, total, emailItems, paymentMethod)
      .catch(err => console.error("Error sending customer email:", err));

    // Email to admin
    sendAdminOrderNotificationEmail(
      adminEmail, 
      customerName, 
      customerEmail, 
      customerPhone, 
      shippingAddress, 
      order.id, 
      total, 
      emailItems, 
      paymentMethod
    ).catch(err => console.error("Error sending admin notification:", err));

    return NextResponse.json({
      success: true,
      order
    });

  } catch (error) {
    console.error("Checkout order processing error:", error);
    return NextResponse.json({ error: "Failed to process order." }, { status: 500 });
  }
}
