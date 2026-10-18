import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import productApiRequest from "@/apiRequest/product";
import { ProductQueryParams, AdminProductFormDto } from "@/types/product.type";
import { queryKeys } from "./queryKeys";
import { emitSyncEvent } from "@/lib/sync";

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
      return res.data?.data;
    },
    enabled: Boolean(slug),
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: queryKeys.products.adminList(),
    queryFn: async () => {
      const res = await productApiRequest.adminGetAllProducts();
      return res.data?.data || [];
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
