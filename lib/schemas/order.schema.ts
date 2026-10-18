import { z } from "zod";

export const paymentMethodSchema = z.enum(["COD", "VIETQR"]);

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "SHIPPING",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
]);

export const paymentStatusSchema = z.enum(["UNPAID", "PAID"]);

export const orderItemRequestSchema = z.object({
  variantId: z.string().uuid("variantId phải là chuỗi UUID hợp lệ"),
  quantity: z.number().int().positive("Số lượng phải lớn hơn 0"),
});

export const createOrderRequestSchema = z.object({
  customerName: z.string().min(2, "Họ và tên người nhận tối thiểu 2 ký tự"),
  phone: z
    .string()
    .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, "Số điện thoại không đúng định dạng Việt Nam"),
  shippingAddress: z.string().min(5, "Địa chỉ nhận hàng tối thiểu 5 ký tự"),
  paymentMethod: paymentMethodSchema,
  note: z.string().optional(),
  items: z.array(orderItemRequestSchema).min(1, "Đơn hàng phải chứa ít nhất 1 sản phẩm"),
});

export const orderItemResponseSchema = z.object({
  id: z.string(),
  variantId: z.string().optional(),
  productName: z.string(),
  variantName: z.string(),
  price: z.number(),
  quantity: z.number(),
  totalPrice: z.number().optional(),
  subTotal: z.number().optional(),
});

export const orderResponseSchema = z.object({
  id: z.string(),
  orderCode: z.string(),
  customerName: z.string(),
  phone: z.string(),
  shippingAddress: z.string(),
  note: z.string().optional().nullable(),
  totalAmount: z.number(),
  orderStatus: orderStatusSchema,
  paymentMethod: paymentMethodSchema,
  paymentStatus: paymentStatusSchema,
  items: z.array(orderItemResponseSchema),
  createdAt: z.string(),
});

export const orderListResponseSchema = z.array(orderResponseSchema);

/**
 * Validate a backend order response object at runtime with actionable feedback
 */
export function validateOrderResponse(data: unknown) {
  return orderResponseSchema.safeParse(data);
}

/**
 * Validate a list of backend order response objects at runtime
 */
export function validateOrderListResponse(data: unknown) {
  return orderListResponseSchema.safeParse(data);
}
