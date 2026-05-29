import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { sendPaymentSuccessEmail, sendAdminOrderNotificationEmail, OrderItemForEmail } from "@/lib/email";

// Delivery charge map
const DELIVERY_CHARGES: Record<string, number> = {
  CUSTOMER_PICKUP: 0,
  DELHI: 150,
  OUTSIDE_DELHI: 250,
};

// POST /api/checkout — Place guest order (Online payment only via Razorpay)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      shippingAddress, 
      cartItems,
      deliveryOption,
      // Online payment credentials
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = body;

    // 1. Basic validation
    if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "Missing required order information." }, { status: 400 });
    }

    // 2. Validate delivery option
    if (!deliveryOption || !["CUSTOMER_PICKUP", "DELHI", "OUTSIDE_DELHI"].includes(deliveryOption)) {
      return NextResponse.json({ error: "Invalid delivery option." }, { status: 400 });
    }

    // 3. Signature verification for Online payments
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

    // 4. Retrieve database products and calculate totals securely
    let itemsTotal = 0;
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

      itemsTotal += price * item.quantity;

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

    // 5. Calculate delivery charge and grand total
    const deliveryCharge = DELIVERY_CHARGES[deliveryOption] ?? 0;
    const total = itemsTotal + deliveryCharge;

    // 6. Create order and deduct stock in a single transaction
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
          paymentMethod: "ONLINE",
          paymentStatus: "COMPLETED",
          status: "CONFIRMED",
          deliveryOption,
          deliveryCharge,
          razorpayOrderId,
          razorpayPaymentId,
          orderItems: {
            create: orderItemsToCreate
          }
        }
      });
    });

    // 7. Send Resend transactional emails asynchronously
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@welcona.com";
    
    // Email to customer
    sendPaymentSuccessEmail(customerEmail, order.id, itemsTotal, deliveryCharge, deliveryOption, emailItems)
      .catch(err => console.error("Error sending customer email:", err));

    // Email to admin
    sendAdminOrderNotificationEmail(
      adminEmail, 
      customerName, 
      customerEmail, 
      customerPhone, 
      shippingAddress, 
      order.id, 
      itemsTotal,
      deliveryCharge,
      deliveryOption,
      emailItems
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
