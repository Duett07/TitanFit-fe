import http from "@/lib/http";
import { ApiResponse, PageResponse } from "@/types/api.type";
import {
  CreateReviewRequest,
  ProductReviewSummaryDto,
  ReviewDto,
  ReviewEligibilityDto,
} from "@/types/review.type";

export const reviewApiRequest = {
  getProductReviews: (productId: string, params?: { page?: number; size?: number }) =>
    http.get<ApiResponse<ProductReviewSummaryDto>>(`/api/reviews/product/${productId}`, {
      params,
    }),

  getProductReviewsBySlug: (slug: string, params?: { page?: number; size?: number }) =>
    http.get<ApiResponse<ProductReviewSummaryDto>>(`/api/reviews/product/slug/${slug}`, {
      params,
    }),

  checkEligibility: (productId: string) =>
    http.get<ApiResponse<ReviewEligibilityDto>>(`/api/reviews/eligibility/${productId}`),

  createReview: (body: CreateReviewRequest) =>
    http.post<ApiResponse<ReviewDto>>("/api/reviews", body),

  getMyReviewedProductIds: () =>
    http.get<ApiResponse<string[]>>("/api/reviews/my-reviewed-product-ids"),

  getMyReviews: (params?: { page?: number; size?: number }) =>
    http.get<ApiResponse<PageResponse<ReviewDto>>>("/api/reviews/my-reviews", {
      params,
    }),
};

export default reviewApiRequest;
