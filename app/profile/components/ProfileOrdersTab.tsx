"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Package, ArrowRight, Truck } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatVND } from "@/lib/format";
import { OrderResponse } from "@/types/order.type";
import { useMyOrders } from "@/hooks/queries";

export default function ProfileOrdersTab() {
  const { data: rawOrders = [], isLoading: isOrdersLoading } = useMyOrders();

  const orders = useMemo<OrderResponse[]>(() => {
    if (Array.isArray(rawOrders)) return rawOrders;
    if (
      rawOrders &&
      typeof rawOrders === "object" &&
      "content" in rawOrders &&
      Array.isArray((rawOrders as { content?: unknown }).content)
    ) {
      return (rawOrders as { content: OrderResponse[] }).content;
    }
    return [];
  }, [rawOrders]);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 mb-6">
        <div>
          <h2 className="text-xl font-extrabold font-heading text-foreground">
            Đơn Hàng Gần Đây
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Theo dõi tiến độ giao hàng và xem chi tiết hóa đơn các đơn hàng đã đặt
          </p>
        </div>
        <Link
          href="/order-tracking"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
        >
          <span>Tra Cứu Chi Tiết Hành Trình</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isOrdersLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-border bg-card animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-secondary rounded w-1/4" />
                <div className="h-4 bg-secondary rounded w-3/4" />
                <div className="h-3 bg-secondary rounded w-1/3" />
              </div>
              <div className="h-8 bg-secondary rounded w-28" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            Bạn chưa có đơn hàng nào
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
            Khám phá các sản phẩm thực phẩm bổ sung và phụ kiện tập luyện tại TitanFit để bắt đầu mua sắm ngay!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <span>Khám Phá Sản Phẩm Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const orderCode = ord.orderCode || ord.id;
            const formattedDate = ord.createdAt
              ? new Date(ord.createdAt).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Vừa xong";
            const previewItems =
              ord.items && ord.items.length > 0
                ? ord.items.map((i) => i.productName).join(" + ")
                : "Sản phẩm TitanFit";
            const itemCount =
              ord.items?.reduce(
                (acc: number, it: { quantity?: number }) => acc + (it.quantity || 1),
                0
              ) || 1;

            return (
              <div
                key={orderCode}
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-sm text-foreground">
                      {orderCode}
                    </span>
                    <StatusBadge status={ord.orderStatus} />
                  </div>
                  <p
                    className="text-xs text-foreground/80 font-medium truncate"
                    title={previewItems}
                  >
                    {previewItems}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <span>{itemCount} món</span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:flex-col md:items-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border shrink-0">
                  <span className="font-extrabold text-base text-primary font-heading">
                    {formatVND(ord.totalAmount)}
                  </span>
                  <Link
                    href={`/order-tracking?orderCode=${orderCode}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border"
                  >
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    <span>Chi Tiết Đơn</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
