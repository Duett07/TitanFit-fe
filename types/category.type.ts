import { ApiResponse } from "./api.type";

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  categoryTree?: string;
  imageUrl?: string;
  sortOrder?: number;
  productCount?: number;
}

export type CategoryResponse = ApiResponse<CategoryDto[]>;
