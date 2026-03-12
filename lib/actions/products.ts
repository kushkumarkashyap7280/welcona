"use server";

import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createProductAction(data: any) {
  await requireAdmin();
  try {
    const product = await prisma.product.create({
      data: {
        ...data,
        retailPrice: Number(data.retailPrice),
        wholesalePrice: Number(data.wholesalePrice),
        quantity: Number(data.quantity),
        wholesaleMinQuantity: Number(data.wholesaleMinQuantity),
      },
    });
    revalidatePath("/admin/products");
    return { product };
  } catch (error: any) {
    if (error.code === 'P2002') return { error: "SKU must be unique." };
    return { error: "Failed to create product." };
  }
}

export async function updateProductAction(id: string, data: any) {
  await requireAdmin();
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        retailPrice: Number(data.retailPrice),
        wholesalePrice: Number(data.wholesalePrice),
        quantity: Number(data.quantity),
        wholesaleMinQuantity: Number(data.wholesaleMinQuantity),
      },
    });
    revalidatePath("/admin/products");
    return { product };
  } catch (error: any) {
    if (error.code === 'P2002') return { error: "SKU must be unique." };
    return { error: "Failed to update product." };
  }
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete product." };
  }
}
