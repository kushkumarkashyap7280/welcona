"use client";

import { useRef, useState } from "react";
import { useInView } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  ImageIcon,
  Video,
  ExternalLink,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReviewForm } from "./ReviewForm";
import { cn } from "@/lib/utils";
import { normalizeImageSrc } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReviewItem = {
  id: string;
  rating: number;
  review: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  user: { id: string; fullName: string | null };
};

type ReviewsResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  reviews: ReviewItem[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RATING_LABELS = ["Terrible", "Bad", "Okay", "Good", "Excellent"];

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-6 w-6" : size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(sizeClass, i < Math.round(rating) && "fill-current")}
        />
      ))}
    </div>
  );
}

function VideoEmbed({ url }: { url: string }) {
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  if (youtubeMatch) {
    return (
      <div className="relative aspect-video w-full max-w-sm rounded-xl overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
          className="w-full h-full"
          allowFullScreen
          title="Review video"
        />
      </div>
    );
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return (
      <div className="relative aspect-video w-full max-w-sm rounded-xl overflow-hidden">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          className="w-full h-full"
          allowFullScreen
          title="Review video"
        />
      </div>
    );
  }
  if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
    return (
      <video controls className="w-full max-w-sm rounded-xl bg-muted">
        <source src={url} />
      </video>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
    >
      <Video className="h-4 w-4" />
      View video
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

// ─── Single Review Card ────────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut", delay: Math.min(i * 0.05, 0.3) },
  }),
};

function ReviewCard({
  review,
  index,
  currentUserId,
  onEditRequest,
  onDeleteDone,
}: {
  review: ReviewItem;
  index: number;
  currentUserId?: string;
  onEditRequest: (r: ReviewItem) => void;
  onDeleteDone: () => void;
}) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const isOwner = currentUserId === review.user.id;

  const handleDelete = async () => {
    if (!confirm("Delete your review?")) return;
    const res = await fetch(`/api/products/reviews/${review.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Review deleted");
      onDeleteDone();
    } else {
      toast.error("Failed to delete review");
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      initial="hidden"
      animate="visible"
      className="border border-border/70 rounded-2xl p-5 bg-card hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">
              {(review.user.fullName?.[0] ?? "U").toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-sm">{review.user.fullName ?? "Verified Buyer"}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRow rating={review.rating} size="sm" />
              <span className="text-xs text-muted-foreground">
                {RATING_LABELS[review.rating - 1]}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
          </span>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditRequest(review)}>
                  <Edit className="h-3.5 w-3.5 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Review text */}
      {review.review && (
        <p className="text-sm leading-relaxed text-foreground/80 mb-3">{review.review}</p>
      )}

      {/* Media */}
      <div className="flex flex-wrap gap-3">
        {review.imageUrl && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ImageIcon className="h-3 w-3" /> Photo
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden cursor-pointer border border-border/60 hover:border-primary/50 transition-colors"
              onClick={() => setImagePreview(review.imageUrl)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={normalizeImageSrc(review.imageUrl)}
                alt="Review photo"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          </div>
        )}
        {review.videoUrl && (
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Video className="h-3 w-3" /> Video
            </div>
            <VideoEmbed url={review.videoUrl} />
          </div>
        )}
      </div>

      {/* Image lightbox */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-3xl p-4">
          <DialogHeader>
            <DialogTitle className="text-sm">Review Photo</DialogTitle>
          </DialogHeader>
          {imagePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={normalizeImageSrc(imagePreview)}
              alt="Review photo enlarged"
              className="w-full max-h-[70vh] object-contain rounded-xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Rating Summary Bar ────────────────────────────────────────────────────────

function RatingSummary({
  avgRating,
  reviewCount,
  distribution,
}: {
  avgRating: number;
  reviewCount: number;
  distribution: Record<number, number>;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-border/60">
      {/* Left: big average */}
      <div className="text-center shrink-0">
        <p className="text-5xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
        <StarRow rating={avgRating} size="md" />
        <p className="text-xs text-muted-foreground mt-1">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</p>
      </div>

      {/* Right: distribution bars */}
      <div className="flex-1 w-full space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] ?? 0;
          const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-3 text-right">{star}</span>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-amber-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: (5 - star) * 0.08, ease: "easeOut" }}
                />
              </div>
              <span className="text-muted-foreground w-6">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ReviewsSection ──────────────────────────────────────────────────────

interface ReviewsSectionProps {
  productId: string;
  productName: string;
  avgRating: number;
  reviewCount: number;
  isAuthenticated: boolean;
  hasUserReviewed: boolean;
  currentUserId?: string;
}

export function ReviewsSection({
  productId,
  productName,
  avgRating,
  reviewCount,
  isAuthenticated,
  hasUserReviewed,
  currentUserId,
}: ReviewsSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "0px 0px -60px 0px" });

  const [page, setPage] = useState(1);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery<ReviewsResponse>({
    queryKey: ["product-reviews", productId, page],
    queryFn: async () => {
      const res = await fetch(
        `/api/products/reviews?productId=${productId}&page=${page}&pageSize=5`
      );
      if (!res.ok) throw new Error("Failed to load reviews");
      return res.json();
    },
    enabled: inView,
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const reviews = data?.reviews ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Compute star distribution from loaded reviews
  // (only an approximation from the current page, but good enough for display)
  const distribution: Record<number, number> = Object.fromEntries(
    [1, 2, 3, 4, 5].map((star) => [
      star,
      reviews.filter((r) => r.rating === star).length,
    ])
  );

  const invalidateReviews = () => {
    queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    queryClient.invalidateQueries({ queryKey: ["product-details", productId] });
  };

  return (
    <div ref={sectionRef} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
          {reviewCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {reviewCount} verified review{reviewCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {isAuthenticated && !hasUserReviewed && (
          <Button
            onClick={() => setReviewFormOpen(true)}
            className="rounded-full gap-2"
            size="sm"
          >
            <MessageSquarePlus className="h-4 w-4" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Rating summary */}
      {reviewCount > 0 && (
        <RatingSummary
          avgRating={avgRating}
          reviewCount={reviewCount}
          distribution={distribution}
        />
      )}

      {/* Review list */}
      {!inView ? (
        // Placeholder before scroll triggers load
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-14 border-2 border-dashed border-border/60 rounded-2xl">
          <Star className="h-10 w-10 text-muted-foreground/25 mx-auto mb-3" />
          <p className="font-semibold text-base">No reviews yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Be the first to share your experience
          </p>
          {isAuthenticated && !hasUserReviewed && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-full gap-2"
              onClick={() => setReviewFormOpen(true)}
            >
              <MessageSquarePlus className="h-4 w-4" />
              Write a Review
            </Button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {reviews.map((review, i) => (
              <ReviewCard
                key={review.id}
                review={review}
                index={i}
                currentUserId={currentUserId}
                onEditRequest={setEditingReview}
                onDeleteDone={invalidateReviews}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="rounded-full"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              disabled={isFetching}
              className={cn(
                "h-8 w-8 rounded-full text-sm font-medium transition-all",
                p === page
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {p}
            </button>
          ))}

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isFetching}
            className="rounded-full"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          {isFetching && (
            <span className="text-xs text-muted-foreground">Loading…</span>
          )}
        </div>
      )}

      {/* Write Review dialog */}
      <ReviewForm
        productId={productId}
        productName={productName}
        open={reviewFormOpen}
        onOpenChange={setReviewFormOpen}
        onReviewSubmitted={() => {
          setReviewFormOpen(false);
          invalidateReviews();
        }}
      />

      {/* Edit Review dialog */}
      {editingReview && (
        <ReviewForm
          productId={productId}
          productName={productName}
          open={!!editingReview}
          onOpenChange={(open) => !open && setEditingReview(null)}
          onReviewSubmitted={() => {
            setEditingReview(null);
            invalidateReviews();
          }}
          initialData={editingReview}
        />
      )}
    </div>
  );
}
