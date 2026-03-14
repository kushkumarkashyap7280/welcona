"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Star, X, ImageIcon, Video, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProductImage } from "@/components/ui/product-image";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().max(1000, "Review must be less than 1000 characters").optional(),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  videoUrl: z.string().url("Invalid video URL").optional().or(z.literal("")),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewSubmitted?: () => void;
  initialData?: {
    id: string;
    rating: number;
    review: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
  };
}

export function ReviewForm({
  productId,
  productName,
  open,
  onOpenChange,
  onReviewSubmitted,
  initialData,
}: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: initialData?.rating || 0,
      review: initialData?.review || "",
      imageUrl: initialData?.imageUrl || "",
      videoUrl: initialData?.videoUrl || "",
    },
  });

  const watchedRating = form.watch("rating");
  const watchedImageUrl = form.watch("imageUrl");
  const watchedVideoUrl = form.watch("videoUrl");

  const onSubmit = async (data: ReviewFormValues) => {
    setIsSubmitting(true);
    try {
      if (data.rating === 0) {
        toast.error("Please select a rating");
        return;
      }

      let result;

      if (initialData) {
        // Update review via API
        const response = await fetch(
          `/api/products/reviews/${initialData.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update review");
        }

        result = await response.json();
        toast.success("Review updated successfully!");
      } else {
        // Create review via API
        const response = await fetch("/api/products/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, ...data }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create review");
        }

        result = await response.json();
        toast.success("Review submitted successfully! Thank you for your feedback.");
      }

      onOpenChange(false);
      form.reset();
      onReviewSubmitted?.(); // Trigger refetch via TanStack Query
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const setRating = (rating: number) => {
    form.setValue("rating", rating);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Update Your Review" : "Write a Review"}
          </DialogTitle>
          <DialogDescription>
            Share your experience with <span className="font-medium">{productName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
          {/* Rating Section */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className="p-1 transition-colors hover:bg-muted rounded"
                  onClick={() => setRating(rating)}
                  onMouseEnter={() => setHoveredRating(rating)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      rating <= (hoveredRating || watchedRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {watchedRating > 0 && (
                  <>
                    {watchedRating} out of 5 stars
                  </>
                )}
              </span>
            </div>
            {form.formState.errors.rating && (
              <p className="text-sm text-destructive">
                {form.formState.errors.rating.message}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review">Your Review (Optional)</Label>
            <Textarea
              id="review"
              {...form.register("review")}
              placeholder="Tell others about your experience with this product. What did you like or dislike? How did you use it?"
              rows={4}
              maxLength={1000}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Be honest and helpful to other customers</span>
              <span>{(form.watch("review") || "").length}/1000</span>
            </div>
            {form.formState.errors.review && (
              <p className="text-sm text-destructive">
                {form.formState.errors.review.message}
              </p>
            )}
          </div>

          {/* Media Attachments */}
          <div className="space-y-4">
            <Label>Add Media (Optional)</Label>

            {/* Image Upload */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Add Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Input
                    {...form.register("imageUrl")}
                    placeholder="https://example.com/your-image.jpg"
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste a link to your image (JPG, PNG, GIF supported)
                  </p>
                </div>

                {watchedImageUrl && (
                  <div className="relative">
                    <ProductImage
                      src={watchedImageUrl}
                      alt="Review image preview"
                      className="w-full h-32 object-cover rounded-md border"
                      fallbackSize="md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => form.setValue("imageUrl", "")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {form.formState.errors.imageUrl && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.imageUrl.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Video Upload */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Add Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Input
                    {...form.register("videoUrl")}
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste a YouTube, Vimeo, or direct video link to show your experience
                  </p>
                </div>

                {watchedVideoUrl && (
                  <div className="relative">
                    <div className="w-full h-32 bg-muted rounded-md border flex items-center justify-center">
                      <div className="text-center">
                        <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Video: {watchedVideoUrl}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => form.setValue("videoUrl", "")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {form.formState.errors.videoUrl && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.videoUrl.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || watchedRating === 0}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initialData ? "Update Review" : "Submit Review"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}