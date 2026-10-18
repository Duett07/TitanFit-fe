import { Suspense } from "react";
import type { Metadata } from "next";
import productApiRequest from "@/apiRequest/product";
import { transformBackendProductDetail } from "@/lib/backend-adapter";
import ProductDetailClient from "./ProductDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await productApiRequest.getProductBySlug(slug);
    const data = res.data?.data;
    if (data) {
      return {
        title: `${data.name} — TITANFIT Chính Hãng`,
        description: data.description || `Sản phẩm ${data.name} chính hãng tại TITANFIT`,
        openGraph: {
          title: `${data.name} — TITANFIT`,
          description: data.description,
          images: data.thumbnailUrl ? [data.thumbnailUrl] : [],
        },
      };
    }
  } catch {
    // Backend fetch failed or not found
  }

  return {
    title: "Chi Tiết Sản Phẩm — TITANFIT",
  };
}

async function ProductDetailLoader({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let initialProduct = null;

  try {
    const res = await productApiRequest.getProductBySlug(slug);
    if (res.data?.data) {
      initialProduct = transformBackendProductDetail(res.data.data);
    }
  } catch {
    // Client component will handle 404 / retry state
  }

  return <ProductDetailClient slug={slug} initialProduct={initialProduct} />;
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

