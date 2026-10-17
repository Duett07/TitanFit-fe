import http from "@/lib/http";
import { ApiResponse } from "@/types/api.type";
import { CreateOrderRequest, OrderResponse, TrackOrderRequest } from "@/types/order.type";

export const orderApiRequest = {
  createOrder: (body: CreateOrderRequest) =>
    http.post<ApiResponse<OrderResponse>>("/api/orders", body),
  getMyOrders: (cookieHeader?: string) =>
    http.get<ApiResponse<OrderResponse[]>>(
      "/api/orders/my-orders",
      cookieHeader ? { headers: { Cookie: cookieHeader } } : {}
    ),
  getOrderByCode: (orderCode: string) =>
    http.get<ApiResponse<OrderResponse>>(`/api/orders/${orderCode}`),
  trackOrder: (body: TrackOrderRequest) =>
    http.post<ApiResponse<OrderResponse>>("/api/orders/track", body),
  getAllOrders: (cookieHeader?: string) =>
    http.get<ApiResponse<OrderResponse[]>>(
      "/api/admin/orders",
      cookieHeader ? { headers: { Cookie: cookieHeader } } : {}
    ),
  updateOrderStatus: (
    orderId: string,
    newStatus: "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED"
  ) =>
    http.patch<ApiResponse<OrderResponse>>(
      `/api/admin/orders/${orderId}/status?newStatus=${newStatus}`,
      { newStatus }
    ),
};

export default orderApiRequest;
