export type PaymentMethod = "COD" | "VIETQR";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPING"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type UpdatableOrderStatus =
  | "CONFIRMED"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID";

export interface OrderItemRequest {
  variantId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  customerName: string;
  phone: string;
  shippingAddress: string;
  paymentMethod: PaymentMethod;
  note?: string;
  items: OrderItemRequest[];
}

export interface TrackOrderRequest {
  orderCode: string;
  phone: string;
}

export interface OrderItemResponse {
  id: string;
  variantId?: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  totalPrice?: number;
  subTotal?: number;
}

export interface OrderResponse {
  id: string;
  orderCode: string;
  customerName: string;
  phone: string;
  shippingAddress: string;
  note?: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  items: OrderItemResponse[];
  createdAt: string;
}
