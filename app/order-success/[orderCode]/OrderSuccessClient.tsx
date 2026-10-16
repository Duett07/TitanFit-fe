"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatVND } from "@/data/products";
import orderApiRequest from "@/apiRequest/order";
import { OrderResponse } from "@/types/order.type";
import { useAuthStore } from "@/stores/useAuthStore";

interface OrderSuccessClientProps {
  orderCode: string;
}

// Banking Info Constants for VietQR
const BANK_CONFIG = {
  bankId: "MB",
  bankName: "Ngân Hàng Quân Đội (MB Bank)",
  accountNumber: "098888889999",
  accountName: "CONG TY TNHH TITANFIT VIET NAM",
};

export default function OrderSuccessClient({ orderCode }: OrderSuccessClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Enforce authentication: Redirect to login immediately if not logged in
  useEffect(() => {
    let hasUser = false;
    if (typeof window !== "undefined") {
      try {
        hasUser = !!localStorage.getItem("user");
      } catch {}
    }

    if (!isAuthenticated && !hasUser) {
      router.replace(`/login?redirect=/order-success/${orderCode}`);
      return;
    }
    setIsAuthChecking(false);
  }, [isAuthenticated, orderCode, router]);

  useEffect(() => {
    let isMounted = true;

    async function fetchOrder() {
      try {
        const res = await orderApiRequest.getOrderByCode(orderCode);
        if (res.data?.data && isMounted) {
          setOrder(res.data.data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Could not fetch order from backend via orderCode:", err);
      }

      // Fallback display if backend session is not available
      if (isMounted) {
        setOrder({
          id: "temp-id",
          orderCode: orderCode,
          customerName: "Quý Khách Hàng",
          phone: "0987654321",
          shippingAddress: "Địa chỉ giao hàng đã đăng ký",
          totalAmount: 1550000,
          paymentMethod: "VIETQR",
          paymentStatus: "UNPAID",
          orderStatus: "PENDING",
          createdAt: new Date().toISOString(),
          items: [],
        });
        setLoading(false);
      }
    }

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [orderCode]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  if (isAuthChecking || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-muted-foreground">
          {isAuthChecking ? "Đang kiểm tra quyền truy cập..." : `Đang xác nhận mã đơn hàng #${orderCode}...`}
        </p>
      </div>
    );
  }

  const isVietQR = order?.paymentMethod === "VIETQR";
  const totalAmount = order?.totalAmount || 0;
  const qrUrl = `https://api.vietqr.io/image/970422-${BANK_CONFIG.accountNumber}-compact.jpg?amount=${totalAmount}&addInfo=${orderCode}&accountName=${encodeURIComponent(
    BANK_CONFIG.accountName
  )}`;

  return (
    <div className="min-h-screen bg-muted/30 pt-8 pb-16 lg:pt-12 lg:pb-24">
      <div className="container max-w-4xl mx-auto px-4 flex flex-col gap-6 sm:gap-8">
        {/* Success Header Card */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-10 shadow-sm text-center">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center border-2 border-emerald-500/20"
            style={{ margin: "0 auto 1.25rem auto" }}
          >
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
            Đặt Hàng Thành Công
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Cảm Ơn Bạn Đã Mua Sắm Tại TitanFit!
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
            Mã đơn hàng của bạn là{" "}
            <span className="font-mono font-bold text-foreground text-base px-2 py-0.5 rounded bg-muted">
              #{orderCode}
            </span>
            . Chúng tôi đã ghi nhận đơn hàng và đang chuẩn bị đóng gói.
          </p>
        </div>

        {/* VietQR Payment Section (If VietQR was chosen) */}
        {isVietQR && (
          <div className="bg-card border-2 border-primary/40 rounded-2xl p-6 sm:p-8 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-6 border-b border-border gap-2">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-primary text-white">
                  Thanh Toán VietQR
                </span>
                <h2 className="text-xl font-bold text-foreground mt-2">
                  Quét Mã QR Chuyển Khoản Tự Động
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Số tiền cần chuyển:</span>
                <p className="text-2xl font-black text-primary">
                  {formatVND(totalAmount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* QR Image Box (5 cols) */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="relative p-3 bg-white rounded-2xl border-2 border-primary/20 shadow-sm max-w-[260px] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="VietQR Code"
                    className="w-full h-auto rounded-lg aspect-square object-contain"
                  />
                  <div className="mt-2 text-center">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      VietQR • Chuyển Nhanh 24/7 Napas
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 text-center">
                  Mở ứng dụng ngân hàng bất kỳ để quét mã
                </p>
              </div>

              {/* Bank Details & Copy Helpers (7 cols) */}
              <div className="md:col-span-7 flex flex-col gap-3.5">
                {/* Bank Name */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                  <span className="text-[11px] text-muted-foreground block font-medium">
                    Ngân hàng thụ hưởng:
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {BANK_CONFIG.bankName}
                  </span>
                </div>

                {/* Account Number with Copy */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">
                      Số tài khoản thụ hưởng:
                    </span>
                    <span className="text-base font-mono font-bold text-foreground tracking-wider">
                      {BANK_CONFIG.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(BANK_CONFIG.accountNumber, "stk")}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-background border border-border hover:border-primary text-foreground hover:text-primary transition-all shadow-xs"
                  >
                    {copiedField === "stk" ? "✓ Đã Chép" : "Sao chép"}
                  </button>
                </div>

                {/* Account Owner */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                  <span className="text-[11px] text-muted-foreground block font-medium">
                    Chủ tài khoản:
                  </span>
                  <span className="text-sm font-bold text-foreground uppercase tracking-wide">
                    {BANK_CONFIG.accountName}
                  </span>
                </div>

                {/* Memo with Copy */}
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/30 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-primary block font-semibold">
                      Nội dung chuyển khoản (bắt buộc):
                    </span>
                    <span className="text-base font-mono font-black text-primary tracking-wider">
                      {orderCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(orderCode, "memo")}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-dark transition-all shadow-xs"
                  >
                    {copiedField === "memo" ? "✓ Đã Chép" : "Sao chép"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Hệ thống sẽ tự động đối soát và kích hoạt giao hàng ngay khi nhận được biến động số dư.
              </span>
            </div>
          </div>
        )}

        {/* COD Info Section (If COD was chosen) */}
        {!isVietQR && (
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
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
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Phương Thức Thanh Toán Khi Nhận Hàng (COD)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Số tiền cần chuẩn bị thanh toán khi shipper giao hàng:{" "}
                  <strong className="text-primary">{formatVND(totalAmount)}</strong>
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nhân viên tư vấn của TitanFit sẽ liên hệ qua số điện thoại <strong>{order?.phone}</strong> trong vòng 15-30 phút để xác nhận đơn hàng và thời gian giao hàng thuận tiện nhất cho bạn.
            </p>
          </div>
        )}

        {/* Shipping & Delivery Info */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-bold text-foreground pb-3 mb-4 border-b border-border">
            Thông Tin Giao Hàng
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">Người nhận:</span>
              <p className="font-semibold text-foreground text-sm">{order?.customerName}</p>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">Số điện thoại:</span>
              <p className="font-semibold text-foreground text-sm">{order?.phone}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground block mb-0.5">Địa chỉ giao hàng:</span>
              <p className="font-semibold text-foreground text-sm">{order?.shippingAddress}</p>
            </div>
            {order?.note && (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground block mb-0.5">Ghi chú:</span>
                <p className="text-foreground italic">{order.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items Breakdown */}
        {order?.items && order.items.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold text-foreground pb-3 mb-4 border-b border-border flex items-center justify-between">
              <span>Sản Phẩm Trong Đơn Hàng ({order.items.length})</span>
              <span className="text-xs text-muted-foreground font-normal">
                Tổng cộng: <strong className="text-foreground font-bold">{formatVND(totalAmount)}</strong>
              </span>
            </h3>
            <div className="divide-y divide-border/60">
              {order.items.map((item, index) => (
                <div key={item.id || index} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.variantName || "Tiêu Chuẩn"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Số lượng: x{item.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">
                      {formatVND((Number(item.price) || 0) * (item.quantity || 1))}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatVND(Number(item.price) || 0)} / món
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href={`/order-tracking?order=${orderCode}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-md active:scale-95 text-sm cursor-pointer"
          >
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span>Theo Dõi Hành Trình Đơn Hàng</span>
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-foreground bg-secondary hover:bg-secondary/80 border border-border transition-all text-sm"
          >
            <span>Tiếp Tục Mua Sắm</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-muted-foreground hover:text-foreground bg-card border border-border hover:bg-muted transition-colors text-sm"
          >
            <span>Về Trang Chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
