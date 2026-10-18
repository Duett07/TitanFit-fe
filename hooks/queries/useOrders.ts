import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import orderApiRequest from "@/apiRequest/order";
import { CreateOrderRequest, TrackOrderRequest } from "@/types/order.type";
import { queryKeys } from "./queryKeys";
import { emitSyncEvent } from "@/lib/sync";

export function useAdminOrders() {
  return useQuery({
    queryKey: queryKeys.orders.adminList(),
    queryFn: async () => {
      const res = await orderApiRequest.getAllOrders();
      return res.data?.data || [];
    },
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: queryKeys.orders.myOrders(),
    queryFn: async () => {
      const res = await orderApiRequest.getMyOrders();
      return res.data?.data || [];
    },
  });
}

export function useOrderByCode(code: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(code),
    queryFn: async () => {
      const res = await orderApiRequest.getOrderByCode(code);
      return res.data?.data;
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
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED";
    }) => {
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
