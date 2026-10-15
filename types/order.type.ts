export interface OrderItemRequest {
  variantId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  fullName: string;
  phone: string;
  shippingAddress: string;
  paymentMethod: "COD" | "BANK_TRANSFER" | "VNPAY" | string;
  note?: string;
  items: OrderItemRequest[];
}

export interface OrderItemResponse {
  id: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  subTotal: number;
}

export interface OrderResponse {
  id: string;
  orderCode: string;
  fullName: string;
  phone: string;
  shippingAddress: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  items: OrderItemResponse[];
  createdAt: string;
}
