export type ProductCategory = "all" | "apparel" | "supplements";

export type PriceFilterKey = "all" | "under500k" | "500k-1tr" | "1tr-2tr" | "over2tr";

export type SortOptionKey = "newest" | "price-asc" | "price-desc";

export interface Product {
  id: number | string;
  slug: string;
  name: string;
  category: "apparel" | "supplements";
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  image: string;
  actionText: string;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  salesCount?: number;
}

export { formatVND } from "@/lib/format";

export interface ProductVariantOption {
  name: string; // e.g. "Kích thước (Size)" or "Hương Vị"
  values: string[];
}

export interface ProductVariantSKU {
  id?: string;
  sku: string;
  options: Record<string, string>;
  price: number;
  originalPrice?: number;
  stock: number;
  image?: string;
}

export interface UIProductDetail extends Product {
  description: string;
  images: string[];
  variantOptions: ProductVariantOption[];
  variants: ProductVariantSKU[];
  specs: { label: string; value: string }[];
  features?: string[];
}

/**
 * @deprecated Use UIProductDetail for adapted client UI state, or ProductDetailDto for backend DTOs.
 */
export type ProductDetail = UIProductDetail;
