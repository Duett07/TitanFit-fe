export type { ApiResponse, PageResponse, PaginatedResponse } from "./api.type";
import type { ApiResponse, PageResponse } from "./api.type";
import { CategoryDto } from "./category.type";

export interface VariantDto {
  id: string;
  sku: string;
  variantName: string;
  price: number;
  stockQuantity: number;
  stock?: number;
  imageUrl?: string | null;
  tierIndices?: number[];
}

export interface VariantGroupDto {
  name: string;
  options: string[];
}

export interface ProductSummaryDto {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  thumbnailUrl: string;
  categoryName: string;
  categorySlug: string;
  variants: VariantDto[];
  createdAt?: string;
}

export interface ProductDetailDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  thumbnailUrl: string;
  category: CategoryDto;
  variants: VariantDto[];
  createdAt?: string;
  active?: boolean;
}

export interface ProductQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "newest" | "price_asc" | "price_desc" | string;
}

export type ProductListResponse = ApiResponse<PageResponse<ProductSummaryDto>>;
export type ProductDetailResponse = ApiResponse<ProductDetailDto>;

// Aliases matching backend DTO naming
export type BackendVariant = VariantDto;
export type BackendCategory = CategoryDto;
export type BackendProductDetail = ProductDetailDto;
export type BackendProductSummary = ProductSummaryDto;
