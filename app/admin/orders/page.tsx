"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import orderApiRequest from "@/apiRequest/order";
import { OrderResponse } from "@/types/order.type";
import { formatVND } from "@/data/products";

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
  status: "PENDING" | "SHIPPING" | "COMPLETED" | "CANCELLED";
  time: string;
  createdAt?: string;
  note?: string;
}

// Danh sách đơn hàng mẫu khởi tạo theo wireframe admin.html
const INITIAL_ORDERS: AdminOrder[] = [
  {
    id: "mock-1",
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
    paymentStatus: "Chờ đối soát",
    status: "PENDING",
    time: "Hôm nay 22:30",
    note: "Giao giờ hành chính, gọi trước 15 phút khi đến",
  },
  {
    id: "mock-2",
    code: "TF-712894",
    customer: "Lê Minh Đức",
    phone: "0912 345 678",
    address: "Tòa Park 3, KĐT Vinhomes Central Park, P. 22, Q. Bình Thạnh, TP. HCM",
    itemsSummary: "Sữa Tăng Cơ Rule 1 Protein 5 Lbs",
    itemsList: [
      { name: "Sữa Tăng Cơ Rule 1 Proteins R1 Protein Isolate", variant: "Vị Vanilla Ice Cream • 5 Lbs", qty: 1, price: 1850000 },
    ],
    total: 1850000,
    paymentMethod: "VIETQR",
    paymentStatus: "Đã thanh toán (Napas247)",
    status: "SHIPPING",
    time: "Hôm nay 18:15",
    note: "Để tại lễ tân sảnh Park 3 nếu không liên lạc được",
  },
  {
    id: "mock-3",
    code: "TF-604312",
    customer: "Phạm Hải Yến",
    phone: "0978 112 233",
    address: "Số 45 Ngõ 165 Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, Hà Nội",
    itemsSummary: "Quần Short Tập Gym 2 Lớp Pro Runner",
    itemsList: [
      { name: "Quần Short Tập Gym 2 Lớp Pro Runner", variant: "Size M • Xám Tro", qty: 1, price: 520000 },
    ],
    total: 520000,
    paymentMethod: "COD",
    paymentStatus: "Đã thu tiền mặt",
    status: "COMPLETED",
    time: "Hôm qua 15:40",
    note: "Giao vào buổi chiều tối",
  },
  {
    id: "mock-4",
    code: "TF-303171",
    customer: "Lo Van Du",
    phone: "0932 984 323",
    address: "Số 16A, Ngách 7, Ngõ 47 Nguyễn Đức Cảnh, Tương Mai, Hoàng Mai, Hà Nội",
    itemsSummary: "Sữa Tăng Cơ Whey Gold Standard 100% Vanilla (5 Lbs)",
    itemsList: [
      { name: "Sữa Tăng Cơ Optimum Nutrition Whey Gold Standard 100%", variant: "Vị Vanilla Ice Cream (5 Lbs / 2.27kg)", qty: 1, price: 1550000 },
    ],
    total: 1550000,
    paymentMethod: "VIETQR",
    paymentStatus: "Chờ đối soát",
    status: "PENDING",
    time: "Hôm nay 14:10",
    note: "Gọi trước khi giao hàng 5 phút",
  },
  {
    id: "mock-5",
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
    paymentStatus: "Đã thanh toán",
    status: "SHIPPING",
    time: "Hôm qua 09:20",
    note: "Giao tận tay lễ tân tòa nhà HITC",
  },
  {
    id: "mock-6",
    code: "TF-725398",
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
    paymentStatus: "Đã hoàn kho (+4)",
    status: "CANCELLED",
    time: "2 ngày trước",
    note: "Khách đổi ý muốn mua vị khác, đã xác nhận hủy",
  },
];

type FilterStatus = "ALL" | "PENDING" | "SHIPPING" | "COMPLETED" | "CANCELLED";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>(INITIAL_ORDERS);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Auto hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Đồng bộ đơn hàng từ Backend và LocalStorage
  useEffect(() => {
    async function fetchBackendOrders() {
      try {
        let backendOrders: OrderResponse[] = [];
        try {
          const res = await orderApiRequest.getAllOrders();
          if (res?.data?.data && Array.isArray(res.data.data)) {
            backendOrders = res.data.data;
          }
        } catch {
          // Fallback to my-orders
          const myRes = await orderApiRequest.getMyOrders();
          if (myRes?.data?.data && Array.isArray(myRes.data.data)) {
            backendOrders = myRes.data.data;
          }
        }

        // Lấy đơn mới nhất từ localStorage nếu khách vừa đặt ở Buyer Checkout
        let localLatest: AdminOrder | null = null;
        try {
          const raw = localStorage.getItem("titanfit_latest_order");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.code) {
              localLatest = {
                id: parsed.id || `local-${parsed.code}`,
                code: parsed.code,
                customer: parsed.customer || "Khách Vãng Lai",
                phone: parsed.phone || "0987 654 321",
                address: parsed.address || "Hồ Chí Minh",
                itemsSummary: parsed.itemsSummary || (parsed.items?.map((i: { name: string }) => i.name).join(" + ") || "Đơn hàng mới"),
                itemsList: (parsed.items || []).map((it: { name: string; variant?: string; quantity?: number; qty?: number; price?: number }) => ({
                  name: it.name || "Sản phẩm",
                  variant: it.variant || "Tiêu chuẩn",
                  qty: it.quantity || it.qty || 1,
                  price: it.price || 0,
                })),
                total: parsed.total || 0,
                paymentMethod: parsed.paymentMethod || "VIETQR",
                paymentStatus: parsed.paymentStatus || (parsed.paymentMethod === "VIETQR" ? "Chờ đối soát" : "Chờ thu tiền"),
                status: (parsed.status as AdminOrder["status"]) || "PENDING",
                time: parsed.time || "Vừa xong",
                note: parsed.note || "",
              };
            }
          }
        } catch (e) {
          console.warn("Could not parse local order:", e);
        }

        if (backendOrders.length > 0 || localLatest) {
          const mappedBackend: AdminOrder[] = backendOrders.map((o) => ({
            id: o.id,
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
            total: Number(o.totalAmount) || 0,
            paymentMethod: o.paymentMethod || "VIETQR",
            paymentStatus: o.paymentStatus === "PAID" ? "Đã thanh toán (Napas247)" : "Chờ thu tiền",
            status: (o.orderStatus || "PENDING") as AdminOrder["status"],
            time: o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "Vừa xong",
            note: o.note || "",
          }));

          const combined: AdminOrder[] = [...mappedBackend];

          if (localLatest && !combined.some((c) => c.code === localLatest?.code)) {
            combined.unshift(localLatest);
          }

          // Ghép thêm mock data ban đầu nếu chưa đủ đa dạng trạng thái
          INITIAL_ORDERS.forEach((initOrd) => {
            if (!combined.some((c) => c.code === initOrd.code)) {
              combined.push(initOrd);
            }
          });

          setOrders(combined);
        }
      } catch (err) {
        console.warn("Backend orders sync error:", err);
      }
    }

    fetchBackendOrders();
  }, []);

  // Xử lý chuyển đổi trạng thái đơn hàng (Duyệt, Giao thành công, Hủy đơn)
  const handleUpdateStatus = async (
    orderCode: string,
    newStatus: "PENDING" | "SHIPPING" | "COMPLETED" | "CANCELLED"
  ) => {
    const targetOrder = orders.find((o) => o.code === orderCode);
    if (!targetOrder) return;

    if (targetOrder.status === newStatus) {
      setToastMessage({
        type: "info",
        text: `Đơn ${orderCode} đã ở trạng thái ${newStatus} rồi.`,
      });
      return;
    }

    setUpdatingCode(orderCode);

    // Cập nhật Optimistic UI ngay lập tức
    const updatedPaymentStatus =
      newStatus === "CANCELLED"
        ? `Đã hoàn kho (+${targetOrder.itemsList.reduce((acc, cur) => acc + cur.qty, 0)})`
        : newStatus === "COMPLETED"
        ? (targetOrder.paymentMethod === "COD" ? "Đã thu tiền mặt" : "Đã thanh toán (Napas247)")
        : targetOrder.paymentStatus;

    setOrders((prev) =>
      prev.map((ord) =>
        ord.code === orderCode
          ? {
              ...ord,
              status: newStatus,
              paymentStatus: updatedPaymentStatus,
            }
          : ord
      )
    );

    if (selectedOrder && selectedOrder.code === orderCode) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              paymentStatus: updatedPaymentStatus,
            }
          : null
      );
    }

    // Gửi request cập nhật lên Backend nếu có id backend
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetOrder.id);
      if (isUUID && newStatus !== "PENDING") {
        await orderApiRequest.updateOrderStatus(targetOrder.id, newStatus);
      }
    } catch (err) {
      console.warn("Backend status update error:", err);
    } finally {
      setUpdatingCode(null);
    }

    // Hiển thị Toast thông báo tương ứng
    if (newStatus === "CANCELLED") {
      setToastMessage({
        type: "error",
        text: `Đơn #${orderCode} đã HỦY • Backend tự động cộng lại tồn kho cho các SKU!`,
      });
    } else if (newStatus === "SHIPPING") {
      setToastMessage({
        type: "info",
        text: `Đã duyệt đơn #${orderCode} ➔ Chuyển sang Đang Giao Hàng!`,
      });
    } else if (newStatus === "COMPLETED") {
      setToastMessage({
        type: "success",
        text: `Đơn #${orderCode} đã Giao Hàng Thành Công & Hoàn Tất!`,
      });
    } else {
      setToastMessage({
        type: "info",
        text: `Đã cập nhật đơn #${orderCode} sang trạng thái Chờ Duyệt.`,
      });
    }
  };

  // Xác nhận đã nhận tiền qua VietQR
  const handleConfirmVietQRPaid = (orderCode: string) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.code === orderCode
          ? { ...ord, paymentStatus: "Đã nhận tiền (Napas247)" }
          : ord
      )
    );
    if (selectedOrder && selectedOrder.code === orderCode) {
      setSelectedOrder((prev) =>
        prev ? { ...prev, paymentStatus: "Đã nhận tiền (Napas247)" } : null
      );
    }
    setToastMessage({
      type: "success",
      text: `Đã xác nhận thanh toán VietQR thành công cho đơn #${orderCode}!`,
    });
  };

  // Tính số lượng đơn theo từng bộ lọc
  const counts = useMemo(() => {
    return {
      ALL: orders.length,
      PENDING: orders.filter((o) => o.status === "PENDING").length,
      SHIPPING: orders.filter((o) => o.status === "SHIPPING").length,
      COMPLETED: orders.filter((o) => o.status === "COMPLETED").length,
      CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
    };
  }, [orders]);

  // Danh sách đơn sau khi lọc và tìm kiếm
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
              {orders.length} đơn
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kiểm duyệt đơn hàng, đối soát thanh toán VietQR và tự động hoàn trả kho khi hủy đơn
          </p>
        </div>

        {/* Nút hành động đầu trang */}
        <div className="flex items-center gap-2 self-start md:self-auto">
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
          <strong className="text-foreground font-bold">{filteredOrders.length}</strong> / {orders.length} đơn hàng
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
              {filteredOrders.length === 0 ? (
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
                      Thử điều chỉnh từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác
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
                              : ord.paymentStatus.includes("hoàn kho")
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
                        <select
                          value={ord.status}
                          disabled={updatingCode === ord.code}
                          onChange={(e) =>
                            handleUpdateStatus(
                              ord.code,
                              e.target.value as "PENDING" | "SHIPPING" | "COMPLETED" | "CANCELLED"
                            )
                          }
                          className="h-7 text-[11px] rounded-lg bg-background border border-border px-2 text-foreground focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
                        >
                          <option value="PENDING">⏳ Chờ duyệt</option>
                          <option value="SHIPPING">🚚 Đang giao hàng</option>
                          <option value="COMPLETED">✅ Giao thành công</option>
                          <option value="CANCELLED">❌ Hủy đơn (Hoàn kho)</option>
                        </select>
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
                        {ord.status === "PENDING" && (
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

                  {selectedOrder.paymentMethod === "VIETQR" && !selectedOrder.paymentStatus.includes("Đã") && (
                    <button
                      type="button"
                      onClick={() => handleConfirmVietQRPaid(selectedOrder.code)}
                      className="mt-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer transition-all"
                    >
                      ✓ Xác nhận đã nhận tiền (VietQR)
                    </button>
                  )}

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

                  {selectedOrder.status !== "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.code, "COMPLETED")}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                    >
                      Giao Thành Công (COMPLETED)
                    </button>
                  )}

                  {selectedOrder.status !== "CANCELLED" && (
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
                  )}
                </div>
              </div>
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
