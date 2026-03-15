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

// GET /api/products/reviews?productId=xxx&page=1&pageSize=5
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? "5"), 1), 20);

    const [total, reviews] = await Promise.all([
      prisma.rating.count({ where: { productId } }),
      prisma.rating.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    return NextResponse.json({
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      hasMore: page * pageSize < total,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        review: r.review,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imageUrl: (r as any).imageUrl ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videoUrl: (r as any).videoUrl ?? null,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
      })),
    });
  } catch (error) {
    console.error("GET /api/products/reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
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

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const existingReview = await prisma.rating.findFirst({
      where: { userId: sessionUser.sub, productId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

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
        user: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({
      success: true,
      review: {
        id: newReview.id,
        rating: newReview.rating,
        review: newReview.review,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imageUrl: (newReview as any).imageUrl ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videoUrl: (newReview as any).videoUrl ?? null,
        createdAt: newReview.createdAt.toISOString(),
        user: newReview.user,
      },
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
