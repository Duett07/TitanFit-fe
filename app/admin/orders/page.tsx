"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw, Search, X } from "lucide-react";
import orderApiRequest from "@/apiRequest/order";
import { formatVND } from "@/lib/format";
import { getErrorMessage } from "@/lib/error";
import { emitSyncEvent, useAutoSync } from "@/lib/sync";
import { ConfirmModal, EmptyState, Modal, StatusBadge, Toast } from "@/components/ui";
import { PaymentMethod, OrderStatus, PaymentStatus } from "@/types/order.type";

export interface AdminOrderItem {
  id?: string;
  name: string;
  variant: string;
  qty: number;
  price: number;
  image?: string;
}

export interface AdminOrder {
  id: string;
  code: string;
  customer: string;
  phone: string;
  address: string;
  itemsSummary: string;
  itemsList: AdminOrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentStatusLabel?: string;
  status: OrderStatus;
  time: string;
  createdAt?: string;
  note?: string;
}

type FilterStatus = "ALL" | OrderStatus;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);
  const [cancellingOrderCode, setCancellingOrderCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Auto dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Map Backend OrderResponse to AdminOrder
  const mapOrder = useCallback(
    (o: {
      id: string;
      orderCode: string;
      customerName: string;
      phone: string;
      shippingAddress: string;
      note?: string;
      totalAmount: number;
      orderStatus: string;
      paymentMethod: string;
      paymentStatus: string;
      items: Array<{
        id?: string;
        variantId?: string;
        productName: string;
        variantName: string;
        price: number;
        quantity: number;
      }>;
      createdAt: string;
    }): AdminOrder => {
      const rawStatus = (o.orderStatus || "PENDING").toUpperCase();
      const status = (
        ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"].includes(rawStatus)
          ? rawStatus
          : "PENDING"
      ) as AdminOrder["status"];

      let paymentStatusLabel = o.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán";
      if (o.paymentMethod === "VIETQR") {
        paymentStatusLabel =
          o.paymentStatus === "PAID" ? "Đã thanh toán (Napas247)" : "Chờ đối soát";
      } else if (o.paymentMethod === "COD") {
        paymentStatusLabel = status === "COMPLETED" ? "Đã thu tiền mặt" : "Chờ thu tiền mặt";
      }

      if (status === "CANCELLED") {
        paymentStatusLabel = "Đã hủy đơn";
      }

      return {
        id: o.id,
        code: o.orderCode,
        customer: o.customerName || "Khách Hàng",
        phone: o.phone || "---",
        address: o.shippingAddress || "---",
        itemsSummary:
          o.items && o.items.length > 0
            ? o.items.map((it) => it.productName).join(" + ")
            : "Đơn hàng TITANFIT",
        itemsList: (o.items || []).map((it, itemIdx) => ({
          id: it.id || it.variantId || `${o.id}-${itemIdx}`,
          name: it.productName || "Sản phẩm",
          variant: it.variantName || "Tiêu chuẩn",
          qty: it.quantity || 1,
          price: Number(it.price) || 0,
        })),
        total: Number(o.totalAmount) || 0,
        paymentMethod: (o.paymentMethod === "VIETQR" ? "VIETQR" : "COD") as PaymentMethod,
        paymentStatus: (o.paymentStatus === "PAID" ? "PAID" : "UNPAID") as PaymentStatus,
        paymentStatusLabel,
        status,
        time: o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "---",
        createdAt: o.createdAt,
        note: o.note || "",
      };
    },
    []
  );

  // Fetch real orders from Spring Boot Backend
  const fetchOrders = useCallback(
    async (isSilent = false) => {
      if (!isSilent) {
        setIsLoading(true);
        setFetchError(null);
      }
      try {
        const res = await orderApiRequest.getAllOrders();
        const rawData = res.data?.data || [];
        const mapped = rawData.map(mapOrder);
        setOrders(mapped);
      } catch (err: unknown) {
        if (!isSilent) {
          setFetchError(
            getErrorMessage(
              err,
              "Không thể tải danh sách đơn hàng từ máy chủ. Vui lòng kiểm tra kết nối."
            )
          );
        }
      } finally {
        if (!isSilent) {
          setIsLoading(false);
        }
      }
    },
    [mapOrder]
  );

  useEffect(() => {
    let ignore = false;
    const initFetch = async () => {
      try {
        const res = await orderApiRequest.getAllOrders();
        if (!ignore) {
          const rawData = res.data?.data || [];
          setOrders(rawData.map(mapOrder));
        }
      } catch (err: unknown) {
        if (!ignore) {
          setFetchError(
            getErrorMessage(
              err,
              "Không thể tải danh sách đơn hàng từ máy chủ. Vui lòng kiểm tra kết nối."
            )
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    initFetch();

    return () => {
      ignore = true;
    };
  }, [mapOrder]);

  // Real-time synchronization: Auto-refresh when new orders arrive or are modified elsewhere
  useAutoSync({
    eventTypes: ["ORDER_UPDATED"],
    onSync: () => fetchOrders(true),
    intervalMs: 60000,
    enableFocusSync: true,
  });

  // Cập nhật trạng thái đơn hàng (CONFIRMED, SHIPPING, COMPLETED, CANCELLED)
  const handleUpdateStatus = async (
    orderCode: string,
    newStatus: "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED"
  ) => {
    const targetOrder = orders.find((o) => o.code === orderCode);
    if (!targetOrder) return;

    if (targetOrder.status === newStatus) {
      setToastMessage({
        type: "info",
        text: `Đơn #${orderCode} đã ở trạng thái ${newStatus} rồi.`,
      });
      return;
    }

    setUpdatingCode(orderCode);
    const previousOrders = [...orders];

    // Optimistic UI Update
    setOrders((prev) =>
      prev.map((ord) => (ord.code === orderCode ? { ...ord, status: newStatus } : ord))
    );
    if (selectedOrder && selectedOrder.code === orderCode) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      await orderApiRequest.updateOrderStatus(targetOrder.id, newStatus);

      let msg = `Đã cập nhật trạng thái đơn #${orderCode} thành công.`;
      let toastType: "success" | "error" | "info" = "success";

      if (newStatus === "CANCELLED") {
        msg = `Đã HỦY đơn #${orderCode} • Backend tự động hoàn trả tồn kho cho các sản phẩm!`;
        toastType = "error";
      } else if (newStatus === "SHIPPING") {
        msg = `Đã duyệt đơn #${orderCode} ➔ Chuyển sang ĐANG GIAO HÀNG!`;
      } else if (newStatus === "COMPLETED") {
        msg = `Đơn #${orderCode} đã GIAO THÀNH CÔNG & Hoàn tất!`;
      } else if (newStatus === "CONFIRMED") {
        msg = `Đã XÁC NHẬN đơn #${orderCode} (Chuẩn bị hàng)!`;
      }

      setToastMessage({ type: toastType, text: msg });

      // Phát sự kiện đồng bộ thời gian thực đến tất cả các tab (Trang Tra cứu đơn của Buyer, Dashboard Admin, etc.)
      emitSyncEvent("ORDER_UPDATED", { orderCode, status: newStatus });
      if (newStatus === "CANCELLED") {
        emitSyncEvent("INVENTORY_UPDATED");
      }

      // Đồng bộ lại dữ liệu thật từ backend sau khi update thành công
      await fetchOrders(true);
    } catch (err: unknown) {
      // Revert optimistic update khi backend báo lỗi
      setOrders(previousOrders);
      if (selectedOrder && selectedOrder.code === orderCode) {
        setSelectedOrder(previousOrders.find((o) => o.code === orderCode) || null);
      }

      const errorMessage = getErrorMessage(
        err,
        `Lỗi khi cập nhật trạng thái đơn #${orderCode}. Vui lòng thử lại.`
      );

      setToastMessage({ type: "error", text: errorMessage });
    } finally {
      setUpdatingCode(null);
    }
  };

  const confirmCancelOrder = async () => {
    if (!cancellingOrderCode) return;
    const code = cancellingOrderCode;
    setCancellingOrderCode(null);
    await handleUpdateStatus(code, "CANCELLED");
  };

  // Đếm số lượng đơn theo từng bộ lọc
  const counts = useMemo(() => {
    return {
      ALL: orders.length,
      PENDING: orders.filter((o) => o.status === "PENDING").length,
      CONFIRMED: orders.filter((o) => o.status === "CONFIRMED").length,
      SHIPPING: orders.filter((o) => o.status === "SHIPPING").length,
      COMPLETED: orders.filter((o) => o.status === "COMPLETED").length,
      CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
    };
  }, [orders]);

  // Danh sách đơn sau khi áp dụng bộ lọc và tìm kiếm
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((ord) => {
      const matchStatus = statusFilter === "ALL" || ord.status === statusFilter;
      const matchQuery =
        !q ||
        ord.code.toLowerCase().includes(q) ||
        ord.customer.toLowerCase().includes(q) ||
        ord.phone.includes(q) ||
        ord.itemsSummary.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [orders, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <Toast
          text={toastMessage.text}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header Quản Lý Đơn Hàng */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Quản Lý Đơn Hàng</h1>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/25">
              {orders.length} đơn thực tế
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Backend API
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Dữ liệu trực tiếp từ Spring Boot backend & MySQL database • Tự động hoàn kho khi hủy đơn
          </p>
        </div>

        {/* Nút hành động đầu trang */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => fetchOrders(false)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-card hover:bg-secondary text-foreground border border-border transition-colors cursor-pointer disabled:opacity-50"
            title="Đồng bộ lại dữ liệu từ Backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            <span>{isLoading ? "Đang tải..." : "Làm Mới"}</span>
          </button>

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Tổng Quan</span>
          </Link>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {fetchError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchOrders(false)}
            className="px-3 py-1.5 rounded-lg bg-destructive text-white font-bold text-xs hover:bg-destructive/90 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            Thử Lại
          </button>
        </div>
      )}

      {/* Filter Tabs - Bộ lọc trạng thái đơn */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-card border border-border shadow-xs">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span>Tất cả</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              statusFilter === "ALL" ? "bg-white/20 text-white" : "bg-muted text-foreground"
            }`}
          >
            {counts.ALL}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === "PENDING"
              ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Chờ duyệt</span>
          </span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              statusFilter === "PENDING"
                ? "bg-white/25 text-white"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }`}
          >
            {counts.PENDING}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("CONFIRMED")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === "CONFIRMED"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span>Đã xác nhận</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              statusFilter === "CONFIRMED"
                ? "bg-white/25 text-white"
                : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
            }`}
          >
            {counts.CONFIRMED}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("SHIPPING")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === "SHIPPING"
              ? "bg-sky-500 text-white shadow-sm shadow-sky-500/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span>Đang giao</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              statusFilter === "SHIPPING"
                ? "bg-white/25 text-white"
                : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
            }`}
          >
            {counts.SHIPPING}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("COMPLETED")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === "COMPLETED"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span>Đã hoàn thành</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              statusFilter === "COMPLETED"
                ? "bg-white/25 text-white"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {counts.COMPLETED}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("CANCELLED")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === "CANCELLED"
              ? "bg-rose-600 text-white shadow-sm shadow-rose-600/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span>Đã hủy</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              statusFilter === "CANCELLED"
                ? "bg-white/25 text-white"
                : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
            }`}
          >
            {counts.CANCELLED}
          </span>
        </button>
      </div>

      {/* Toolbar Tìm Kiếm & Số lượng hiển thị */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn (TF-...), tên khách, SĐT..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-card border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-muted-foreground self-end sm:self-auto">
          Hiển thị <strong className="text-foreground font-bold">{filteredOrders.length}</strong> /{" "}
          {orders.length} đơn hàng thực tế
        </div>
      </div>

      {/* Bảng Danh Sách Đơn Hàng */}
      <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3.5 px-4 whitespace-nowrap">Mã Đơn</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Khách Hàng</th>
                <th className="py-3.5 px-4 whitespace-nowrap">SĐT</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Phương Thức</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Tổng Tiền</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Trạng Thái Đơn</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Ngày Đặt</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-4 bg-muted rounded w-20 mb-1" />
                      <div className="h-3 bg-muted/60 rounded w-28" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-muted rounded w-24 mb-1" />
                      <div className="h-3 bg-muted/60 rounded w-36" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-muted rounded w-24" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-muted rounded w-16 mb-1" />
                      <div className="h-3 bg-muted/60 rounded w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-muted rounded w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 bg-muted rounded-full w-24" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-muted rounded w-28" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-7 bg-muted rounded w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 px-4">
                    <EmptyState
                      title="Không tìm thấy đơn hàng phù hợp"
                      description={
                        searchQuery
                          ? "Thử điều chỉnh từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác"
                          : "Chưa có đơn hàng nào trong hệ thống với trạng thái này"
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-muted/20 transition-colors">
                    {/* Mã Đơn */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(ord)}
                        className="font-mono font-bold text-primary hover:underline cursor-pointer block text-left"
                      >
                        #{ord.code}
                      </button>
                      <span className="text-[10px] text-muted-foreground block truncate max-w-[140px]">
                        {ord.itemsSummary}
                      </span>
                    </td>

                    {/* Khách Hàng */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-foreground">{ord.customer}</div>
                      <span className="text-[10px] text-muted-foreground block truncate max-w-[160px]">
                        {ord.address}
                      </span>
                    </td>

                    {/* SĐT */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-mono text-muted-foreground font-medium">
                        {ord.phone}
                      </span>
                    </td>

                    {/* Phương Thức (COD / VietQR) */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            ord.paymentMethod === "VIETQR"
                              ? "bg-primary/10 text-primary border border-primary/25"
                              : "bg-secondary text-foreground border border-border"
                          }`}
                        >
                          {ord.paymentMethod}
                        </span>
                        <span
                          className={`text-[10px] font-medium ${
                            ord.paymentStatus === "PAID"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : ord.status === "CANCELLED"
                                ? "text-rose-500"
                                : "text-amber-500"
                          }`}
                        >
                          {ord.paymentStatusLabel ||
                            (ord.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán")}
                        </span>
                      </div>
                    </td>

                    {/* Tổng Tiền */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <strong className="text-foreground font-bold text-sm">
                        {formatVND(ord.total)}
                      </strong>
                    </td>

                    {/* Trạng Thái Đơn */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        {/* Status Badge */}
                        <div>
                          <StatusBadge
                            status={ord.status}
                            size="sm"
                            label={ord.status === "CANCELLED" ? "Đã hủy (Đã hoàn kho)" : undefined}
                          />
                        </div>

                        {/* Dropdown chuyển nhanh trạng thái */}
                        {ord.status !== "COMPLETED" && ord.status !== "CANCELLED" && (
                          <select
                            value={ord.status}
                            disabled={updatingCode === ord.code}
                            onChange={(e) =>
                              handleUpdateStatus(
                                ord.code,
                                e.target.value as
                                  "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED"
                              )
                            }
                            className="h-7 text-[11px] rounded-lg bg-background border border-border px-2 text-foreground focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
                          >
                            <option value="PENDING" disabled>
                              ⏳ Chờ duyệt
                            </option>
                            <option value="CONFIRMED">📦 Xác nhận đơn</option>
                            <option value="SHIPPING">🚚 Đang giao hàng</option>
                            <option value="COMPLETED">✅ Giao thành công</option>
                            <option value="CANCELLED">❌ Hủy đơn (Hoàn kho)</option>
                          </select>
                        )}
                      </div>
                    </td>

                    {/* Ngày Đặt */}
                    <td className="py-4 px-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                      {ord.time}
                    </td>

                    {/* Cột Hành Động */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Nút Xem Chi Tiết */}
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-[11px] font-semibold transition-all cursor-pointer active:scale-95 shadow-xs"
                        >
                          Xem Chi Tiết
                        </button>

                        {/* Dropdown / Nút bấm chuyển nhanh trạng thái */}
                        {(ord.status === "PENDING" || ord.status === "CONFIRMED") && (
                          <button
                            type="button"
                            disabled={updatingCode === ord.code}
                            onClick={() => handleUpdateStatus(ord.code, "SHIPPING")}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                            title="Click Duyệt Đơn ➔ Chuyển sang SHIPPING"
                          >
                            Duyệt Đơn
                          </button>
                        )}

                        {ord.status === "SHIPPING" && (
                          <button
                            type="button"
                            disabled={updatingCode === ord.code}
                            onClick={() => handleUpdateStatus(ord.code, "COMPLETED")}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                            title="Click Giao Thành Công ➔ Chuyển sang COMPLETED"
                          >
                            Giao Thành Công
                          </button>
                        )}

                        {ord.status !== "CANCELLED" && ord.status !== "COMPLETED" && (
                          <button
                            type="button"
                            disabled={updatingCode === ord.code}
                            onClick={() => setCancellingOrderCode(ord.code)}
                            className="px-2 py-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                            title="Click Hủy Đơn ➔ Chuyển sang CANCELLED (tự động cộng lại tồn kho!)"
                          >
                            Hủy Đơn
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          size="lg"
          title={
            <div className="flex items-center gap-2">
              <span>Chi Tiết Đơn Hàng #{selectedOrder.code}</span>
              <StatusBadge status={selectedOrder.status} size="sm" />
            </div>
          }
          description={`Thời gian đặt: ${selectedOrder.time}`}
          footer={
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">
                Mã đơn: #{selectedOrder.code}
              </span>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            {/* Thông tin khách hàng & Địa chỉ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground block uppercase tracking-wider mb-1">
                  Khách Hàng Nhận Hàng
                </span>
                <p className="font-bold text-foreground text-sm">{selectedOrder.customer}</p>
                <p className="text-muted-foreground font-mono mt-0.5">
                  Số điện thoại: <strong>{selectedOrder.phone}</strong>
                </p>
                <p className="text-muted-foreground mt-1">Địa chỉ: {selectedOrder.address}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-muted-foreground block uppercase tracking-wider mb-1">
                  Thanh Toán & Ghi Chú
                </span>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      selectedOrder.paymentMethod === "VIETQR"
                        ? "bg-primary/10 text-primary border border-primary/25"
                        : "bg-secondary text-foreground border border-border"
                    }`}
                  >
                    {selectedOrder.paymentMethod}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    {selectedOrder.paymentStatusLabel ||
                      (selectedOrder.paymentStatus === "PAID"
                        ? "Đã thanh toán"
                        : "Chưa thanh toán")}
                  </span>
                </div>

                <div className="mt-2 text-muted-foreground bg-background/50 p-2 rounded-lg border border-border/60">
                  <span className="font-semibold text-foreground">Ghi chú khách:</span>{" "}
                  {selectedOrder.note || "Không có ghi chú"}
                </div>
              </div>
            </div>

            {/* Từng món hàng trong đơn */}
            <div>
              <h4 className="font-bold text-foreground text-sm mb-2.5 flex items-center justify-between">
                <span>Danh Sách Sản Phẩm Đặt Mua</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {selectedOrder.itemsList.reduce((acc, cur) => acc + cur.qty, 0)} sản phẩm
                </span>
              </h4>

              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                      <th className="py-2.5 px-3">Tên Sản Phẩm</th>
                      <th className="py-2.5 px-3">Biến Thể</th>
                      <th className="py-2.5 px-3">Đơn Giá</th>
                      <th className="py-2.5 px-3 text-center">SL</th>
                      <th className="py-2.5 px-3 text-right">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {selectedOrder.itemsList.map((item, idx) => (
                      <tr
                        key={item.id || `${selectedOrder.id}-${item.name}-${item.variant}-${idx}`}
                        className="hover:bg-muted/20"
                      >
                        <td className="py-2.5 px-3 font-semibold text-foreground">{item.name}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{item.variant}</td>
                        <td className="py-2.5 px-3 font-mono">{formatVND(item.price)}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-foreground">
                          {item.qty}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                          {formatVND(item.price * item.qty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 border-t border-border font-bold">
                      <td colSpan={4} className="py-2.5 px-3 text-right text-muted-foreground">
                        Tổng cộng tiền hàng:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-primary">
                        {formatVND(selectedOrder.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Chuyển nhanh trạng thái trong modal */}
            {selectedOrder.status !== "COMPLETED" && selectedOrder.status !== "CANCELLED" && (
              <div className="p-3.5 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-foreground block">
                    Chuyển Trạng Thái Đơn Hàng Nhanh:
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Hủy đơn sẽ tự động hoàn trả số lượng vào kho dữ liệu
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedOrder.status !== "SHIPPING" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.code, "SHIPPING")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                    >
                      Duyệt Đơn (SHIPPING)
                    </button>
                  )}

                  {selectedOrder.status === "SHIPPING" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.code, "COMPLETED")}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                    >
                      Giao Thành Công (COMPLETED)
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setCancellingOrderCode(selectedOrder.code)}
                    className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all cursor-pointer"
                  >
                    Hủy Đơn (CANCELLED - Hoàn Kho)
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      <ConfirmModal
        isOpen={Boolean(cancellingOrderCode)}
        onClose={() => setCancellingOrderCode(null)}
        onConfirm={confirmCancelOrder}
        title="Xác nhận hủy đơn hàng"
        message={
          cancellingOrderCode
            ? `Bạn có chắc chắn muốn HỦY đơn #${cancellingOrderCode}? Hệ thống sẽ tự động hoàn trả lại số lượng tồn kho cho các sản phẩm trong đơn!`
            : ""
        }
        confirmText="Hủy đơn"
        cancelText="Giữ lại"
        variant="danger"
        isLoading={Boolean(cancellingOrderCode && updatingCode === cancellingOrderCode)}
      />
    </div>
  );
}
