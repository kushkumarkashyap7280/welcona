import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/db";

interface UpdateReviewRequest {
  rating: number;
  review?: string;
  imageUrl?: string;
  videoUrl?: string;
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "You must be logged in to update a review" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = (await request.json()) as UpdateReviewRequest;
    const { rating, review, imageUrl, videoUrl } = body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check ownership
    const existingReview = await prisma.rating.findFirst({
      where: {
        id,
        userId: sessionUser.sub,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found or you don't have permission to edit it" },
        { status: 404 }
      );
    }

    // Update review
    const updatedReview = await prisma.rating.update({
      where: { id },
      data: {
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
        id: updatedReview.id,
        rating: updatedReview.rating,
        review: updatedReview.review,
        imageUrl: updatedReview.imageUrl,
        videoUrl: updatedReview.videoUrl,
        createdAt: updatedReview.createdAt.toISOString(),
        user: updatedReview.user,
      },
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "You must be logged in to delete a review" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Check ownership
    const existingReview = await prisma.rating.findFirst({
      where: {
        id,
        userId: sessionUser.sub,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    // Delete review
    await prisma.rating.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
