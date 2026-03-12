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

export async function createCategoryAction(data: { name: string; description?: string; image?: string }) {
  await requireAdmin();
  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
      },
    });
    revalidatePath("/admin/categories");
    return { category };
  } catch (error) {
    return { error: "Failed to create category." };
  }
}

export async function updateCategoryAction(id: string, data: { name: string; description?: string; image?: string }) {
  await requireAdmin();
  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
      },
    });
    revalidatePath("/admin/categories");
    return { category };
  } catch (error) {
    return { error: "Failed to update category." };
  }
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete category. Ensure no products depend on it." };
  }
}
