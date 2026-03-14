"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Star, Edit, Trash, ImageIcon, Video, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductImage } from "@/components/ui/product-image";
import { ReviewForm } from "./ReviewForm";

interface Review {
  id: string;
  rating: number;
  review: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string | null;
  };
}

interface ReviewsDisplayProps {
  reviews: Review[];
  productId: string;
  productName: string;
  currentUserId?: string;
  onReviewUpdate?: () => void;
}

export function ReviewsDisplay({
  reviews,
  productId,
  productName,
  currentUserId,
  onReviewUpdate,
}: ReviewsDisplayProps) {
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete your review?")) return;

    try {
      const response = await fetch(`/api/products/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete review");
      }

      toast.success("Review deleted successfully");
      onReviewUpdate?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete review"
      );
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderVideoEmbed = (videoUrl: string) => {
    // YouTube
    const youtubeMatch = videoUrl.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (youtubeMatch) {
      return (
        <div className="relative w-full h-48 rounded-lg overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
            className="w-full h-full"
            allowFullScreen
            title="Review video"
          />
        </div>
      );
    }

    // Vimeo
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return (
        <div className="relative w-full h-48 rounded-lg overflow-hidden">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
            className="w-full h-full"
            allowFullScreen
            title="Review video"
          />
        </div>
      );
    }

    // Direct video link
    if (videoUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
      return (
        <video
          controls
          className="w-full h-48 rounded-lg bg-muted object-cover"
        >
          <source src={videoUrl} />
          Your browser does not support the video tag.
        </video>
      );
    }

    // Fallback - show as link
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
      >
        <Video className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm">View Video</span>
        <ExternalLink className="w-4 h-4 text-muted-foreground" />
      </a>
    );
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
        <p className="text-muted-foreground">
          Be the first to share your experience with this product!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => {
        const isOwner = currentUserId === review.user.id;

        return (
          <Card key={review.id} className="relative">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {(review.user.fullName?.[0] || "U").toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{review.user.fullName || "Verified Reviewer"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingReview(review)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Review
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-destructive"
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete Review
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Review Text */}
              {review.review && (
                <p className="text-sm leading-relaxed mb-4">
                  {review.review}
                </p>
              )}

              {/* Media Attachments */}
              <div className="space-y-4">
                {/* Image Attachment */}
                {review.imageUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ImageIcon className="w-4 h-4" />
                      <span>Review Photo</span>
                    </div>
                    <div
                      className="relative w-full sm:w-64 h-48 rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => setImagePreview(review.imageUrl)}
                    >
                      <ProductImage
                        src={review.imageUrl}
                        alt="Review image"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        fallbackSize="md"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-sm">
                          Click to enlarge
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Attachment */}
                {review.videoUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Video className="w-4 h-4" />
                      <span>Review Video</span>
                    </div>
                    {renderVideoEmbed(review.videoUrl)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Edit Review Dialog */}
      {editingReview && (
        <ReviewForm
          productId={productId}
          productName={productName}
          open={!!editingReview}
          onOpenChange={(open) => {
            if (!open) {
              setEditingReview(null);
            }
          }}
          onReviewSubmitted={() => {
            setEditingReview(null);
            onReviewUpdate?.();
          }}
          initialData={editingReview}
        />
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Review Photo</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            {imagePreview && (
              <ProductImage
                src={imagePreview}
                alt="Review image full size"
                className="w-full max-h-[70vh] object-contain rounded-lg"
                fallbackSize="lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}