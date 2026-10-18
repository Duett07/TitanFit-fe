"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatVND } from "@/lib/format";
import orderApiRequest from "@/apiRequest/order";
import { CreateOrderRequest } from "@/types/order.type";
import { emitSyncEvent } from "@/lib/sync";

// Zod Validation Schema
const checkoutSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên quá dài"),
  phone: z
    .string()
    .regex(
      /^(0|\+84)[0-9]{9,10}$/,
      "Số điện thoại không hợp lệ (ví dụ: 0912345678)"
    ),
  shippingAddress: z
    .string()
    .min(6, "Vui lòng nhập địa chỉ nhận hàng chi tiết (số nhà, tên đường, phường/xã)"),
  note: z.string().max(500, "Ghi chú không quá 500 ký tự").optional(),
  paymentMethod: z.enum(["COD", "VIETQR"]),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// Helper to validate real backend variant UUID
const isValidUUID = (id?: string): boolean =>
  Boolean(
    id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );

export default function CheckoutPage() {
  const router = useRouter();
  const cartStore = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Close drawer and sync cart with backend once when arriving at checkout page
  useEffect(() => {
    useCartStore.getState().closeDrawer();
    cartStore.syncCart();
  }, []);

  // Enforce authentication: Redirect to login immediately if not logged in
  useEffect(() => {
    let hasUser = false;
    if (typeof window !== "undefined") {
      try {
        hasUser = !!localStorage.getItem("user");
      } catch {}
    }

    if (!isAuthenticated && !hasUser) {
      router.replace("/login?redirect=/checkout");
      return;
    }
    setIsAuthChecking(false);
  }, [isAuthenticated, router]);

  // Hydration-safe store subscription
  const isHydrated = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );

  const cartItems = cartStore.items;
  const items = useMemo(() => (isHydrated ? cartItems : []), [isHydrated, cartItems]);
  const totalPrice = isHydrated ? cartStore.getTotalPrice() : 0;
  const totalCount = isHydrated ? cartStore.getTotalCount() : 0;

  // Detect any items that lack a valid backend variant UUID
  const invalidCartItems = useMemo(
    () => items.filter((item) => !isValidUUID(item.variantId)),
    [items]
  );

  const handleRemoveInvalidItems = () => {
    invalidCartItems.forEach((item) => {
      cartStore.removeItem(item.id);
    });
    setErrorMessage(null);
  };

  // Detect any items that are out of stock or stock is 0
  const outOfStockItems = useMemo(
    () => items.filter((item) => typeof item.stock === "number" && item.stock <= 0),
    [items]
  );

  const handleRemoveOutOfStockItems = () => {
    outOfStockItems.forEach((item) => {
      cartStore.removeItem(item.id);
    });
    setErrorMessage(null);
  };

  // Form State with lazy initialization to read localStorage without setState in effect
  const [formData, setFormData] = useState<CheckoutFormValues>(() => {
    let initialName = "";
    let initialPhone = "";
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          initialName = user.fullName || "";
          initialPhone = user.phone || "";
        }
      } catch {
        // Ignore JSON error
      }
    }
    return {
      fullName: initialName,
      phone: initialPhone,
      shippingAddress: "",
      note: "",
      paymentMethod: "COD",
    };
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CheckoutFormValues]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePaymentSelect = (method: "COD" | "VIETQR") => {
    setFormData((prev) => ({ ...prev, paymentMethod: method }));
  };


  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    // 1. Validate Form via Zod
    const validation = checkoutSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof CheckoutFormValues, string>> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CheckoutFormValues;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Giỏ hàng của bạn đang trống!");
      return;
    }

    // Never fallback to mock UUIDs: strictly block checkout if any item lacks valid variantId
    if (invalidCartItems.length > 0) {
      const invalidNames = invalidCartItems.map((i) => `"${i.name}"`).join(", ");
      setErrorMessage(
        `Sản phẩm sau chưa có thông tin biến thể hợp lệ từ hệ thống: ${invalidNames}. Vui lòng chọn lại hoặc xóa khỏi giỏ hàng trước khi đặt hàng.`
      );
      return;
    }

    // Block checkout if any item is out of stock
    if (outOfStockItems.length > 0) {
      const oosNames = outOfStockItems.map((i) => `"${i.name}"`).join(", ");
      setErrorMessage(
        `Sản phẩm sau hiện đã hết hàng: ${oosNames}. Vui lòng xóa khỏi giỏ hàng trước khi đặt hàng.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload
      const orderPayload: CreateOrderRequest = {
        customerName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        shippingAddress: formData.shippingAddress.trim(),
        note: formData.note?.trim() || "",
        paymentMethod: formData.paymentMethod,
        items: items.map((item) => ({
          variantId: item.variantId!,
          quantity: item.quantity,
        })),
      };

      const res = await orderApiRequest.createOrder(orderPayload);
      const createdOrder = res.data?.data;

      if (createdOrder?.orderCode) {
        // Clear cart
        cartStore.clearCart();
        // Thông báo cho tất cả các tab Admin (Overview, Orders, Inventory) cập nhật ngay lập tức
        emitSyncEvent("ORDER_UPDATED", { orderCode: createdOrder.orderCode });
        emitSyncEvent("INVENTORY_UPDATED");
        // Redirect to success page
        router.push(`/order-success/${createdOrder.orderCode}`);
      } else {
        throw new Error("Không nhận được mã đơn hàng từ hệ thống.");
      }
    } catch (err: unknown) {
      console.error("Order submission error:", err);
      const anyErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (anyErr?.response?.status === 401) {
        // Requires authentication
        router.replace("/login?redirect=/checkout");
        return;
      } else {
        setErrorMessage(
          anyErr?.response?.data?.message ||
          "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng kiểm tra lại thông tin!"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auth checking view
  if (isAuthChecking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-muted-foreground">
          Đang kiểm tra quyền truy cập...
        </p>
      </div>
    );
  }

  // Empty cart view
  if (isHydrated && items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="w-20 h-20 bg-primary/10 text-primary mx-auto rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Giỏ Hàng Của Bạn Đang Trống
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Bạn chưa chọn sản phẩm nào để tiến hành thanh toán. Hãy khám phá các dòng thực phẩm bổ sung và phụ kiện tập gym đỉnh cao từ TitanFit ngay nhé!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-dark)] transition-all shadow-md active:scale-95"
          >
            <span>Khám Phá Sản Phẩm Ngay</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pt-8 pb-16 lg:pt-10 lg:pb-20">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
            <Link href="/" className="hover:text-primary transition-colors">
              Trang Chủ
            </Link>
            <span>/</span>
            <Link href="/products" className="hover:text-primary transition-colors">
              Sản Phẩm
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Thanh Toán</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Xác Nhận & Thanh Toán Đơn Hàng
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Vui lòng điền thông tin người nhận và lựa chọn phương thức thanh toán phù hợp
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Miễn phí giao hàng toàn quốc (Freeship)</span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-semibold">Lỗi tạo đơn hàng:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 2-Column Checkout Layout */}
        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Customer Info & Payment Method (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Section 1: Receiver Information */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-border">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                  1
                </span>
                <h2 className="text-lg font-bold text-foreground">
                  Thông Tin Người Nhận
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                    Họ và tên người nhận <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-background text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.fullName
                      ? "border-destructive focus:border-destructive"
                      : "border-border focus:border-primary"
                      }`}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                    Số điện thoại <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Ví dụ: 0912345678"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-background text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.phone
                      ? "border-destructive focus:border-destructive"
                      : "border-border focus:border-primary"
                      }`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>

                {/* Shipping Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                    Địa chỉ nhận hàng chi tiết <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-background text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.shippingAddress
                      ? "border-destructive focus:border-destructive"
                      : "border-border focus:border-primary"
                      }`}
                  />
                  {errors.shippingAddress && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.shippingAddress}
                    </p>
                  )}
                </div>

                {/* Order Note */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                    Ghi chú đơn hàng (Tuỳ chọn)
                  </label>
                  <textarea
                    name="note"
                    rows={3}
                    value={formData.note}
                    onChange={handleChange}
                    placeholder="Giao hàng vào giờ hành chính, gọi trước khi giao, v.v."
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm bg-background text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Payment Method */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-border">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                  2
                </span>
                <h2 className="text-lg font-bold text-foreground">
                  Phương Thức Thanh Toán
                </h2>
              </div>

              <div className="flex flex-col gap-3.5">
                {/* Option 1: COD */}
                <label
                  onClick={() => handlePaymentSelect("COD")}
                  className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === "COD"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30 bg-background"
                    }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === "COD"}
                    onChange={() => handlePaymentSelect("COD")}
                    className="mt-1 w-4 h-4 text-primary accent-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        Thanh toán khi nhận hàng (COD)
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-muted text-muted-foreground">
                        Tiền mặt
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kiểm tra hàng trước khi thanh toán tiền mặt trực tiếp cho nhân viên giao hàng. An toàn 100%.
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </label>

                {/* Option 2: VIETQR */}
                <label
                  onClick={() => handlePaymentSelect("VIETQR")}
                  className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === "VIETQR"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30 bg-background"
                    }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VIETQR"
                    checked={formData.paymentMethod === "VIETQR"}
                    onChange={() => handlePaymentSelect("VIETQR")}
                    className="mt-1 w-4 h-4 text-primary accent-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        Chuyển khoản VietQR tự động
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-primary text-white">
                        Khuyên dùng
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quét mã QR tự động bằng bất kỳ ứng dụng ngân hàng nào (MB Bank, Vietcombank, Techcombank...). Không cần nhập tay số tài khoản hay số tiền!
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary Box (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm lg:sticky lg:top-24">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">
                  Tóm Tắt Đơn Hàng ({totalCount})
                </h2>
                <Link
                  href="/products"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Thêm sản phẩm
                </Link>
              </div>

              {/* Invalid Items Alert Banner */}
              {invalidCartItems.length > 0 && (
                <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex flex-col gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <svg
                      className="w-5 h-5 shrink-0 mt-0.5 text-destructive"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-sm">
                        Có {invalidCartItems.length} sản phẩm cần chọn lại
                      </p>
                      <p className="text-muted-foreground mt-0.5">
                        Thông tin biến thể không hợp lệ hoặc là dữ liệu cũ. Vui lòng xóa hoặc chọn lại để tiếp tục:
                      </p>
                      <ul className="list-disc list-inside mt-1.5 space-y-1 font-medium text-destructive">
                        {invalidCartItems.map((item) => (
                          <li key={item.id} className="truncate">
                            {item.name} ({item.variantSummary || "Chưa có biến thể"})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveInvalidItems}
                    className="self-end px-3 py-1.5 text-xs font-semibold rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-all cursor-pointer shadow-xs"
                  >
                    Xóa các sản phẩm không hợp lệ
                  </button>
                </div>
              )}

              {/* Out of Stock Alert Banner */}
              {outOfStockItems.length > 0 && (
                <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex flex-col gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <svg
                      className="w-5 h-5 shrink-0 mt-0.5 text-destructive"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-sm">
                        Có {outOfStockItems.length} sản phẩm đã hết hàng
                      </p>
                      <p className="text-muted-foreground mt-0.5">
                        Tồn kho đã thay đổi kể từ lúc thêm vào giỏ. Vui lòng xóa sản phẩm hết hàng để tiếp tục:
                      </p>
                      <ul className="list-disc list-inside mt-1.5 space-y-1 font-medium text-destructive">
                        {outOfStockItems.map((item) => (
                          <li key={item.id} className="truncate">
                            {item.name} ({item.variantSummary || "Mặc định"})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveOutOfStockItems}
                    className="self-end px-3 py-1.5 text-xs font-semibold rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-all cursor-pointer shadow-xs"
                  >
                    Xóa các sản phẩm hết hàng
                  </button>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 divide-y divide-border/60">
                {items.map((item) => {
                  const isOutOfStock = typeof item.stock === "number" && item.stock <= 0;
                  return (
                    <div key={item.id} className="pt-3 first:pt-0 flex gap-3 items-center">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-semibold text-foreground line-clamp-1">
                            {item.name}
                          </h4>
                          {!isValidUUID(item.variantId) && (
                            <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded bg-destructive/15 text-destructive">
                              Cần chọn lại
                            </span>
                          )}
                          {isOutOfStock && (
                            <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded bg-destructive/15 text-destructive">
                              Hết hàng
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {item.variantSummary}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-bold text-primary">
                            {formatVND(item.price)}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            x{item.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 text-xs font-semibold text-foreground">
                        {formatVND(item.price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pricing Breakdown */}
              <div className="mt-6 pt-4 border-t border-border flex flex-col gap-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tạm tính ({totalCount} món):</span>
                  <span className="font-medium text-foreground">{formatVND(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground items-center">
                  <span>Phí vận chuyển:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="line-through text-muted-foreground/60 mr-1">30.000₫</span>
                    <span>Miễn Phí</span>
                  </span>
                </div>
                <div className="pt-3 border-t border-border flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-foreground">Tổng Thanh Toán:</span>
                    <p className="text-[11px] text-muted-foreground">Đã bao gồm VAT nếu có</p>
                  </div>
                  <span className="text-2xl font-black text-primary tracking-tight">
                    {formatVND(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || invalidCartItems.length > 0 || outOfStockItems.length > 0}
                title={
                  invalidCartItems.length > 0
                    ? "Vui lòng xóa các sản phẩm lỗi hoặc chọn lại trước khi đặt hàng"
                    : outOfStockItems.length > 0
                    ? "Vui lòng xóa các sản phẩm đã hết hàng trước khi đặt hàng"
                    : undefined
                }
                className="mt-6 w-full py-4 px-6 rounded-xl font-bold text-base text-white bg-[var(--primary)] hover:bg-[var(--primary)]/80 transition-all shadow-md active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang Tạo Đơn Hàng...</span>
                  </>
                ) : (
                  <>
                    <span>Xác Nhận Đặt Hàng</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>

              {/* Guarantee Badges */}
              <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-border/60 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-emerald-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>100% Chính Hãng Nhập Khẩu</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-emerald-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span>Bảo Mật Giao Dịch SSL</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
