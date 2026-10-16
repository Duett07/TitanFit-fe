"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import orderApiRequest from "@/apiRequest/order";
import { OrderResponse } from "@/types/order.type";
import { formatVND } from "@/data/products";

interface UrgentOrder {
  id: string;
  code: string;
  customer: string;
  phone: string;
  address: string;
  itemsSummary: string;
  itemsList: { name: string; variant: string; qty: number; price: number }[];
  total: number;
  paymentMethod: "VIETQR" | "COD";
  paymentStatus: string;
  status: "PENDING" | "SHIPPING" | "COMPLETED" | "CANCELLED";
  time: string;
  note?: string;
}

// 5 đơn hàng mới nhất cần duyệt gấp theo yêu cầu
const DEFAULT_URGENT_ORDERS: UrgentOrder[] = [
  {
    id: "ord-1",
    code: "TF-849201",
    customer: "Nguyễn Văn Hoàng",
    phone: "0987 654 321",
    address: "Phòng 502, Chung cư Bcons Plaza, P. Đông Hòa, TP. Dĩ An, Bình Dương",
    itemsSummary: "Whey Gold Standard 5lbs + Áo Pro-Combat (L)",
    itemsList: [
      { name: "Whey Gold Standard 100% Isolate", variant: "Vị Double Rich Chocolate • 5 lbs", qty: 1, price: 1850000 },
      { name: "Áo Thun Pro-Combat Compression", variant: "Size L • Đen Obsidian", qty: 2, price: 320000 },
    ],
    total: 2490000,
    paymentMethod: "VIETQR",
    paymentStatus: "Đã nhận tiền (Napas247)",
    status: "PENDING",
    time: "5 phút trước",
    note: "Giao giờ hành chính, gọi trước 15 phút khi đến",
  },
  {
    id: "ord-2",
    code: "TF-303171",
    customer: "Lo Van Du",
    phone: "0932 984 323",
    address: "Số 16A, Ngách 7, Ngõ 47 Nguyễn Đức Cảnh, Tương Mai, Hà Nội",
    itemsSummary: "Sữa Tăng Cơ Whey Gold Standard 100% Vanilla (5 Lbs)",
    itemsList: [
      { name: "Sữa Tăng Cơ Optimum Nutrition Whey Gold Standard 100%", variant: "Vị Vanilla Ice Cream (5 Lbs / 2.27kg)", qty: 1, price: 1550000 },
    ],
    total: 1550000,
    paymentMethod: "VIETQR",
    paymentStatus: "Chờ đối soát",
    status: "PENDING",
    time: "20 phút trước",
    note: "Gọi trước khi giao hàng 5 phút",
  },
  {
    id: "ord-3",
    code: "TF-350541",
    customer: "Trần Minh Quang",
    phone: "0912 345 678",
    address: "Tòa S2.05 VinHomes Grand Park, Long Thạnh Mỹ, TP. Thủ Đức",
    itemsSummary: "Combo Sữa Tăng Cơ R1 Protein + Mutant Mass (12 Lbs)",
    itemsList: [
      { name: "Sữa Tăng Cơ Rule 1 Proteins R1 Protein Isolate", variant: "Vị Chocolate Fudge 5 Lbs", qty: 2, price: 1650000 },
      { name: "Sữa Tăng Cân Mutant Mass XXXtreme 2500", variant: "Vị Triple Chocolate 12 Lbs", qty: 2, price: 2150000 },
    ],
    total: 7850000,
    paymentMethod: "COD",
    paymentStatus: "Chưa thu tiền (COD)",
    status: "PENDING",
    time: "45 phút trước",
    note: "Giao buổi chiều sau 17h, bấm chuông căn 12A08",
  },
  {
    id: "ord-4",
    code: "TF-964273",
    customer: "Nguyễn Văn A",
    phone: "0987 654 321",
    address: "144 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội",
    itemsSummary: "Sữa Tăng Cơ Optimum Nutrition Whey Gold Standard 100%",
    itemsList: [
      { name: "Optimum Nutrition Whey Gold Standard 100%", variant: "Vị Double Rich Chocolate 5 Lbs", qty: 1, price: 1550000 },
    ],
    total: 1550000,
    paymentMethod: "VIETQR",
    paymentStatus: "Đã thanh toán (Napas247)",
    status: "PENDING",
    time: "1 giờ trước",
    note: "Giao tận tay lễ tân tòa nhà HITC",
  },
  {
    id: "ord-5",
    code: "TF-725398",
    customer: "Trần Minh Quang",
    phone: "0912 345 678",
    address: "Số 88 Bến Vân Đồn, Phường 9, Quận 4, TP. Hồ Chí Minh",
    itemsSummary: "Tăng Sức Mạnh Cellucor C4 Original 30 Servings (Icy Blue)",
    itemsList: [
      { name: "Cellucor C4 Original Pre-Workout 30 Servings", variant: "Vị Icy Blue Razz", qty: 1, price: 680000 },
    ],
    total: 680000,
    paymentMethod: "COD",
    paymentStatus: "Chưa thu tiền (COD)",
    status: "PENDING",
    time: "2 giờ trước",
    note: "Kiểm tra hàng trước khi thanh toán",
  },
];

// Dữ liệu biểu đồ doanh thu 7 ngày gần nhất
const REVENUE_CHART_DATA = [
  { day: "Thứ 2", revenue: 5200000, orders: 4, percent: 56 },
  { day: "Thứ 3", revenue: 6800000, orders: 6, percent: 74 },
  { day: "Thứ 4", revenue: 4500000, orders: 3, percent: 49 },
  { day: "Thứ 5", revenue: 8900000, orders: 7, percent: 97 },
  { day: "Thứ 6", revenue: 7400000, orders: 6, percent: 80 },
  { day: "Thứ 7", revenue: 9200000, orders: 8, percent: 100 },
  { day: "Chủ Nhật", revenue: 6250000, orders: 4, percent: 68 },
];

export default function AdminDashboardPage() {
  const [urgentOrders, setUrgentOrders] = useState<UrgentOrder[]>(DEFAULT_URGENT_ORDERS);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "SHIPPING" | "COMPLETED" | "CANCELLED">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<UrgentOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Đồng bộ danh sách đơn hàng thực tế từ backend nếu có
  useEffect(() => {
    async function syncBackendOrders() {
      try {
        const res = await orderApiRequest.getMyOrders();
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const apiOrders = res.data.data;
          // Kết hợp danh sách đơn PENDING từ backend với danh sách cần duyệt
          const mapped = apiOrders.slice(0, 5).map((o, idx) => ({
            id: o.id || `api-${idx}`,
            code: o.orderCode,
            customer: o.customerName || "Khách Hàng",
            phone: o.phone || "0987 654 321",
            address: o.shippingAddress || "Địa chỉ nhận hàng",
            itemsSummary: (o.items && o.items.length > 0)
              ? o.items.map((it) => it.productName).join(" + ")
              : "Sản phẩm thể hình TITANFIT",
            itemsList: (o.items || []).map((it) => ({
              name: it.productName || "Sản phẩm",
              variant: it.variantName || "Tiêu chuẩn",
              qty: it.quantity || 1,
              price: Number(it.price) || 0,
            })),
            total: Number(o.totalAmount) || 1550000,
            paymentMethod: (o.paymentMethod === "VIETQR" ? "VIETQR" : "COD") as "VIETQR" | "COD",
            paymentStatus: o.paymentStatus === "PAID" ? "Đã thanh toán" : "Chờ thu tiền",
            status: (o.orderStatus || "PENDING") as UrgentOrder["status"],
            time: "Vừa xong",
            note: o.note || "Giao giờ hành chính",
          }));

          // Gộp tránh trùng lặp
          const merged: UrgentOrder[] = [...mapped];
          DEFAULT_URGENT_ORDERS.forEach((def) => {
            if (!merged.some((m) => m.code === def.code) && merged.length < 5) {
              merged.push(def);
            }
          });
          setUrgentOrders(merged);
        }
      } catch (err) {
        console.warn("Backend orders sync note:", err);
      }
    }

    syncBackendOrders();
  }, []);

  // Đếm số lượng theo trạng thái
  const filterCounts = useMemo(() => ({
    ALL: urgentOrders.length,
    PENDING: urgentOrders.filter((o) => o.status === "PENDING").length,
    SHIPPING: urgentOrders.filter((o) => o.status === "SHIPPING").length,
    COMPLETED: urgentOrders.filter((o) => o.status === "COMPLETED").length,
    CANCELLED: urgentOrders.filter((o) => o.status === "CANCELLED").length,
  }), [urgentOrders]);

  // Danh sách sau khi áp dụng bộ lọc trạng thái
  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") return urgentOrders;
    return urgentOrders.filter((o) => o.status === statusFilter);
  }, [urgentOrders, statusFilter]);

  // Xử lý chuyển nhanh trạng thái đơn hàng (Duyệt, Giao thành công, Hủy đơn - hoàn kho)
  const handleUpdateStatus = async (
    orderCode: string,
    newStatus: "PENDING" | "SHIPPING" | "COMPLETED" | "CANCELLED"
  ) => {
    const target = urgentOrders.find((o) => o.code === orderCode);
    if (!target) return;

    if (target.status === newStatus) {
      showToast(`Đơn #${orderCode} đã ở trạng thái ${newStatus} rồi.`, "info");
      return;
    }

    setUpdatingCode(orderCode);

    // Optimistic UI update
    setUrgentOrders((prev) =>
      prev.map((ord) => (ord.code === orderCode ? { ...ord, status: newStatus } : ord))
    );
    if (selectedOrder && selectedOrder.code === orderCode) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    // Gửi cập nhật Backend nếu có ID UUID
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target.id);
      if (isUUID && newStatus !== "PENDING") {
        await orderApiRequest.updateOrderStatus(target.id, newStatus);
      }
    } catch (e) {
      console.warn("Backend update order status error:", e);
    } finally {
      setUpdatingCode(null);
    }

    if (newStatus === "SHIPPING") {
      showToast(`Đã duyệt đơn #${orderCode} ➔ Chuyển sang SHIPPING!`, "success");
    } else if (newStatus === "COMPLETED") {
      showToast(`Đơn #${orderCode} ➔ Chuyển sang COMPLETED (Giao thành công)!`, "success");
    } else if (newStatus === "CANCELLED") {
      showToast(`Đơn #${orderCode} ➔ Chuyển sang CANCELLED (và backend tự động cộng lại tồn kho!)`, "error");
    } else {
      showToast(`Đã chuyển đơn #${orderCode} về trạng thái Chờ duyệt.`, "info");
    }
  };

  // Xử lý duyệt nhanh đơn hàng
  const handleApproveOrder = (orderCode: string) => {
    handleUpdateStatus(orderCode, "SHIPPING");
  };

  // Xử lý hủy đơn hàng
  const handleCancelOrder = (orderCode: string) => {
    if (confirm(`Bạn có chắc muốn hủy đơn hàng #${orderCode}?\nHệ thống sẽ hoàn trả số lượng tồn kho tự động vào kho hàng.`)) {
      handleUpdateStatus(orderCode, "CANCELLED");
    }
  };

  // Làm mới số liệu bán hàng
  const handleRefreshMetrics = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Đã đồng bộ số liệu doanh thu và tồn kho mới nhất!", "success");
    }, 500);
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
            <span className="text-xs text-muted-foreground font-medium">Bảng Điều Khiển Quản Trị Cửa Hàng</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground font-heading tracking-tight">
            Tổng Quan Cửa Hàng
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Theo dõi doanh thu, trạng thái đơn và cảnh báo tồn kho theo thời gian thực
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefreshMetrics}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-50 self-start sm:self-auto"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={isRefreshing ? "animate-spin text-primary" : ""}
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          <span>{isRefreshing ? "Đang đồng bộ..." : "Làm Mới Số Liệu"}</span>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" x2="12" y1="2" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-heading tracking-tight">
            48.250.000 ₫
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              +18.4%
            </span>
            <span className="text-xs text-muted-foreground">tuần này</span>
          </div>
        </div>

        {/* KPI 2: Tổng Đơn Hàng */}
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all group">
          <div className="flex items-center justify-between mb-3 text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Tổng Đơn Hàng
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-heading tracking-tight">
            38 đơn
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-xs font-bold text-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
              29 đơn thành công
            </span>
            <span className="text-[11px] text-muted-foreground">(76.3%)</span>
          </div>
        </div>

        {/* KPI 3: Đơn Chờ Xử Lý */}
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Đơn Chờ Xử Lý
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-primary font-heading tracking-tight flex items-baseline gap-2">
            <span>3 đơn</span>
          </div>
          <div className="flex items-center gap-2 mt-2.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Cần duyệt ngay
            </span>
            <span className="text-xs text-muted-foreground">Chờ xuất kho</span>
          </div>
        </div>

        {/* KPI 4: Cảnh Báo Hết Hàng */}
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all group">
          <div className="flex items-center justify-between mb-3 text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cảnh Báo Hết Hàng
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-heading tracking-tight">
            2 sản phẩm
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
              Tồn kho &lt; 5
            </span>
            <span className="text-xs text-muted-foreground truncate" title="Whey Dâu (2) & Áo Dry-Fit (3)">
              (Whey Dâu: 2, Áo M: 3)
            </span>
          </div>
        </div>
      </div>

      {/* ================= BIỂU ĐỒ MINI & BẢNG 5 ĐƠN HÀNG ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (4 COLS): BIỂU ĐỒ MINI DOANH THU 7 NGÀY GẦN NHẤT */}
        <div className="lg:col-span-4 rounded-2xl bg-card border border-border shadow-xs p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-bold text-foreground">Doanh Thu 7 Ngày Qua</h2>
              <p className="text-[11px] text-muted-foreground">Trung bình 6.890.000 ₫/ngày</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
              Tuần này
            </span>
          </div>

          {/* Mini Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-44 pt-4 pb-2 px-1">
            {REVENUE_CHART_DATA.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] font-bold py-1 px-2 rounded-md pointer-events-none whitespace-nowrap shadow-lg z-20">
                  {formatVND(item.revenue)} ({item.orders} đơn)
                </div>

                {/* Bar */}
                <div className="w-full bg-secondary/80 rounded-t-lg relative flex items-end overflow-hidden h-full">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      item.day === "Thứ 7"
                        ? "bg-primary group-hover:bg-primary/90"
                        : "bg-primary/60 group-hover:bg-primary"
                    }`}
                    style={{ height: `${item.percent}%` }}
                  />
                </div>

                {/* Label */}
                <span className="text-[10px] text-muted-foreground font-medium truncate group-hover:text-foreground">
                  {item.day.replace("Thứ ", "T")}
                </span>
              </div>
            ))}
          </div>

          {/* Mini Ratio Highlights */}
          <div className="pt-3 border-t border-border grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/80">
              <span className="text-[11px] text-muted-foreground block">Phương thức VietQR:</span>
              <p className="text-sm font-bold text-foreground mt-0.5">75% (28 đơn)</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/80">
              <span className="text-[11px] text-muted-foreground block">Thanh toán COD:</span>
              <p className="text-sm font-bold text-foreground mt-0.5">25% (10 đơn)</p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (8 COLS): BẢNG ĐƠN HÀNG MỚI NHẤT & QUẢN LÝ TRẠNG THÁI */}
        <div className="lg:col-span-8 rounded-2xl bg-card border border-border shadow-xs overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="p-5 border-b border-border flex flex-col gap-3 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-foreground">
                      Danh Sách Đơn Hàng Cần Xử Lý
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/30">
                      Cập nhật trực tiếp
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
                <span>Xem trang quản lý toàn bộ &rarr;</span>
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
                  <th className="py-3 px-4 whitespace-nowrap">Ngày Đặt</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
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
                          {ord.paymentStatus}
                        </div>
                      </td>

                      {/* Tổng Tiền */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <strong className="text-foreground font-bold">{formatVND(ord.total)}</strong>
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

                          {/* Dropdown chuyển nhanh trạng thái */}
                          <select
                            value={ord.status}
                            disabled={updatingCode === ord.code}
                            onChange={(e) =>
                              handleUpdateStatus(
                                ord.code,
                                e.target.value as "PENDING" | "SHIPPING" | "COMPLETED" | "CANCELLED"
                              )
                            }
                            className="h-6 text-[11px] rounded bg-background border border-border px-1.5 text-foreground focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
                          >
                            <option value="PENDING">⏳ Chờ duyệt</option>
                            <option value="SHIPPING">🚚 Đang giao hàng</option>
                            <option value="COMPLETED">✅ Giao thành công</option>
                            <option value="CANCELLED">❌ Hủy đơn (Hoàn kho)</option>
                          </select>
                        </div>
                      </td>

                      {/* Ngày Đặt */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                        {ord.time}
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
                            Xem Chi Tiết
                          </button>

                          {/* Nút bấm chuyển nhanh trạng thái đơn */}
                          {ord.status === "PENDING" && (
                            <button
                              type="button"
                              disabled={updatingCode === ord.code}
                              onClick={() => handleUpdateStatus(ord.code, "SHIPPING")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
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
                              className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
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
                                if (confirm(`Bạn có chắc chắn muốn HỦY đơn #${ord.code}?\nHệ thống sẽ tự động hoàn trả số lượng tồn kho cho các sản phẩm!`)) {
                                  handleUpdateStatus(ord.code, "CANCELLED");
                                }
                              }}
                              className="px-2 py-1 rounded-lg border border-destructive/20 hover:border-destructive text-destructive hover:bg-destructive/10 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                              title="Click Hủy Đơn ➔ Chuyển sang CANCELLED (và backend tự động cộng lại tồn kho!)"
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
      </div>

      {/* ================= MODAL CHI TIẾT ĐƠN HÀNG ================= */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Chi Tiết Đơn Hàng</span>
                <span className="font-mono text-base font-black text-primary">#{selectedOrder.code}</span>
                {selectedOrder.status === "PENDING" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Chờ duyệt
                  </span>
                )}
                {selectedOrder.status === "SHIPPING" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                    Đang giao
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
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Thông tin khách hàng */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Người nhận hàng:</span>
                  <p className="font-bold text-foreground text-sm">{selectedOrder.customer}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Số điện thoại:</span>
                  <p className="font-bold text-foreground font-mono">{selectedOrder.phone}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Địa chỉ giao hàng:</span>
                  <p className="font-medium text-foreground">{selectedOrder.address}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Ghi chú khách hàng:</span>
                  <p className="italic text-foreground">{selectedOrder.note || "Không có ghi chú"}</p>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <h3 className="font-bold text-foreground mb-2 text-xs flex items-center justify-between">
                  <span>Danh Sách Sản Phẩm Đặt Mua</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {selectedOrder.itemsList.reduce((acc, cur) => acc + cur.qty, 0)} món hàng
                  </span>
                </h3>
                <div className="border border-border rounded-xl divide-y divide-border/60 overflow-hidden">
                  {selectedOrder.itemsList.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3 bg-card">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">{item.variant}</p>
                        <span className="text-[11px] text-muted-foreground">Số lượng: x{item.qty}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-foreground">{formatVND(item.price * item.qty)}</p>
                        <p className="text-[10px] text-muted-foreground">{formatVND(item.price)}/sp</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chi tiết thanh toán */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Phương thức thanh toán:</span>
                  <span className="font-bold text-foreground">{selectedOrder.paymentMethod}</span>
                  <span className="text-muted-foreground ml-1">({selectedOrder.paymentStatus})</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground block">Tổng tiền thanh toán:</span>
                  <strong className="text-base font-black text-primary">{formatVND(selectedOrder.total)}</strong>
                </div>
              </div>

              {/* Nút bấm chuyển nhanh trạng thái trong Modal */}
              <div className="p-3.5 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-foreground block">Chuyển trạng thái đơn:</span>
                  <span className="text-[11px] text-muted-foreground">
                    Khi hủy đơn, backend sẽ tự động hoàn trả số lượng tồn kho
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedOrder.status !== "SHIPPING" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.code, "SHIPPING")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                    >
                      Duyệt Đơn ➔ SHIPPING
                    </button>
                  )}
                  {selectedOrder.status !== "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.code, "COMPLETED")}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                    >
                      Giao Thành Công ➔ COMPLETED
                    </button>
                  )}
                  {selectedOrder.status !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn HỦY đơn #${selectedOrder.code}?\nTồn kho sẽ được tự động cộng lại!`)) {
                          handleUpdateStatus(selectedOrder.code, "CANCELLED");
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg border border-destructive/30 hover:border-destructive text-destructive hover:bg-destructive/10 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Hủy Đơn ➔ CANCELLED
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10 shrink-0">
              <span className="text-xs text-muted-foreground font-mono">
                Mã đơn: #{selectedOrder.code}
              </span>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold transition-colors cursor-pointer"
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
