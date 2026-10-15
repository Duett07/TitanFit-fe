"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatVND, ProductDetail } from "@/data/products";
import productApiRequest from "@/apiRequest/product";
import { transformBackendProductSummary } from "@/lib/backend-adapter";
import { useCartStore } from "@/stores/useCartStore";

interface FeaturedApparelProps {
  initialProducts?: ProductDetail[];
}

export default function FeaturedApparel({
  initialProducts,
}: FeaturedApparelProps) {
  const [products, setProducts] = useState<ProductDetail[]>(
    initialProducts || []
  );
  const [loading, setLoading] = useState(
    !initialProducts || initialProducts.length === 0
  );
  const [toastText, setToastText] = useState<string | null>(null);
  const { addItem } = useCartStore();

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      return;
    }

    let isMounted = true;
    async function loadApparel() {
      try {
        const res = await productApiRequest.getProducts({ page: 0, size: 50 });
        const content = res.data?.data?.content;
        if (
          content &&
          Array.isArray(content) &&
          content.length > 0 &&
          isMounted
        ) {
          const all = content.map(transformBackendProductSummary);
          const apparel = all
            .filter((p) => p.category === "apparel")
            .slice(0, 4);
          setProducts(apparel);
        }
      } catch (err) {
        console.warn(
          "Failed to fetch featured apparel via productApiRequest:",
          err
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadApparel();
    return () => {
      isMounted = false;
    };
  }, [initialProducts]);

  const handleAddToCart = (product: ProductDetail) => {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      selectedVariants: {},
      variantSummary: product.categoryLabel,
      stock: 50,
    });
    setToastText(`Đã thêm "${product.name}" vào giỏ hàng!`);
    setTimeout(() => setToastText(null), 3000);
  };

  return (
    <section style={{ padding: "10px 0 50px" }}>
      <div className="container">
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "20px",
          }}
        >
          <div>
            <span
              className="badge badge-default"
              style={{ marginBottom: "6px" }}
            >
              Thời Trang Phòng Gym
            </span>
            <h2 className="font-heading" style={{ fontSize: "24px" }}>
              Đồ Tập &amp; Phụ Kiện Thể Thao
            </h2>
          </div>
          <Link
            href="/products?category=apparel"
            className="btn btn-ghost btn-sm"
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {loading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="product-card"
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    backgroundColor: "var(--card-surface)",
                  }}
                >
                  <div
                    className="animate-pulse"
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      backgroundColor: "var(--secondary)",
                    }}
                  />
                  <div
                    style={{ padding: "16px" }}
                    className="space-y-3 animate-pulse"
                  >
                    <div
                      style={{
                        height: "12px",
                        width: "40%",
                        borderRadius: "4px",
                        backgroundColor: "var(--secondary)",
                      }}
                    />
                    <div
                      style={{
                        height: "16px",
                        width: "80%",
                        borderRadius: "4px",
                        backgroundColor: "var(--secondary)",
                      }}
                    />
                    <div
                      style={{
                        height: "18px",
                        width: "50%",
                        borderRadius: "4px",
                        backgroundColor: "var(--secondary)",
                      }}
                    />
                    <div
                      style={{
                        height: "36px",
                        width: "100%",
                        borderRadius: "6px",
                        backgroundColor: "var(--secondary)",
                        marginTop: "12px",
                      }}
                    />
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
                  <div key={product.id} className="product-card">
                    <div className="product-thumb-wrap">
                      {discountPercent && discountPercent > 0 ? (
                        <span className="badge badge-primary product-tag font-bold">
                          -{discountPercent}%
                        </span>
                      ) : product.badge ? (
                        <span className="badge badge-default product-tag">
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
                          className="object-cover transition-transform duration-300"
                        />
                      </Link>
                    </div>
                    <div className="product-info">
                      <span className="product-category">
                        {product.categoryLabel}
                      </span>
                      <Link
                        href={`/products/${product.slug}`}
                        className="product-name hover:text-[var(--primary)] transition-colors"
                        title={product.name}
                      >
                        {product.name}
                      </Link>
                      <div className="product-price-row">
                        <span className="price-main">
                          {formatVND(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="price-del">
                            {formatVND(product.originalPrice)}
                          </span>
                        )}
                      </div>
                      <div className="product-actions">
                        <Link
                          href={`/products/${product.slug}`}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, textAlign: "center" }}
                        >
                          Xem chi tiết
                        </Link>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-icon"
                          onClick={() => handleAddToCart(product)}
                          title="Thêm vào giỏ"
                          aria-label={`Thêm ${product.name} vào giỏ hàng`}
                        >
                          <svg
                            width="14"
                            height="14"
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
