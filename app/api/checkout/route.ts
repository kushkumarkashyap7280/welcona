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

    // 4. ATOMIC: Validate stock, calculate totals, deduct stock, and create order — all inside a single transaction
    //    This uses raw SQL SELECT ... FOR UPDATE to lock the product rows, preventing race conditions
    //    where two concurrent orders could both see sufficient stock and double-sell.
    const result = await prisma.$transaction(async (tx) => {
      const stockIssues: { name: string; requested: number; available: number }[] = [];
      let itemsTotal = 0;
      const orderItemsToCreate: { productId: string; quantity: number; price: number }[] = [];
      const emailItems: OrderItemForEmail[] = [];

      // Lock and validate each product row atomically
      for (const item of cartItems) {
        // Use raw SQL with FOR UPDATE to acquire row-level lock
        const lockedProducts = await tx.$queryRaw<
          { id: string; name: string; quantity: number; "retailPrice": number; discount: number | null; "wholesalePrice": number | null; "wholesaleMinQuantity": number | null }[]
        >`
          SELECT id, name, quantity, "retailPrice", discount, "wholesalePrice", "wholesaleMinQuantity"
          FROM "Product"
          WHERE id = ${item.productId}
          FOR UPDATE
        `;

        if (lockedProducts.length === 0) {
          throw new Error(`Product with ID ${item.productId} not found.`);
        }

        const product = lockedProducts[0];

        // Check stock with lock held — no other transaction can modify this row
        if (product.quantity < item.quantity) {
          stockIssues.push({
            name: product.name,
            requested: item.quantity,
            available: product.quantity,
          });
          continue;
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

      // If any stock issues exist, abort the entire transaction
      if (stockIssues.length > 0) {
        throw { stockIssues, message: "Stock unavailable" };
      }

      // Calculate delivery charge and grand total
      const deliveryCharge = DELIVERY_CHARGES[deliveryOption] ?? 0;
      const total = itemsTotal + deliveryCharge;

      // Deduct quantities (lock is still held from SELECT FOR UPDATE)
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
      const order = await tx.order.create({
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

      return { order, emailItems, itemsTotal, deliveryCharge };
    });

    // 5. Send Resend transactional emails asynchronously (outside the transaction)
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@welcona.com";
    
    // Email to customer
    sendPaymentSuccessEmail(customerEmail, result.order.id, result.itemsTotal, result.deliveryCharge, deliveryOption, result.emailItems)
      .catch(err => console.error("Error sending customer email:", err));

    // Email to admin
    sendAdminOrderNotificationEmail(
      adminEmail, 
      customerName, 
      customerEmail, 
      customerPhone, 
      shippingAddress, 
      result.order.id, 
      result.itemsTotal,
      result.deliveryCharge,
      deliveryOption,
      result.emailItems
    ).catch(err => console.error("Error sending admin notification:", err));

    return NextResponse.json({
      success: true,
      order: result.order
    });

  } catch (error: any) {
    // Handle stock issues thrown from within the transaction
    if (error?.stockIssues) {
      return NextResponse.json({
        error: "Some products are no longer available in the requested quantity. Your payment was received but the order could not be completed. Please contact support.",
        stockIssues: error.stockIssues,
      }, { status: 409 });
    }

    console.error("Checkout order processing error:", error);
    return NextResponse.json({ error: "Failed to process order." }, { status: 500 });
  }
}
