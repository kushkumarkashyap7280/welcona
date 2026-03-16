"use server";

import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { sendPaymentSuccessEmail } from "@/lib/email";

// ─── Profile ────────────────────────────────────────────────────────────────

export async function getProfileAction() {
  const session = await getSessionUser();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      fullName: true,
      email: true,
      mobile: true,
      avatarUrl: true,
      verified: true,
      createdAt: true,
    },
  });
  return user;
}

export type UpdateProfileInput = {
  fullName?: string;
  mobile?: string;
  avatarUrl?: string;
};

export async function updateProfileAction(
  input: UpdateProfileInput
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSessionUser();
  if (!session) return { error: "Not authenticated." };

  try {
    await prisma.user.update({
      where: { id: session.sub },
      data: {
        fullName: input.fullName ?? undefined,
        mobile: input.mobile ?? undefined,
        avatarUrl: input.avatarUrl ?? undefined,
      },
    });
    revalidatePath("/details");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Failed to update profile. Mobile may already be in use." };
  }
}

// ─── Cart ───────────────────────────────────────────────────────────────────

export async function getCartAction() {
  const session = await getSessionUser();
  if (!session) return null;

  const cart = await prisma.cart.findUnique({
    where: { userId: session.sub },
    include: {
      cartItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              retailPrice: true,
              wholesalePrice: true,
              wholesaleMinQuantity: true,
              discount: true,
              images: true,
              sku: true,
              quantity: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return cart;
}

export async function getCartCountAction(): Promise<number> {
  const session = await getSessionUser();
  if (!session) return 0;

  const cart = await prisma.cart.findUnique({
    where: { userId: session.sub },
    include: {
      cartItems: { select: { quantity: true } },
    },
  });

  if (!cart) return 0;
  return cart.cartItems.reduce((sum, item) => sum + item.quantity, 0);
}

export async function addToCartAction(
  productId: string,
  quantity: number
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSessionUser();
  if (!session || session.role !== "customer") return { error: "Not authenticated." };

  if (!Number.isFinite(quantity) || quantity < 1) {
    return { error: "Quantity must be at least 1." };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    return { error: "Product not found." };
  }

  const cart = await prisma.cart.upsert({
    where: { userId: session.sub },
    create: {
      userId: session.sub,
    },
    update: {},
    select: { id: true },
  });

  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
    },
    select: { id: true, quantity: true },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  }

  revalidatePath("/dashboard/cart");
  return { success: true };
}

export async function updateCartItemAction(
  cartItemId: string,
  quantity: number
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "Not authenticated." };

  if (quantity < 1) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
  } else {
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }
  revalidatePath("/dashboard/cart");
  return {};
}

export async function removeCartItemAction(
  cartItemId: string
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "Not authenticated." };

  await prisma.cartItem.delete({ where: { id: cartItemId } });
  revalidatePath("/dashboard/cart");
  return {};
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export async function getOrdersAction() {
  const session = await getSessionUser();
  if (!session) return [];

  const orders = await prisma.order.findMany({
    where: { userId: session.sub },
    include: {
      orderItems: {
        include: {
          product: { select: { name: true, images: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return orders;
}

export async function getOrderAction(orderId: string) {
  const session = await getSessionUser();
  if (!session) return null;

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.sub },
    include: {
      orderItems: {
        include: {
          product: {
            select: { name: true, images: true, sku: true },
          },
        },
      },
    },
  });
  return order;
}

// ─── Addresses ───────────────────────────────────────────────────────────────

export async function getAddressesAction() {
  const session = await getSessionUser();
  if (!session) return [];

  return prisma.address.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
  });
}

export type AddressInput = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export async function createAddressAction(
  input: AddressInput
): Promise<{ error?: string; address?: { id: string } }> {
  const session = await getSessionUser();
  if (!session) return { error: "Not authenticated." };

  const address = await prisma.address.create({
    data: {
      userId: session.sub,
      line1: input.line1,
      line2: input.line2 || null,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
    },
    select: { id: true },
  });

  return { address };
}

// ─── Checkout / Place Order ─────────────────────────────────────────────────

export type PlaceOrderInput = {
  addressId: string;
  paymentMethod: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
};

export async function placeOrderAction(
  input: PlaceOrderInput
): Promise<{ error?: string; orderId?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "Not authenticated." };

  // Get user's cart
  const cart = await prisma.cart.findUnique({
    where: { userId: session.sub },
    include: {
      cartItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
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
    return { error: "Your cart is empty." };
  }

  // Validate address
  const address = await prisma.address.findFirst({
    where: { id: input.addressId, userId: session.sub },
  });

  if (!address) {
    return { error: "Address not found." };
  }

  // Calculate totals with wholesale pricing logic
  let total = 0;
  const orderItemsData: { productId: string; quantity: number; price: number }[] = [];

  for (const item of cart.cartItems) {
    const product = item.product;

    // Check stock
    if (item.quantity > product.quantity) {
      return {
        error: `Not enough stock for "${product.name}". Available: ${product.quantity}`,
      };
    }

    // Determine unit price: wholesale if quantity meets minimum, else retail
    let unitPrice = product.retailPrice;
    if (item.quantity >= product.wholesaleMinQuantity) {
      unitPrice = product.wholesalePrice;
    }

    // Apply discount if available
    if (product.discount) {
      unitPrice = unitPrice * (1 - product.discount / 100);
    }

    const lineTotal = unitPrice * item.quantity;
    total += lineTotal;

    orderItemsData.push({
      productId: product.id,
      quantity: item.quantity,
      price: unitPrice,
    });
  }

  // Determine payment status based on method
  const isCOD = input.paymentMethod === "CASH_ON_DELIVERY";
  const paymentStatus = isCOD ? "PENDING" : "COMPLETED";

  // Create order, decrement stock, and clear cart in a single transaction
  let order: { id: string };
  try {
    order = await prisma.$transaction(async (tx) => {
      // Re-check stock inside the transaction to prevent race conditions
      for (const item of cart.cartItems) {
        const fresh = await tx.product.findUnique({
          where: { id: item.product.id },
          select: { quantity: true, name: true },
        });
        if (!fresh || item.quantity > fresh.quantity) {
          throw new Error(
            `Not enough stock for "${fresh?.name ?? item.product.name}". Available: ${fresh?.quantity ?? 0}`
          );
        }
      }

      const created = await tx.order.create({
        data: {
          userId: session.sub,
          total: Math.round(total * 100) / 100,
          paymentMethod: input.paymentMethod as any,
          paymentStatus: paymentStatus as any,
          status: "PENDING",
          addressId: address.id,
          shippingAddress: {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
          },
          razorpayOrderId: input.razorpayOrderId || null,
          razorpayPaymentId: input.razorpayPaymentId || null,
          orderItems: {
            create: orderItemsData,
          },
        },
        select: { id: true },
      });

      // Decrement stock
      for (const item of cart.cartItems) {
        await tx.product.update({
          where: { id: item.product.id },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });
  } catch (err: any) {
    return { error: err?.message ?? "Failed to place order. Please try again." };
  }

  // Attempt to send email async in background without failing order
  const emailToSend = session.email;
  const shortItems = orderItemsData.map((d) => {
    const p = cart.cartItems.find((c) => c.product.id === d.productId);
    return {
      name: p?.product.name ?? "Product",
      quantity: d.quantity,
      price: d.price
    };
  });
  
  if (emailToSend && paymentStatus === "COMPLETED") {
    // Send email asynchronously
    Promise.resolve().then(() => {
      sendPaymentSuccessEmail(emailToSend, order.id, Math.round(total * 100) / 100, shortItems)
        .catch(e => console.error("Failed sending order email in background", e));
    });
  }

  revalidatePath("/dashboard/cart");
  revalidatePath("/dashboard/orders");

  return { orderId: order.id };
}
