import http from "@/lib/http";
import { ApiResponse } from "@/types/api.type";
import { CategoryDto } from "@/types/category.type";

export const categoryApiRequest = {
  getAllCategories: () => {
    return http.get<ApiResponse<CategoryDto[]>>("/api/categories");
  },
};

export default categoryApiRequest;
