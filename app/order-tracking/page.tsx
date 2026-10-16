import { Suspense } from "react";
import type { Metadata } from "next";
import OrderTrackingClient from "./OrderTrackingClient";

export const metadata: Metadata = {
  title: "Đơn Hàng Của Tôi — Tra Cứu & Theo Dõi Hành Trình | TITANFIT Sports",
  description:
    "Theo dõi trạng thái giao hàng theo thời gian thực, kiểm tra lịch sử mua sắm và chi tiết hóa đơn điện tử tại TITANFIT.",
};

export default function OrderTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            Đang tải dữ liệu hành trình đơn hàng...
          </p>
        </div>
      }
    >
      <OrderTrackingClient />
    </Suspense>
  );
}
