import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import orderApiRequest from "@/apiRequest/order";
import {
  CreateOrderRequest,
  OrderResponse,
  TrackOrderRequest,
  UpdatableOrderStatus,
} from "@/types/order.type";
import { queryKeys } from "./queryKeys";
import { emitSyncEvent } from "@/lib/sync";
import { validateOrderListResponse, validateOrderResponse } from "@/lib/schemas";

export function extractOrdersList(raw: unknown): OrderResponse[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (
    raw &&
    typeof raw === "object" &&
    "content" in raw &&
    Array.isArray((raw as { content?: unknown }).content)
  ) {
    return (raw as { content: OrderResponse[] }).content;
  }
  return [];
}

export function useAdminOrders() {
  return useQuery({
    queryKey: queryKeys.orders.adminList(),
    queryFn: async () => {
      const res = await orderApiRequest.getAllOrders();
      const data = extractOrdersList(res.data?.data);
      if (process.env.NODE_ENV !== "production") {
        const validation = validateOrderListResponse(data);
        if (!validation.success) {
          console.warn("Admin orders response schema mismatch:", validation.error.format());
        }
      }
      return data;
    },
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: queryKeys.orders.myOrders(),
    queryFn: async () => {
      const res = await orderApiRequest.getMyOrders();
      return extractOrdersList(res.data?.data);
    },
  });
}

export function useOrderByCode(code: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(code),
    queryFn: async () => {
      const res = await orderApiRequest.getOrderByCode(code);
      const data = res.data?.data;
      if (data && process.env.NODE_ENV !== "production") {
        const validation = validateOrderResponse(data);
        if (!validation.success) {
          console.warn("Order detail response schema mismatch:", validation.error.format());
        }
      }
      return data;
    },
    enabled: Boolean(code),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateOrderRequest) => {
      const res = await orderApiRequest.createOrder(body);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      emitSyncEvent("ORDER_UPDATED");
      emitSyncEvent("INVENTORY_UPDATED");
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: UpdatableOrderStatus }) => {
      const res = await orderApiRequest.updateOrderStatus(orderId, status);
      return res.data?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      if (variables.status === "CANCELLED") {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        emitSyncEvent("INVENTORY_UPDATED");
      }
      emitSyncEvent("ORDER_UPDATED");
    },
  });
}

export function useTrackOrder() {
  return useMutation({
    mutationFn: async (body: TrackOrderRequest) => {
      const res = await orderApiRequest.trackOrder(body);
      return res.data?.data;
    },
  });
}
