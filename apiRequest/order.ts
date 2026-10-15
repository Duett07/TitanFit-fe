import http from "@/lib/http";
import { ApiResponse } from "@/types/api.type";
import { CreateOrderRequest, OrderResponse } from "@/types/order.type";

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
};

export default orderApiRequest;
