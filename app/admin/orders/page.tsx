"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import orderApiRequest from "@/apiRequest/order";
import { formatVND } from "@/lib/format";
import { emitSyncEvent, useAutoSync } from "@/lib/sync";

export interface AdminOrderItem {
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
  paymentMethod: "VIETQR" | "COD" | string;
  paymentStatus: string;
  status: "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED";
  time: string;
  createdAt?: string;
  note?: string;
}

type FilterStatus = "ALL" | "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);
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
  const mapOrder = useCallback((o: {
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
      productName: string;
      variantName: string;
      price: number;
      quantity: number;
    }>;
    createdAt: string;
  }): AdminOrder => {
    const rawStatus = (o.orderStatus || "PENDING").toUpperCase();
    const status = (["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"].includes(rawStatus)
      ? rawStatus
      : "PENDING") as AdminOrder["status"];

    let paymentStatusLabel = o.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán";
    if (o.paymentMethod === "VIETQR") {
      paymentStatusLabel = o.paymentStatus === "PAID" ? "Đã thanh toán (Napas247)" : "Chờ đối soát";
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
      itemsList: (o.items || []).map((it) => ({
        name: it.productName || "Sản phẩm",
        variant: it.variantName || "Tiêu chuẩn",
        qty: it.quantity || 1,
        price: Number(it.price) || 0,
      })),
      total: Number(o.totalAmount) || 0,
      paymentMethod: o.paymentMethod || "COD",
      paymentStatus: paymentStatusLabel,
      status,
      time: o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "---",
      createdAt: o.createdAt,
      note: o.note || "",
    };
  }, []);

  // Fetch real orders from Spring Boot Backend
  const fetchOrders = useCallback(async (isSilent = false) => {
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
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const message =
        errorObj.response?.data?.message ||
        errorObj.message ||
        "Không thể tải danh sách đơn hàng từ máy chủ. Vui lòng kiểm tra kết nối.";
      if (!isSilent) {
        setFetchError(message);
      }
    } finally {
      if (!isSilent) {
        setIsLoading(false);
      }
    }
  }, [mapOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        errorObj.response?.data?.message ||
        `Lỗi khi cập nhật trạng thái đơn #${orderCode}. Vui lòng thử lại.`;

      setToastMessage({ type: "error", text: errorMessage });
    } finally {
      setUpdatingCode(null);
    }
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
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all transform animate-in fade-in slide-in-from-bottom-4 duration-200 border ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-950/20"
              : toastMessage.type === "error"
              ? "bg-rose-600 text-white border-rose-500 shadow-rose-950/20"
              : "bg-zinc-800 text-white border-zinc-700 shadow-zinc-950/20"
          }`}
        >
          {toastMessage.type === "success" && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
          {toastMessage.type === "error" && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {toastMessage.type === "info" && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-75 text-white/80 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Quản Lý Đơn Hàng */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Quản Lý Đơn Hàng
            </h1>
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
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={isLoading ? "animate-spin text-primary" : ""}
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            <span>{isLoading ? "Đang tải..." : "Làm Mới"}</span>
          </button>

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Về Tổng Quan</span>
          </Link>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {fetchError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
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
              statusFilter === "ALL"
                ? "bg-white/20 text-white"
                : "bg-muted text-foreground"
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
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn (TF-...), tên khách, SĐT..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="text-xs text-muted-foreground self-end sm:self-auto">
          Hiển thị{" "}
          <strong className="text-foreground font-bold">{filteredOrders.length}</strong> / {orders.length} đơn hàng thực tế
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
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </div>
                    <p className="font-semibold text-sm">Không tìm thấy đơn hàng phù hợp</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchQuery
                        ? "Thử điều chỉnh từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác"
                        : "Chưa có đơn hàng nào trong hệ thống với trạng thái này"}
                    </p>
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
                            ord.paymentStatus.includes("Đã")
                              ? "text-emerald-600 dark:text-emerald-400"
                              : ord.paymentStatus.includes("hủy")
                              ? "text-rose-500"
                              : "text-amber-500"
                          }`}
                        >
                          {ord.paymentStatus}
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
                          {ord.status === "PENDING" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Chờ duyệt
                            </span>
                          )}
                          {ord.status === "CONFIRMED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                              Đã xác nhận
                            </span>
                          )}
                          {ord.status === "SHIPPING" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect width="16" height="13" x="1" y="6" rx="2" />
                                <circle cx="17.5" cy="18.5" r="2.5" />
                                <circle cx="5.5" cy="18.5" r="2.5" />
                              </svg>
                              Đang giao
                            </span>
                          )}
                          {ord.status === "COMPLETED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Đã hoàn thành
                            </span>
                          )}
                          {ord.status === "CANCELLED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                              </svg>
                              Đã hủy (Đã hoàn kho)
                            </span>
                          )}
                        </div>

                        {/* Dropdown chuyển nhanh trạng thái */}
                        {ord.status !== "COMPLETED" && ord.status !== "CANCELLED" && (
                          <select
                            value={ord.status}
                            disabled={updatingCode === ord.code}
                            onChange={(e) =>
                              handleUpdateStatus(
                                ord.code,
                                e.target.value as "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED"
                              )
                            }
                            className="h-7 text-[11px] rounded-lg bg-background border border-border px-2 text-foreground focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
                          >
                            <option value="PENDING" disabled>⏳ Chờ duyệt</option>
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
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn HỦY đơn #${ord.code}?\nHệ thống sẽ tự động hoàn trả lại số lượng tồn kho cho các sản phẩm trong đơn!`)) {
                                handleUpdateStatus(ord.code, "CANCELLED");
                              }
                            }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    Chi Tiết Đơn Hàng #{selectedOrder.code}
                  </h3>
                  {selectedOrder.status === "PENDING" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      Chờ duyệt
                    </span>
                  )}
                  {selectedOrder.status === "CONFIRMED" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                      Đã xác nhận
                    </span>
                  )}
                  {selectedOrder.status === "SHIPPING" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                      Đang giao hàng
                    </span>
                  )}
                  {selectedOrder.status === "COMPLETED" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Đã hoàn thành
                    </span>
                  )}
                  {selectedOrder.status === "CANCELLED" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      Đã hủy (Đã hoàn kho)
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Thời gian đặt: {selectedOrder.time}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
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
                  <p className="text-muted-foreground mt-1">
                    Địa chỉ: {selectedOrder.address}
                  </p>
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
                      {selectedOrder.paymentStatus}
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
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-semibold text-foreground">
                            {item.name}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {item.variant}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {formatVND(item.price)}
                          </td>
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
                      onClick={() => {
                        if (confirm(`Bạn có chắc chắn muốn HỦY đơn #${selectedOrder.code}?\nTồn kho sẽ được cộng lại tự động!`)) {
                          handleUpdateStatus(selectedOrder.code, "CANCELLED");
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all cursor-pointer"
                    >
                      Hủy Đơn (CANCELLED - Hoàn Kho)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
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
          </div>
        </div>
      )}
    </div>
  );
}
