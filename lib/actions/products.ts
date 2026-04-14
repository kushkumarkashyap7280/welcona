"use server";

import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase";
import {
  getSupabaseStorageBucket,
  isSupabaseStoragePath,
  normalizeImageValueForStorage,
} from "@/lib/utils";

type ProductImageInput = {
  image?: string;
  detail?: string | null;
  isPrimary?: boolean;
  index?: number;
};

type ProductActionInput = {
  name: string;
  sku: string;
  categoryId: string;
  quantity: number | string;
  retailPrice: number | string;
  wholesalePrice: number | string;
  wholesaleMinQuantity: number | string;
  discount?: number | string | null;
  description?: string | null;
  warranty?: string | null;
  finish?: string | null;
  material?: string | null;
  tags?: string[];
  images?: ProductImageInput[];
};

function isPrismaKnownError(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

function normalizeProductPayload(data: ProductActionInput) {
  const images = (Array.isArray(data.images) ? data.images : [])
    .map((image: ProductImageInput, index: number) => ({
      image: normalizeImageValueForStorage(image.image ?? ""),
      detail: image.detail?.trim() || null,
      isPrimary: Boolean(image.isPrimary),
      index: Number.isFinite(image.index) ? Number(image.index) : index,
    }))
    .filter((image) => image.image.length > 0)
    .sort((left, right) => left.index - right.index)
    .map((image, index) => ({
      ...image,
      index,
    }));

  if (images.length > 0 && !images.some((image) => image.isPrimary)) {
    images[0].isPrimary = true;
  }

  return {
    name: String(data.name ?? "").trim(),
    sku: String(data.sku ?? "").trim(),
    categoryId: String(data.categoryId ?? "").trim(),
    quantity: Number(data.quantity),
    retailPrice: Number(data.retailPrice),
    wholesalePrice: Number(data.wholesalePrice),
    wholesaleMinQuantity: Number(data.wholesaleMinQuantity),
    discount:
      data.discount === "" || data.discount === null || data.discount === undefined
        ? null
        : Number(data.discount),
    description: data.description?.trim() || null,
    warranty: data.warranty?.trim() || null,
    finish: data.finish?.trim() || null,
    material: data.material?.trim() || null,
    tags: (Array.isArray(data.tags) ? data.tags : [])
      .map((tag: string) => tag.trim())
      .filter(Boolean),
    images,
  };
}

function extractStoragePaths(values: string[]) {
  return [...new Set(values.filter((value) => isSupabaseStoragePath(value)))];
}

async function removeProductImageFiles(paths: string[]) {
  const filesToDelete = extractStoragePaths(paths);
  if (filesToDelete.length === 0) {
    return;
  }

  try {
    const bucket = getSupabaseStorageBucket();
    const supabase = createSupabaseServiceClient();
    await supabase.storage.from(bucket).remove(filesToDelete);
  } catch (error) {
    console.error("Failed to remove product image files:", error);
  }
}

async function requireAdmin() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createProductAction(data: ProductActionInput) {
  await requireAdmin();
  try {
    const payload = normalizeProductPayload(data);

    const product = await prisma.product.create({
      data: {
        name: payload.name,
        sku: payload.sku,
        categoryId: payload.categoryId,
        quantity: payload.quantity,
        retailPrice: payload.retailPrice,
        wholesalePrice: payload.wholesalePrice,
        wholesaleMinQuantity: payload.wholesaleMinQuantity,
        discount: payload.discount,
        description: payload.description,
        warranty: payload.warranty,
        finish: payload.finish,
        material: payload.material,
        tags: payload.tags,
        images: {
          create: payload.images,
        },
      },
    });
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { product };
  } catch (error: unknown) {
    if (isPrismaKnownError(error) && error.code === "P2002") return { error: "SKU must be unique." };
    return { error: "Failed to create product." };
  }
}

export async function updateProductAction(id: string, data: ProductActionInput) {
  await requireAdmin();
  try {
    const payload = normalizeProductPayload(data);
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: {
        images: {
          select: { image: true },
        },
      },
    });

    const existingPaths = new Set((existingProduct?.images ?? []).map((item) => item.image));
    const nextPaths = new Set(payload.images.map((item) => item.image));
    const removedPaths = [...existingPaths].filter((path) => !nextPaths.has(path));

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: payload.name,
        sku: payload.sku,
        categoryId: payload.categoryId,
        quantity: payload.quantity,
        retailPrice: payload.retailPrice,
        wholesalePrice: payload.wholesalePrice,
        wholesaleMinQuantity: payload.wholesaleMinQuantity,
        discount: payload.discount,
        description: payload.description,
        warranty: payload.warranty,
        finish: payload.finish,
        material: payload.material,
        tags: payload.tags,
        images: {
          deleteMany: {},
          create: payload.images,
        },
      },
    });

    await removeProductImageFiles(removedPaths);

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    return { product };
  } catch (error: unknown) {
    if (isPrismaKnownError(error) && error.code === "P2002") return { error: "SKU must be unique." };
    return { error: "Failed to update product." };
  }
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: {
        images: {
          select: { image: true },
        },
      },
    });

    const paths = (existingProduct?.images ?? []).map((item) => item.image);

    await prisma.product.delete({ where: { id } });
    await removeProductImageFiles(paths);

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    return { success: true };
  } catch {
    return { error: "Failed to delete product." };
  }
}
