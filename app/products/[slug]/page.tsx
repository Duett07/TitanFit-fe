import { Suspense } from "react";
import type { Metadata } from "next";
import { getProductDetail } from "@/data/products";
import ProductDetailClient from "./ProductDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductDetail(slug);

  if (!product) {
    return {
      title: "Chi Tiết Sản Phẩm — TITANFIT",
    };
  }

  return {
    title: `${product.name} — TITANFIT Chính Hãng`,
    description: product.description,
  };
}

async function ProductDetailLoader({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container py-24 text-center">
          <div className="inline-block w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-[var(--muted-foreground)]">
            Đang tải dữ liệu sản phẩm...
          </p>
        </div>
      }
    >
      <ProductDetailLoader params={params} />
    </Suspense>
  );
}
