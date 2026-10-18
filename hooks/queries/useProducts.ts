import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import productApiRequest from "@/apiRequest/product";
import { ProductQueryParams, AdminProductFormDto } from "@/types/product.type";
import { queryKeys } from "./queryKeys";
import { emitSyncEvent } from "@/lib/sync";
import { validateProductDetail, validateProductSummaryList } from "@/lib/schemas";

export function useProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await productApiRequest.getProducts(params);
      return res.data?.data;
    },
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug),
    queryFn: async () => {
      const res = await productApiRequest.getProductBySlug(slug);
      const data = res.data?.data;
      if (data && process.env.NODE_ENV !== "production") {
        const validation = validateProductDetail(data);
        if (!validation.success) {
          console.warn("Product detail response schema mismatch:", validation.error.format());
        }
      }
      return data;
    },
    enabled: Boolean(slug),
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: queryKeys.products.adminList(),
    queryFn: async () => {
      const res = await productApiRequest.adminGetAllProducts();
      const data = res.data?.data || [];
      if (process.env.NODE_ENV !== "production") {
        const validation = validateProductSummaryList(data);
        if (!validation.success) {
          console.warn("Admin products response schema mismatch:", validation.error.format());
        }
      }
      return data;
    },
  });
}

export function useAdminToggleProductActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active?: boolean }) => {
      const res = await productApiRequest.adminToggleActive(id, active);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      emitSyncEvent("PRODUCT_UPDATED");
    },
  });
}

export function useAdminCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminProductFormDto) => {
      const res = await productApiRequest.adminCreateProduct(body);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      emitSyncEvent("PRODUCT_UPDATED");
    },
  });
}

export function useAdminUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: AdminProductFormDto }) => {
      const res = await productApiRequest.adminUpdateProduct(id, body);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      emitSyncEvent("PRODUCT_UPDATED");
    },
  });
}

export function useAdminDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await productApiRequest.adminDeleteProduct(id);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      emitSyncEvent("PRODUCT_UPDATED");
    },
  });
}
