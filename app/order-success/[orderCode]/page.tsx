import { Suspense } from "react";
import type { Metadata } from "next";
import OrderSuccessClient from "./OrderSuccessClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderCode: string }>;
}): Promise<Metadata> {
  const { orderCode } = await params;
  return {
    title: `Đặt Hàng Thành Công #${orderCode} — TITANFIT`,
    description: "Cảm ơn bạn đã mua sắm tại TitanFit. Đơn hàng của bạn đã được ghi nhận.",
  };
}

async function OrderSuccessLoader({ params }: { params: Promise<{ orderCode: string }> }) {
  const { orderCode } = await params;
  return <OrderSuccessClient orderCode={orderCode} />;
}

export default function OrderSuccessPage({ params }: { params: Promise<{ orderCode: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4">
          <div className="w-10 h-10 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            Đang tải thông tin đơn hàng...
          </p>
        </div>
      }
    >
      <OrderSuccessLoader params={params} />
    </Suspense>
  );
}
