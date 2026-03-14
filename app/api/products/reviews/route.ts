import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/db";

interface CreateReviewRequest {
  productId: string;
  rating: number;
  review?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "You must be logged in to create a review" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateReviewRequest;
    const { productId, rating, review, imageUrl, videoUrl } = body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.rating.findFirst({
      where: {
        userId: sessionUser.sub,
        productId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Create review
    const newReview = await prisma.rating.create({
      data: {
        userId: sessionUser.sub,
        productId,
        rating,
        review: review?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        videoUrl: videoUrl?.trim() || null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      review: {
        id: newReview.id,
        rating: newReview.rating,
        review: newReview.review,
        imageUrl: newReview.imageUrl,
        videoUrl: newReview.videoUrl,
        createdAt: newReview.createdAt.toISOString(),
        user: newReview.user,
      },
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
