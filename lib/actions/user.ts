"use server";

import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

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
  revalidatePath("/cart");
  return {};
}

export async function removeCartItemAction(
  cartItemId: string
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "Not authenticated." };

  await prisma.cartItem.delete({ where: { id: cartItemId } });
  revalidatePath("/cart");
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
