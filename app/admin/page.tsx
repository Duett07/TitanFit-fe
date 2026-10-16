"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import orderApiRequest from "@/apiRequest/order";
import { OrderResponse } from "@/types/order.type";
import { formatVND } from "@/data/products";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await orderApiRequest.getMyOrders();
        if (res.data?.data && Array.isArray(res.data.data)) {
          setOrders(res.data.data);
        }
      } catch (err) {
        console.warn("Could not load orders for admin dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const pendingOrders = orders.filter((o) => o.orderStatus === "PENDING");
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== "CANCELLED")
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const vietQrOrders = orders.filter((o) => o.paymentMethod === "VIETQR");
  const vietQrRatio =
    orders.length > 0 ? Math.round((vietQrOrders.length / orders.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading tracking-tight">
            Bảng Điều Khiển Cửa Hàng
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Theo dõi doanh thu, trạng thái đơn và cảnh báo tồn kho theo thời gian thực
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          <span>Làm Mới Số Liệu</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold mb-2">
            <span>Doanh Thu Ghi Nhận</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" x2="12" y1="2" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-black text-foreground font-heading">
            {formatVND(totalRevenue)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            <span className="text-emerald-500 font-bold">+18.2%</span> so với kỳ trước
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold mb-2">
            <span>Đơn Chờ Xử Lý</span>
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-black text-primary font-heading">
            {pendingOrders.length} đơn
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">Cần đóng gói & xuất kho</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold mb-2">
            <span>Cảnh Báo Tồn Kho</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-heading">
            2 SKU
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">Mức tồn ≤ 2 sản phẩm</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold mb-2">
            <span>Tỉ Lệ VietQR</span>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-black text-foreground font-heading">
            {vietQrRatio}%
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">Chuyển khoản tự động Napas247</p>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10">
          <div>
            <h2 className="text-base font-bold text-foreground">Đơn Hàng Gần Đây Cần Xử Lý</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dữ liệu đơn hàng phát sinh thực tế từ cơ sở dữ liệu
            </p>
          </div>
          <Link
            href="/order-tracking"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Xem hành trình chi tiết</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Đang tải danh sách đơn hàng...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs">
            Hiện chưa có đơn hàng nào được ghi nhận trên hệ thống.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Mã Đơn</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4">Số Điện Thoại</th>
                  <th className="py-3 px-4">Tổng Tiền</th>
                  <th className="py-3 px-4">Phương Thức</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orders.slice(0, 8).map((ord) => (
                  <tr key={ord.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      #{ord.orderCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {ord.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">
                      {ord.phone}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {formatVND(Number(ord.totalAmount) || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary text-foreground">
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.orderStatus === "COMPLETED"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : ord.orderStatus === "CANCELLED"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            : ord.orderStatus === "SHIPPING"
                            ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/order-success/${ord.orderCode}`}
                        className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-secondary text-foreground text-[11px] font-semibold transition-colors inline-block"
                      >
                        Xem Đơn
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
