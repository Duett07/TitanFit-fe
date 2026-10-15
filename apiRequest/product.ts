import http from "@/lib/http";
import {
  ApiResponse,
  PageResponse,
  ProductDetailDto,
  ProductQueryParams,
  ProductSummaryDto,
} from "@/types/product.type";
import type { AxiosResponse } from "axios";

// In-flight request deduplication map to prevent duplicate concurrent network requests
const inFlightRequests = new Map<string, Promise<unknown>>();

function dedupeRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = requestFn().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}

export const productApiRequest = {
  getProducts: (
    params?: ProductQueryParams
  ): Promise<AxiosResponse<ApiResponse<PageResponse<ProductSummaryDto>>>> => {
    const key = `getProducts:${JSON.stringify(params || {})}`;
    return dedupeRequest(key, () =>
      http.get<ApiResponse<PageResponse<ProductSummaryDto>>>("/api/products", {
        params,
      })
    );
  },

  getProductBySlug: (
    slug: string,
    cookieHeader?: string
  ): Promise<AxiosResponse<ApiResponse<ProductDetailDto>>> => {
    const key = `getProductBySlug:${slug}:${cookieHeader || ""}`;
    return dedupeRequest(key, () =>
      http.get<ApiResponse<ProductDetailDto>>(
        `/api/products/${slug}`,
        cookieHeader ? { headers: { Cookie: cookieHeader } } : {}
      )
    );
  },
};

export default productApiRequest;
