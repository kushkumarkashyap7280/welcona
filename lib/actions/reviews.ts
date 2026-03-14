"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function createReviewAction(payload: {
  productId: string;
  rating: number;
  review?: string;
  imageUrl?: string;
  videoUrl?: string;
}) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return { error: "You must be logged in to leave a review" };
    }

    // Validate rating is between 1 and 5
    if (payload.rating < 1 || payload.rating > 5) {
      return { error: "Rating must be between 1 and 5" };
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.rating.findFirst({
      where: {
        userId: sessionUser.sub,
        productId: payload.productId,
      },
    });

    if (existingReview) {
      return { error: "You have already reviewed this product" };
    }

    // Verify the product exists
    const product = await prisma.product.findUnique({
      where: { id: payload.productId },
      select: { id: true, name: true },
    });

    if (!product) {
      return { error: "Product not found" };
    }

    // Create the review
    await prisma.rating.create({
      data: {
        userId: sessionUser.sub,
        productId: payload.productId,
        rating: payload.rating,
        review: payload.review?.trim() || null,
        imageUrl: payload.imageUrl?.trim() || null,
        videoUrl: payload.videoUrl?.trim() || null,
      },
    });

    revalidatePath(`/products/${payload.productId}`);
    revalidatePath("/products");
    revalidatePath("/admin/products");

    return { success: true };
  } catch (error) {
    console.error("Error creating review:", error);
    return { error: "Failed to create review" };
  }
}

export async function updateReviewAction(
  reviewId: string,
  payload: {
    rating: number;
    review?: string;
    imageUrl?: string;
    videoUrl?: string;
  }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return { error: "You must be logged in to update a review" };
    }

    // Validate rating is between 1 and 5
    if (payload.rating < 1 || payload.rating > 5) {
      return { error: "Rating must be between 1 and 5" };
    }

    // Check if the review exists and belongs to the user
    const existingReview = await prisma.rating.findFirst({
      where: {
        id: reviewId,
        userId: sessionUser.sub,
      },
      select: { id: true, productId: true },
    });

    if (!existingReview) {
      return { error: "Review not found or you don't have permission to edit it" };
    }

    // Update the review
    await prisma.rating.update({
      where: { id: reviewId },
      data: {
        rating: payload.rating,
        review: payload.review?.trim() || null,
        imageUrl: payload.imageUrl?.trim() || null,
        videoUrl: payload.videoUrl?.trim() || null,
      },
    });

    revalidatePath(`/products/${existingReview.productId}`);
    revalidatePath("/products");

    return { success: true };
  } catch (error) {
    console.error("Error updating review:", error);
    return { error: "Failed to update review" };
  }
}

export async function deleteReviewAction(reviewId: string) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return { error: "You must be logged in to delete a review" };
    }

    // Check if the review exists and belongs to the user
    const existingReview = await prisma.rating.findFirst({
      where: {
        id: reviewId,
        userId: sessionUser.sub,
      },
      select: { id: true, productId: true },
    });

    if (!existingReview) {
      return { error: "Review not found or you don't have permission to delete it" };
    }

    // Delete the review
    await prisma.rating.delete({
      where: { id: reviewId },
    });

    revalidatePath(`/products/${existingReview.productId}`);
    revalidatePath("/products");

    return { success: true };
  } catch (error) {
    console.error("Error deleting review:", error);
    return { error: "Failed to delete review" };
  }
}