import { Suspense, cache } from "react";
import type { Metadata } from "next";
import productApiRequest from "@/apiRequest/product";
import { transformBackendProductDetail } from "@/lib/backend-adapter";
import ProductDetailClient from "./ProductDetailClient";

// Deduplicate request per render cycle between generateMetadata and ProductDetailLoader
const getProduct = cache(async (slug: string) => {
  try {
    const res = await productApiRequest.getProductBySlug(slug);
    return res.data?.data || null;
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);

  if (data) {
    const title = `${data.name} — TITANFIT Chính Hãng`;
    const description = data.description || `Sản phẩm ${data.name} chính hãng tại TITANFIT`;
    const images = data.thumbnailUrl ? [data.thumbnailUrl] : [];

    return {
      title,
      description,
      alternates: {
        canonical: `/products/${slug}`,
      },
      openGraph: {
        title,
        description,
        images,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images,
      },
    };
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
  const data = await getProduct(slug);
  const initialProduct = data ? transformBackendProductDetail(data) : null;

  // JSON-LD structured data for search engine snippets
  const jsonLd = initialProduct
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: initialProduct.name,
        description: initialProduct.description,
        image: initialProduct.images,
        offers: {
          "@type": "Offer",
          priceCurrency: "VND",
          price: initialProduct.price,
          availability: initialProduct.variants.some((v) => v.stock > 0)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: `/products/${slug}`,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient slug={slug} initialProduct={initialProduct} />
    </>
  );
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

