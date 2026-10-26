"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  MessageSquare,
  Lock,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
} from "lucide-react";
import StarRating from "./StarRating";
import ReviewModal from "./ReviewModal";
import reviewApiRequest from "@/apiRequest/review";
import {
  ProductReviewSummaryDto,
  ReviewDto,
  ReviewEligibilityDto,
} from "@/types/review.type";
import { useAuthStore } from "@/stores/useAuthStore";
import { Toast } from "@/components/ui";

interface ProductReviewsSectionProps {
  productId?: string;
  productSlug: string;
  productName: string;
}

export default function ProductReviewsSection({
  productId,
  productSlug,
  productName,
}: ProductReviewsSectionProps) {
  const { isAuthenticated } = useAuthStore();

  const [reviewSummary, setReviewSummary] = useState<ProductReviewSummaryDto | null>(null);
  const [eligibility, setEligibility] = useState<ReviewEligibilityDto | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load reviews by slug
  const loadReviews = useCallback(
    async (page = 0) => {
      try {
        const res = await reviewApiRequest.getProductReviewsBySlug(productSlug, {
          page,
          size: 5,
        });
        if (res.data?.data) {
          setReviewSummary(res.data.data);
          setCurrentPage(page);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Could not load product reviews:", err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [productSlug]
  );

  // Load eligibility if user is authenticated and productId is known
  const effectiveProductId = productId || reviewSummary?.reviews?.content?.[0]?.productId;

  const loadEligibility = useCallback(async () => {
    if (!isAuthenticated || !effectiveProductId) {
      setEligibility(null);
      return;
    }
    try {
      const res = await reviewApiRequest.checkEligibility(effectiveProductId);
      if (res.data?.data) {
        setEligibility(res.data.data);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Could not check review eligibility:", err);
      }
    }
  }, [isAuthenticated, effectiveProductId]);

  useEffect(() => {
    void loadReviews(0);
  }, [loadReviews]);

  useEffect(() => {
    void loadEligibility();
  }, [loadEligibility]);

  const handleReviewSuccess = (newReview: ReviewDto) => {
    setToastMessage("Cảm ơn bạn! Đánh giá của bạn đã được ghi nhận thành công.");
    void loadReviews(0);
    void loadEligibility();
  };

  const reviewsList = reviewSummary?.reviews?.content || [];
  const totalReviews = reviewSummary?.totalReviews || 0;
  const averageRating = reviewSummary?.averageRating || 5.0;
  const totalPages = reviewSummary?.reviews?.totalPages || 0;

  // Star breakdown calculation
  const starBreakdown = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsList.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating] = (counts[r.rating] || 0) + 1;
      }
    });
    return counts;
  }, [reviewsList]);

  return (
    <section id="reviews-section" className="mt-14 pt-10 border-t border-border">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Đánh Giá & Nhận Xét</span>
          </div>
          <h2 className="text-2xl font-extrabold font-heading text-foreground">
            Phản Hồi Từ Người Mua Hàng
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Đánh giá thực tế từ các vận động viên và khách hàng đã hoàn tất mua hàng tại TITANFIT
          </p>
        </div>

        {/* Action Button: Review Trigger */}
        {eligibility?.eligible && effectiveProductId && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/25 cursor-pointer shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Viết Đánh Giá Của Bạn</span>
          </button>
        )}
      </div>

      {/* Grid: Rating Summary & Eligibility Notice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
        {/* Rating Summary Card (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-5 pb-5 border-b border-border/70">
            <div className="text-center">
              <span className="text-4xl sm:text-5xl font-black font-heading text-foreground block">
                {averageRating.toFixed(1)}
              </span>
              <div className="mt-1">
                <StarRating rating={Math.round(averageRating)} size="sm" />
              </div>
              <span className="text-2xs text-muted-foreground mt-1 block">
                {totalReviews} đánh giá
              </span>
            </div>

            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = starBreakdown[star] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-2xs">
                    <span className="w-3 font-semibold text-foreground">{star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>100% đánh giá từ khách hàng đã mua và nhận hàng thành công</span>
          </div>
        </div>

        {/* Eligibility Status Banner (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-center">
          {!isAuthenticated ? (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-foreground">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span>Bạn muốn gửi đánh giá cho sản phẩm này?</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Để đảm bảo tính khách quan và trung thực, hệ thống TITANFIT chỉ mở tính năng đánh giá cho khách hàng đã đăng nhập và có đơn hàng mua sản phẩm này ở trạng thái giao thành công.
              </p>
              <div className="pt-1">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 border border-border transition-all"
                >
                  <span>Đăng Nhập Để Kiểm Tra</span>
                </Link>
              </div>
            </div>
          ) : eligibility?.alreadyReviewed ? (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold w-fit">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bạn đã đánh giá sản phẩm này</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cảm ơn bạn đã đóng góp phản hồi trải nghiệm quý báu cho cộng đồng TITANFIT!
              </p>
              {eligibility.userReview && (
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <StarRating rating={eligibility.userReview.rating} size="sm" />
                    <span className="text-2xs text-muted-foreground font-mono">
                      {new Date(eligibility.userReview.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  {eligibility.userReview.comment && (
                    <p className="text-xs text-foreground italic leading-relaxed">
                      &ldquo;{eligibility.userReview.comment}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : eligibility?.eligible ? (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold w-fit">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đủ điều kiện đánh giá</span>
              </div>
              <h3 className="text-sm font-bold text-foreground">
                Bạn đã hoàn tất mua sản phẩm này!
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chia sẻ cảm nhận về kích cỡ, chất lượng chất liệu hoặc hiệu quả của sản phẩm để nhận ưu đãi và giúp đỡ các hội viên TitanFit khác lựa chọn dễ dàng hơn.
              </p>
              {effectiveProductId && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Viết Đánh Giá Ngay</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span>Quy định đánh giá sản phẩm</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {eligibility?.message ||
                  "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua hàng và đơn hàng được giao thành công (COMPLETED). Nếu bạn vừa đặt hàng, vui lòng quay lại đánh giá sau khi đã nhận được kiện hàng!"}
              </p>
              <div className="pt-1">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <span>Xem Lịch Sử Đơn Hàng Của Bạn</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-border bg-card animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-secondary rounded w-28" />
                    <div className="h-2.5 bg-secondary rounded w-20" />
                  </div>
                </div>
                <div className="h-3 bg-secondary rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : reviewsList.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center bg-card rounded-3xl border border-border p-8">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-3">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-foreground">Chưa có đánh giá nào</h4>
            <p className="text-xs text-muted-foreground max-w-md mt-1 mb-5">
              Hãy là người đầu tiên trải nghiệm và chia sẻ nhận xét thực tế về sản phẩm này sau khi hoàn tất mua hàng!
            </p>
            {eligibility?.eligible && effectiveProductId && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Viết Đánh Giá Đầu Tiên</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reviewsList.map((rev) => {
              const formattedDate = rev.createdAt
                ? new Date(rev.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "";

              const initial = (rev.userName || "U").charAt(0).toUpperCase();

              return (
                <div
                  key={rev.id}
                  className="p-5 sm:p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {initial || <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-foreground">
                            {rev.userName}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-3xs font-semibold border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đã mua hàng</span>
                          </span>
                        </div>
                        <span className="text-2xs text-muted-foreground font-mono">
                          {formattedDate}
                        </span>
                      </div>
                    </div>

                    <StarRating rating={rev.rating} size="sm" />
                  </div>

                  {rev.comment && (
                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line pl-12">
                      {rev.comment}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => loadReviews(currentPage - 1)}
                  disabled={currentPage <= 0}
                  className="p-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-muted-foreground px-3">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => loadReviews(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="p-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Submission Modal */}
      {effectiveProductId && (
        <ReviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productId={effectiveProductId}
          productName={productName}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          text={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}
    </section>
  );
}
