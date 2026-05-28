"use server";

export async function createReviewAction(_payload: {
  productId: string;
  rating: number;
  review?: string;
  imageUrl?: string;
  videoUrl?: string;
}) {
  return { error: "Review system is decommissioned." };
}

export async function updateReviewAction(
  _reviewId: string,
  _payload: {
    rating: number;
    review?: string;
    imageUrl?: string;
    videoUrl?: string;
  }
) {
  return { error: "Review system is decommissioned." };
}

export async function deleteReviewAction(_reviewId: string) {
  return { error: "Review system is decommissioned." };
}