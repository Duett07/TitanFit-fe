import { PageResponse } from "./api.type";

export interface ReviewDto {
  id: string;
  productId: string;
  productName?: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  comment?: string;
}

export interface ReviewEligibilityDto {
  eligible: boolean;
  hasPurchased: boolean;
  alreadyReviewed: boolean;
  userReview?: ReviewDto | null;
  message: string;
}

export interface ProductReviewSummaryDto {
  averageRating: number;
  totalReviews: number;
  reviews: PageResponse<ReviewDto>;
}
