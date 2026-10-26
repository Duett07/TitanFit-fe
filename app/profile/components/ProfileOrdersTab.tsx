"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Package, ArrowRight, Truck, Star, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatVND } from "@/lib/format";
import { OrderResponse } from "@/types/order.type";
import { useMyOrders } from "@/hooks/queries";
import reviewApiRequest from "@/apiRequest/review";
import ReviewModal from "@/components/review/ReviewModal";
import { Toast } from "@/components/ui";

export default function ProfileOrdersTab() {
  const { data: rawOrders = [], isLoading: isOrdersLoading } = useMyOrders();
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [reviewModalState, setReviewModalState] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
    variantName?: string;
  }>({
    isOpen: false,
    productId: "",
    productName: "",
  });

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

  const loadReviewedProductIds = useCallback(async () => {
    try {
      const res = await reviewApiRequest.getMyReviewedProductIds();
      if (res.data?.data) {
        setReviewedProductIds(res.data.data);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Could not load reviewed product IDs:", err);
      }
    }
  }, []);

  useEffect(() => {
    void loadReviewedProductIds();
  }, [loadReviewedProductIds]);

  const handleReviewSuccess = () => {
    if (reviewModalState.productId) {
      setReviewedProductIds((prev) => [...prev, reviewModalState.productId]);
    }
    setToastMessage("Đánh giá sản phẩm thành công! Cảm ơn bạn đã đóng góp nhận xét.");
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 mb-6">
        <div>
          <h2 className="text-xl font-extrabold font-heading text-foreground">
            Đơn Hàng Gần Đây
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Theo dõi tiến độ giao hàng và đánh giá sản phẩm sau khi đơn hoàn tất
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
            const isCompleted = ord.orderStatus === "COMPLETED";
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
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all flex flex-col gap-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

                {/* Items Review Section for COMPLETED orders */}
                {ord.items && ord.items.length > 0 && isCompleted && (
                  <div className="pt-3 border-t border-border/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xs uppercase font-bold tracking-wider text-muted-foreground">
                        Đánh giá sản phẩm đã mua:
                      </span>
                      <span className="text-3xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        ● Đơn hàng đã hoàn tất
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ord.items.map((item, idx) => {
                        const pId = item.productId;
                        const isReviewed = pId ? reviewedProductIds.includes(pId) : false;

                        return (
                          <div
                            key={item.id || idx}
                            className="flex items-center justify-between gap-3 text-xs bg-muted/40 p-3 rounded-xl border border-border/60"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-foreground truncate block">
                                {item.productName}
                              </span>
                              {item.variantName && (
                                <span className="text-2xs text-muted-foreground truncate block">
                                  {item.variantName}
                                </span>
                              )}
                            </div>

                            {pId ? (
                              isReviewed ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-2xs font-bold shrink-0 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Đã đánh giá</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReviewModalState({
                                      isOpen: true,
                                      productId: pId,
                                      productName: item.productName,
                                      variantName: item.variantName,
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-white text-2xs font-bold hover:bg-primary/90 transition-all shrink-0 shadow-xs cursor-pointer"
                                >
                                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                                  <span>Đánh Giá</span>
                                </button>
                              )
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalState.isOpen}
        onClose={() => setReviewModalState((prev) => ({ ...prev, isOpen: false }))}
        productId={reviewModalState.productId}
        productName={reviewModalState.productName}
        variantName={reviewModalState.variantName}
        onSuccess={handleReviewSuccess}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          text={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
