"use client";

import React, { useState } from "react";
import { X, Loader2, Sparkles, AlertCircle } from "lucide-react";
import StarRating from "./StarRating";
import reviewApiRequest from "@/apiRequest/review";
import { ReviewDto } from "@/types/review.type";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  variantName?: string;
  onSuccess?: (newReview: ReviewDto) => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  variantName,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setErrorMsg("Vui lòng chọn số sao đánh giá (từ 1 đến 5 sao)");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await reviewApiRequest.createReview({
        productId,
        rating,
        comment: comment.trim(),
      });

      if (res.data?.data) {
        onSuccess?.(res.data.data);
        onClose();
      }
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string; errors?: Record<string, string> } };
      };
      const message =
        axiosError.response?.data?.message ||
        "Không thể gửi đánh giá. Vui lòng kiểm tra lại điều kiện mua hàng hoặc thử lại sau.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đánh Giá Khách Hàng</span>
          </div>
          <h3
            id="review-modal-title"
            className="text-xl font-extrabold font-heading text-foreground"
          >
            Đánh Giá Sản Phẩm
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {productName} {variantName ? `(${variantName})` : ""}
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star selector */}
          <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 flex flex-col items-center justify-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Chọn mức độ hài lòng của bạn
            </span>
            <StarRating
              rating={rating}
              interactive={!isSubmitting}
              onChange={setRating}
              size="lg"
              showLabel
            />
          </div>

          {/* Comment textarea */}
          <div className="space-y-2">
            <label
              htmlFor="review-comment"
              className="flex items-center justify-between text-xs font-bold text-foreground"
            >
              <span>Nhận xét chi tiết</span>
              <span className="text-muted-foreground font-normal">
                {comment.length}/2000 ký tự
              </span>
            </label>
            <textarea
              id="review-comment"
              rows={4}
              maxLength={2000}
              disabled={isSubmitting}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận về chất lượng sản phẩm, hiệu quả sử dụng, hương vị, đóng gói..."
              className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/25 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Gửi...</span>
                </>
              ) : (
                <span>Gửi Đánh Giá</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
