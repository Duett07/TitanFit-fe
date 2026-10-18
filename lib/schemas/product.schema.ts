import { z } from "zod";

export const productSortOptionSchema = z.enum(["newest", "price_asc", "price_desc"]);

export const variantDtoSchema = z.object({
  id: z.string(),
  sku: z.string(),
  variantName: z.string(),
  price: z.number(),
  stockQuantity: z.number(),
  stock: z.number().optional(),
  imageUrl: z.string().nullable().optional(),
  tierIndices: z.array(z.number()).optional(),
});

export const categoryDtoSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  slug: z.string(),
  categoryTree: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.number().optional(),
  productCount: z.number().optional(),
});

export const productSummaryDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  basePrice: z.number(),
  thumbnailUrl: z.string(),
  categoryName: z.string(),
  categorySlug: z.string(),
  variants: z.array(variantDtoSchema),
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
});

export const productDetailDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  basePrice: z.number(),
  thumbnailUrl: z.string(),
  category: categoryDtoSchema,
  variants: z.array(variantDtoSchema),
  createdAt: z.string().optional(),
  active: z.boolean().optional(),
});

export const productSummaryListSchema = z.array(productSummaryDtoSchema);

/**
 * Validate a backend product detail DTO object at runtime
 */
export function validateProductDetail(data: unknown) {
  return productDetailDtoSchema.safeParse(data);
}

/**
 * Validate a list of backend product summary DTO objects at runtime
 */
export function validateProductSummaryList(data: unknown) {
  return productSummaryListSchema.safeParse(data);
}
