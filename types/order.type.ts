export interface OrderItemRequest {
  variantId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  customerName: string;
  phone: string;
  shippingAddress: string;
  paymentMethod: "COD" | "VIETQR" | string;
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
  orderStatus: string;
  paymentMethod: "COD" | "VIETQR" | string;
  paymentStatus: string;
  items: OrderItemResponse[];
  createdAt: string;
}
