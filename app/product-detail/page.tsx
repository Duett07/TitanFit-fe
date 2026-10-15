"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PRODUCTS } from "@/data/products";

function ProductDetailRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    if (id) {
      const match = PRODUCTS.find((p) => String(p.id) === id);
      if (match) {
        router.replace(`/products/${match.slug}`);
        return;
      }
    }
    router.replace("/products/whey-gold-standard-100-isolate-5lbs");
  }, [id, router]);

  return (
    <div className="container py-20 text-center text-sm text-[var(--muted-foreground)]">
      Đang chuyển tiếp đến trang chi tiết sản phẩm...
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div className="container py-20 text-center">Đang tải...</div>}>
      <ProductDetailRedirect />
    </Suspense>
  );
}
