"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import orderApiRequest from "@/apiRequest/order";
import productApiRequest from "@/apiRequest/product";
import { ProductSummaryDto, VariantDto } from "@/types/product.type";
import { PaymentMethod, OrderStatus, PaymentStatus } from "@/types/order.type";
import { formatVND } from "@/lib/format";
import { getErrorMessage } from "@/lib/error";
import { emitSyncEvent, useAutoSync } from "@/lib/sync";

interface UrgentOrder {
  id: string;
  code: string;
  customer: string;
  phone: string;
  address: string;
  itemsSummary: string;
  itemsList: { name: string; variant: string; qty: number; price: number }[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentStatusLabel?: string;
  status: OrderStatus;
  time: string;
  createdAt: string;
  note?: string;
}

interface LowStockAlert {
  productName: string;
  variantName: string;
  stock: number;
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<UrgentOrder[]>([]);
  const [lowStockList, setLowStockList] = useState<LowStockAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<UrgentOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch real orders and real low stock products from Spring Boot Backend
  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (isSilent) {
      setIsRefreshing(true);
    }

    try {
      // 1. Fetch Real Orders
      const orderRes = await orderApiRequest.getAllOrders();
      const rawOrders = orderRes.data?.data || [];

      const mappedOrders: UrgentOrder[] = rawOrders.map((o) => {
        const rawStatus = (o.orderStatus || "PENDING").toUpperCase();
        const status = (
          ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"].includes(rawStatus)
            ? rawStatus
            : "PENDING"
        ) as UrgentOrder["status"];

        let paymentStatusLabel = o.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán";
        if (o.paymentMethod === "VIETQR") {
          paymentStatusLabel =
            o.paymentStatus === "PAID" ? "Đã thanh toán (Napas247)" : "Chờ đối soát";
        } else if (o.paymentMethod === "COD") {
          paymentStatusLabel = status === "COMPLETED" ? "Đã thu tiền mặt" : "Chờ thu tiền mặt";
        }
        if (status === "CANCELLED") {
          paymentStatusLabel = "Đã hoàn kho";
        }

        return {
          id: o.id,
          code: o.orderCode,
          customer: o.customerName || "Khách Hàng",
          phone: o.phone || "---",
          address: o.shippingAddress || "Địa chỉ nhận hàng",
          itemsSummary:
            o.items && o.items.length > 0
              ? o.items.map((it) => it.productName).join(" + ")
              : "Sản phẩm thể hình TITANFIT",
          itemsList: (o.items || []).map((it) => ({
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
          createdAt: o.createdAt || "",
          note: o.note || "",
        };
      });

      setOrders(mappedOrders);

      // 2. Fetch Real Products to analyze inventory across full catalog
      try {
        let products: ProductSummaryDto[] = [];
        try {
          const adminProdRes = await productApiRequest.adminGetAllProducts();
          products = adminProdRes.data?.data || [];
        } catch {
          const prodRes = await productApiRequest.getProducts({ size: 100 });
          products = prodRes.data?.data?.content || [];
        }

        const alerts: LowStockAlert[] = [];

        products.forEach((p: ProductSummaryDto) => {
          if (p.variants && Array.isArray(p.variants)) {
            p.variants.forEach((v: VariantDto) => {
              if (v.stockQuantity !== undefined && v.stockQuantity < 10) {
                alerts.push({
                  productName: p.name,
                  variantName: v.variantName || "Tiêu chuẩn",
                  stock: v.stockQuantity,
                });
              }
            });
          }
        });

        // Sắp xếp hàng ít tồn kho nhất lên đầu
        alerts.sort((a, b) => a.stock - b.stock);
        setLowStockList(alerts);
      } catch (prodErr) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Could not fetch product inventory:", prodErr);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Dashboard backend sync error:", err);
      }
      showToast(
        getErrorMessage(err, "Không thể kết nối máy chủ backend. Vui lòng kiểm tra lại dịch vụ."),
        "error"
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        void loadDashboardData();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadDashboardData]);

  // Real-time synchronization: Auto-refresh dashboard KPIs and urgent orders
  useAutoSync({
    eventTypes: ["ORDER_UPDATED", "PRODUCT_UPDATED", "INVENTORY_UPDATED"],
    onSync: () => loadDashboardData(true),
    intervalMs: 60000,
    enableFocusSync: true,
  });

  // KPI Calculations from REAL database data
  const totalRevenue = useMemo(() => {
    return orders.filter((o) => o.status !== "CANCELLED").reduce((acc, cur) => acc + cur.total, 0);
  }, [orders]);

  const totalOrdersCount = orders.length;
  const completedOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === "COMPLETED").length;
  }, [orders]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED").length;
  }, [orders]);

  // Dynamic 7-Day Revenue Chart Data
  const chartData = useMemo(() => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const today = new Date();
    const result: { day: string; revenue: number; orders: number; percent: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().slice(0, 10);

      // Tính tổng doanh thu và số đơn của ngày đó
      const matchedOrders = orders.filter((o) => {
        if (!o.createdAt) return false;
        return o.createdAt.startsWith(dateStr) && o.status !== "CANCELLED";
      });

      const dayRevenue = matchedOrders.reduce((sum, ord) => sum + ord.total, 0);
      result.push({
        day: dayName,
        revenue: dayRevenue,
        orders: matchedOrders.length,
        percent: 0,
      });
    }

    const maxRev = Math.max(...result.map((r) => r.revenue), 1);
    return result.map((r) => ({
      ...r,
      percent: Math.max(12, Math.round((r.revenue / maxRev) * 100)),
    }));
  }, [orders]);

  // Payment Breakdown
  const paymentStats = useMemo(() => {
    const total = orders.length || 1;
    const vietqr = orders.filter((o) => o.paymentMethod === "VIETQR").length;
    const cod = orders.filter((o) => o.paymentMethod === "COD").length;
    return {
      vietqrCount: vietqr,
      vietqrPercent: Math.round((vietqr / total) * 100),
      codCount: cod,
      codPercent: Math.round((cod / total) * 100),
    };
  }, [orders]);

  // Filtered orders for table
  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const filterCounts = useMemo(
    () => ({
      ALL: orders.length,
      PENDING: orders.filter((o) => o.status === "PENDING").length,
      CONFIRMED: orders.filter((o) => o.status === "CONFIRMED").length,
      SHIPPING: orders.filter((o) => o.status === "SHIPPING").length,
      COMPLETED: orders.filter((o) => o.status === "COMPLETED").length,
      CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
    }),
    [orders]
  );

  // Handle status update
  const handleUpdateStatus = async (
    orderCode: string,
    newStatus: "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED"
  ) => {
    const target = orders.find((o) => o.code === orderCode);
    if (!target) return;

    if (target.status === newStatus) {
      showToast(`Đơn #${orderCode} đã ở trạng thái ${newStatus} rồi.`, "info");
      return;
    }

    setUpdatingCode(orderCode);
    const previousOrders = [...orders];

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((ord) => (ord.code === orderCode ? { ...ord, status: newStatus } : ord))
    );
    if (selectedOrder && selectedOrder.code === orderCode) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      await orderApiRequest.updateOrderStatus(target.id, newStatus);
      if (newStatus === "SHIPPING") {
        showToast(`Đã duyệt đơn #${orderCode} ➔ Chuyển sang SHIPPING!`, "success");
      } else if (newStatus === "COMPLETED") {
        showToast(`Đơn #${orderCode} ➔ Chuyển sang COMPLETED (Giao thành công)!`, "success");
      } else if (newStatus === "CANCELLED") {
        showToast(
          `Đơn #${orderCode} ➔ Chuyển sang CANCELLED (backend tự động cộng lại tồn kho!)`,
          "error"
        );
      } else {
        showToast(`Đã xác nhận đơn #${orderCode}.`, "info");
      }

      // Phát sự kiện đồng bộ thời gian thực sang tab Buyer và các trang khác
      emitSyncEvent("ORDER_UPDATED", { orderCode, status: newStatus });
      if (newStatus === "CANCELLED") {
        emitSyncEvent("INVENTORY_UPDATED");
      }

      // Re-sync with backend silently
      loadDashboardData(true);
    } catch (e: unknown) {
      setOrders(previousOrders);
      if (selectedOrder && selectedOrder.code === orderCode) {
        setSelectedOrder(previousOrders.find((o) => o.code === orderCode) || null);
      }
      showToast(getErrorMessage(e, "Cập nhật trạng thái thất bại"), "error");
    } finally {
      setUpdatingCode(null);
    }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-950 text-emerald-100 border-emerald-800"
              : toastMessage.type === "error"
                ? "bg-rose-950 text-rose-100 border-rose-800"
                : "bg-zinc-900 text-zinc-100 border-zinc-700"
          }`}
        >
          {toastMessage.type === "success" && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-primary/10 text-primary border border-primary/20">
              TITANFIT ADMIN
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Kết Nối API Thật Spring Boot (Port 8080)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground font-heading tracking-tight">
            Tổng Quan Cửa Hàng
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Dữ liệu thực tế từ cơ sở dữ liệu MySQL titanfit • Theo dõi doanh thu & trạng thái đơn
            hàng
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboardData(true)}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-50 self-start sm:self-auto"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={isRefreshing || isLoading ? "animate-spin text-primary" : ""}
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          <span>{isRefreshing ? "Đang đồng bộ..." : "Làm Mới Dữ Liệu"}</span>
        </button>
      </div>

      {/* ================= 4 THẺ KPI ĐỘNG ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Tổng Doanh Thu */}
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all group">
          <div className="flex items-center justify-between mb-3 text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Tổng Doanh Thu
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" x2="12" y1="2" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-heading tracking-tight">
            {isLoading ? "---" : formatVND(totalRevenue)}
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Đơn hợp lệ
            </span>
            <span className="text-xs text-muted-foreground">loại trừ đơn hủy</span>
          </div>
        </div>

        {/* KPI 2: Tổng Đơn Hàng */}
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all group">
          <div className="flex items-center justify-between mb-3 text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Tổng Đơn Hàng
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-heading tracking-tight">
            {isLoading ? "---" : `${totalOrdersCount} đơn`}
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-xs font-bold text-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
              {completedOrdersCount} đơn hoàn thành
            </span>
            <span className="text-[11px] text-muted-foreground">
              (
              {totalOrdersCount > 0
                ? Math.round((completedOrdersCount / totalOrdersCount) * 100)
                : 0}
              %)
            </span>
          </div>
        </div>

        {/* KPI 3: Đơn Chờ Xử Lý */}
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Đơn Chờ Xử Lý
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-primary font-heading tracking-tight flex items-baseline gap-2">
            <span>{isLoading ? "---" : `${pendingOrdersCount} đơn`}</span>
          </div>
          <div className="flex items-center gap-2 mt-2.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Cần duyệt
            </span>
            <span className="text-xs text-muted-foreground">Chờ xuất kho</span>
          </div>
        </div>

        {/* KPI 4: Cảnh Báo Tồn Kho */}
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all group">
          <div className="flex items-center justify-between mb-3 text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cảnh Báo Tồn Kho
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-heading tracking-tight">
            {isLoading ? "---" : `${lowStockList.length} SKU`}
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
              Tồn kho &lt; 10
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {lowStockList.length > 0
                ? `(${lowStockList[0].productName.slice(0, 15)}... : ${lowStockList[0].stock})`
                : "Kho hàng an toàn"}
            </span>
          </div>
        </div>
      </div>

      {/* ================= BIỂU ĐỒ DOANH THU THỰC TẾ & BẢNG ĐƠN HÀNG ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (4 COLS): BIỂU ĐỒ DOANH THU 7 NGÀY QUA */}
        <div className="lg:col-span-4 rounded-2xl bg-card border border-border shadow-xs p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-bold text-foreground">Doanh Thu 7 Ngày Qua</h2>
              <p className="text-[11px] text-muted-foreground">
                Dựa trên thời gian tạo đơn thực tế
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
              Thực tế
            </span>
          </div>

          {/* Dynamic Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-44 pt-4 pb-2 px-1">
            {chartData.map((item, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] font-bold py-1 px-2 rounded-md pointer-events-none whitespace-nowrap shadow-lg z-20">
                  {formatVND(item.revenue)} ({item.orders} đơn)
                </div>

                {/* Bar */}
                <div className="w-full bg-secondary/80 rounded-t-lg relative flex items-end overflow-hidden h-full">
                  <div
                    className="w-full rounded-t-lg bg-primary/70 group-hover:bg-primary transition-all duration-500"
                    style={{ height: `${item.percent}%` }}
                  />
                </div>

                {/* Label */}
                <span className="text-[10px] text-muted-foreground font-medium truncate group-hover:text-foreground">
                  {item.day}
                </span>
              </div>
            ))}
          </div>

          {/* Payment Method Breakdown */}
          <div className="pt-3 border-t border-border grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/80">
              <span className="text-[11px] text-muted-foreground block">Phương thức VietQR:</span>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {paymentStats.vietqrPercent}% ({paymentStats.vietqrCount} đơn)
              </p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/80">
              <span className="text-[11px] text-muted-foreground block">Thanh toán COD:</span>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {paymentStats.codPercent}% ({paymentStats.codCount} đơn)
              </p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (8 COLS): BẢNG ĐƠN HÀNG THỰC TẾ & XỬ LÝ NHANH */}
        <div className="lg:col-span-8 rounded-2xl bg-card border border-border shadow-xs overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="p-5 border-b border-border flex flex-col gap-3 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-foreground">
                      Danh Sách Đơn Hàng Cần Xử Lý
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Live Backend
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kiểm duyệt đơn, đối soát VietQR và tự động hoàn trả kho khi hủy đơn
                  </p>
                </div>
              </div>

              <Link
                href="/admin/orders"
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Xem toàn bộ {orders.length} đơn &rarr;</span>
              </Link>
            </div>

            {/* Filter Tabs - Bộ lọc trạng thái đơn */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "ALL"
                    ? "bg-primary text-primary-foreground shadow-xs shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span>Tất cả</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20">
                  {filterCounts.ALL}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("PENDING")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "PENDING"
                    ? "bg-amber-500 text-white shadow-xs shadow-amber-500/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Chờ duyệt</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20">
                  {filterCounts.PENDING}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("CONFIRMED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "CONFIRMED"
                    ? "bg-indigo-600 text-white shadow-xs shadow-indigo-600/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span>Đã xác nhận</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20">
                  {filterCounts.CONFIRMED}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("SHIPPING")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "SHIPPING"
                    ? "bg-sky-500 text-white shadow-xs shadow-sky-500/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span>Đang giao</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20">
                  {filterCounts.SHIPPING}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("COMPLETED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "COMPLETED"
                    ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span>Đã hoàn thành</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20">
                  {filterCounts.COMPLETED}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("CANCELLED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "CANCELLED"
                    ? "bg-rose-600 text-white shadow-xs shadow-rose-600/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span>Đã hủy</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20">
                  {filterCounts.CANCELLED}
                </span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4 whitespace-nowrap">Mã Đơn</th>
                  <th className="py-3 px-4 whitespace-nowrap">Khách Hàng</th>
                  <th className="py-3 px-4 whitespace-nowrap">SĐT</th>
                  <th className="py-3 px-4 whitespace-nowrap">Phương Thức</th>
                  <th className="py-3 px-4 whitespace-nowrap">Tổng Tiền</th>
                  <th className="py-3 px-4 whitespace-nowrap">Trạng Thái Đơn</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={`loading-${i}`} className="animate-pulse">
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-muted rounded w-20" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-muted rounded w-28" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-muted rounded w-24" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-muted rounded w-16" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-muted rounded w-20" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-6 bg-muted rounded-full w-24" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="h-7 bg-muted rounded w-20 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                      Không có đơn hàng nào ở trạng thái này.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-muted/20 transition-colors">
                      {/* Mã Đơn */}
                      <td className="py-3.5 px-4 font-mono font-bold text-primary whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(ord);
                            setIsDetailModalOpen(true);
                          }}
                          className="hover:underline text-left cursor-pointer"
                        >
                          #{ord.code}
                        </button>
                        <span className="block text-[10px] text-muted-foreground font-normal truncate max-w-[130px]">
                          {ord.itemsSummary}
                        </span>
                      </td>

                      {/* Khách Hàng */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-foreground">{ord.customer}</div>
                        <span className="text-[10px] text-muted-foreground truncate block max-w-[140px]">
                          {ord.address}
                        </span>
                      </td>

                      {/* SĐT */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-muted-foreground">
                        {ord.phone}
                      </td>

                      {/* Phương Thức (COD / VietQR) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            ord.paymentMethod === "VIETQR"
                              ? "bg-primary/10 text-primary border border-primary/25"
                              : "bg-secondary text-foreground border border-border"
                          }`}
                        >
                          {ord.paymentMethod}
                        </span>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {ord.paymentStatusLabel ||
                            (ord.paymentStatus === "PAID" ? "Đã thanh toán" : "Chờ thanh toán")}
                        </div>
                      </td>

                      {/* Tổng Tiền */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <strong className="text-foreground font-bold">
                          {formatVND(ord.total)}
                        </strong>
                      </td>

                      {/* Trạng Thái Đơn + Dropdown Chuyển Nhanh */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          <div>
                            {ord.status === "PENDING" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Chờ duyệt
                              </span>
                            )}
                            {ord.status === "CONFIRMED" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                                Đã xác nhận
                              </span>
                            )}
                            {ord.status === "SHIPPING" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                                Đang giao
                              </span>
                            )}
                            {ord.status === "COMPLETED" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                Hoàn thành
                              </span>
                            )}
                            {ord.status === "CANCELLED" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                Đã hủy (Hoàn kho)
                              </span>
                            )}
                          </div>

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
                              className="h-6 text-[11px] rounded bg-background border border-border px-1.5 text-foreground focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
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

                      {/* Cột Hành Động */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Nút Xem Chi Tiết */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-secondary text-foreground text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Xem
                          </button>

                          {(ord.status === "PENDING" || ord.status === "CONFIRMED") && (
                            <button
                              type="button"
                              disabled={updatingCode === ord.code}
                              onClick={() => handleUpdateStatus(ord.code, "SHIPPING")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                              title="Click Duyệt Đơn ➔ Chuyển sang SHIPPING"
                            >
                              Duyệt
                            </button>
                          )}

                          {ord.status === "SHIPPING" && (
                            <button
                              type="button"
                              disabled={updatingCode === ord.code}
                              onClick={() => handleUpdateStatus(ord.code, "COMPLETED")}
                              className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                              Hoàn tất
                            </button>
                          )}

                          {ord.status !== "CANCELLED" && ord.status !== "COMPLETED" && (
                            <button
                              type="button"
                              disabled={updatingCode === ord.code}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Bạn có chắc chắn muốn HỦY đơn #${ord.code}?\nHệ thống sẽ tự động hoàn trả số lượng tồn kho!`
                                  )
                                ) {
                                  handleUpdateStatus(ord.code, "CANCELLED");
                                }
                              }}
                              className="px-2 py-1 rounded-lg border border-destructive/20 hover:border-destructive text-destructive hover:bg-destructive/10 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Hủy
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
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Chi Tiết Đơn Hàng #{selectedOrder.code}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Đặt lúc: {selectedOrder.time} • Trạng thái: {selectedOrder.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                <div>
                  <span className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">
                    Người Nhận
                  </span>
                  <p className="font-bold text-foreground text-sm">{selectedOrder.customer}</p>
                  <p className="text-muted-foreground mt-0.5">SĐT: {selectedOrder.phone}</p>
                  <p className="text-muted-foreground mt-1">Đ/c: {selectedOrder.address}</p>
                </div>
                <div>
                  <span className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">
                    Thanh Toán & Ghi Chú
                  </span>
                  <p className="font-bold text-foreground">
                    {selectedOrder.paymentMethod} -{" "}
                    {selectedOrder.paymentStatusLabel ||
                      (selectedOrder.paymentStatus === "PAID" ? "Đã thanh toán" : "Chờ thanh toán")}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Ghi chú: {selectedOrder.note || "Không có"}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                      <th className="py-2.5 px-3">Sản Phẩm</th>
                      <th className="py-2.5 px-3">Biến Thể</th>
                      <th className="py-2.5 px-3">Đơn Giá</th>
                      <th className="py-2.5 px-3 text-center">SL</th>
                      <th className="py-2.5 px-3 text-right">Tổng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {selectedOrder.itemsList.map((item, idx) => (
                      <tr key={idx}>
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
                        Tổng tiền đơn hàng:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-primary">
                        {formatVND(selectedOrder.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
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
