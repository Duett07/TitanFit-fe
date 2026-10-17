"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatVND, ProductDetail } from "@/data/products";
import productApiRequest from "@/apiRequest/product";
import { transformBackendProductSummary } from "@/lib/backend-adapter";
import { useCartStore } from "@/stores/useCartStore";
import { useAutoSync } from "@/lib/sync";

interface FeaturedSupplementsProps {
  initialProducts?: ProductDetail[];
}

export default function FeaturedSupplements({
  initialProducts,
}: FeaturedSupplementsProps) {
  const [products, setProducts] = useState<ProductDetail[]>(
    initialProducts || []
  );
  const [loading, setLoading] = useState(
    !initialProducts || initialProducts.length === 0
  );
  const [toastText, setToastText] = useState<string | null>(null);
  const { addItem } = useCartStore();

  const loadSupplements = useCallback(async () => {
    try {
      const res = await productApiRequest.getProducts({ page: 0, size: 50 });
      const content = res.data?.data?.content;
      if (
        content &&
        Array.isArray(content) &&
        content.length > 0
      ) {
        const all = content.map(transformBackendProductSummary);
        const supps = all
          .filter((p) => p.category === "supplements")
          .slice(0, 4);
        setProducts(supps);
      }
    } catch (err) {
      console.warn(
        "Failed to fetch featured supplements via productApiRequest:",
        err
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialProducts || initialProducts.length === 0) {
      loadSupplements();
    }
  }, [initialProducts, loadSupplements]);

  // Tự động đồng bộ thời gian thực khi Admin thêm/sửa sản phẩm hoặc khi người dùng quay lại tab Buyer
  useAutoSync({
    eventTypes: ["PRODUCT_UPDATED"],
    onSync: loadSupplements,
    intervalMs: 8000,
    enableFocusSync: true,
  });

  const handleAddToCart = (product: ProductDetail) => {
    const defaultVariant = product.variants?.[0];
    addItem({
      productId: product.id,
      variantId: defaultVariant?.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: defaultVariant?.price ?? product.price,
      originalPrice: defaultVariant?.originalPrice ?? product.originalPrice,
      selectedVariants: defaultVariant?.options || {},
      variantSummary: defaultVariant
        ? Object.values(defaultVariant.options).join(" • ")
        : product.categoryLabel,
      stock: defaultVariant?.stock ?? 50,
    });
    setToastText(`Đã thêm "${product.name}" vào giỏ hàng!`);
    setTimeout(() => setToastText(null), 3000);
  };

  return (
    <section className="py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground mb-2">
              Bán Chạy Nhất
            </span>
            <h2 className="text-2xl font-bold font-heading text-foreground">
              Thực Phẩm Bổ Sung Nổi Bật
            </h2>
          </div>
          <Link
            href="/products?category=supplements"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <span>Xem tất cả</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden"
                >
                  <div className="w-full aspect-square bg-muted animate-pulse" />
                  <div className="p-4 space-y-3 animate-pulse">
                    <div className="h-3 w-2/5 rounded bg-muted" />
                    <div className="h-4 w-4/5 rounded bg-muted" />
                    <div className="h-5 w-1/2 rounded bg-muted" />
                    <div className="h-9 w-full rounded-lg bg-muted mt-3" />
                  </div>
                </div>
              ))
            : products.map((product) => {
                const discountPercent = product.originalPrice
                  ? Math.round(
                      ((product.originalPrice - product.price) /
                        product.originalPrice) *
                        100
                    )
                  : null;

                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/40 transition-all duration-300"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
                      {discountPercent && discountPercent > 0 ? (
                        <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-white shadow-sm">
                          -{discountPercent}%
                        </span>
                      ) : product.badge ? (
                        <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-900/80 text-white backdrop-blur-sm">
                          {product.badge}
                        </span>
                      ) : null}
                      <Link
                        href={`/products/${product.slug}`}
                        className="block w-full h-full relative"
                      >
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    </div>
                    <div className="flex flex-col flex-1 p-4">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        {product.categoryLabel}
                      </span>
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-medium text-sm text-foreground line-clamp-2 hover:text-primary transition-colors min-h-[2.5rem] mb-2"
                        title={product.name}
                      >
                        {product.name}
                      </Link>
                      <div className="flex items-baseline gap-2 mt-auto mb-3">
                        <span className="text-base font-bold text-primary">
                          {formatVND(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatVND(product.originalPrice)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          className="flex-1 text-center py-2 px-3 text-xs font-semibold rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                        >
                          Xem chi tiết
                        </Link>
                        <button
                          type="button"
                          className="p-2 rounded-xl border border-border text-foreground hover:bg-primary hover:text-white hover:border-primary transition-colors"
                          onClick={() => handleAddToCart(product)}
                          title="Thêm vào giỏ"
                          aria-label={`Thêm ${product.name} vào giỏ hàng`}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M5 12h14" />
                            <path d="M12 5v14" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Toast Notification */}
      {toastText && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-[#18181b] text-white border border-[#27272a] shadow-2xl px-5 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200"
          role="status"
          aria-live="polite"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium">{toastText}</span>
          <button
            onClick={() => setToastText(null)}
            className="text-zinc-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}
