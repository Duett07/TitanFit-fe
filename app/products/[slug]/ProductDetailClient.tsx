"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getProductDetail,
  formatVND,
  ProductDetail,
  ProductVariantSKU,
} from "@/data/products";
import { useCartStore } from "@/stores/useCartStore";
import productApiRequest from "@/apiRequest/product";
import { transformBackendProductDetail, SLUG_ALIASES } from "@/lib/backend-adapter";

// Helper to extract initial options
function getInitialOptions(p: ProductDetail): Record<string, string> {
  const initial: Record<string, string> = {};
  p.variantOptions.forEach((group) => {
    if (group.values.length > 0) {
      initial[group.name] = group.values[0];
    }
  });
  return initial;
}

export default function ProductDetailClient({
  slug,
  initialProduct,
}: {
  slug: string;
  initialProduct?: ProductDetail | null;
}) {
  const router = useRouter();
  const { addItem, closeDrawer, openDrawer } = useCartStore();

  const [product, setProduct] = useState<ProductDetail | null>(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [selectedImage, setSelectedImage] = useState<string>(
    initialProduct ? initialProduct.images[0] || initialProduct.image : ""
  );
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    initialProduct ? getInitialOptions(initialProduct) : {}
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch product from API with fallback to local curated data
  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (initialProduct) {
        setProduct(initialProduct);
        setSelectedImage(initialProduct.images[0] || initialProduct.image);
        setSelectedOptions(getInitialOptions(initialProduct));
        setLoading(false);
        return;
      }

      try {
        const targetSlug = SLUG_ALIASES[slug] || slug;
        const res = await productApiRequest.getProductBySlug(targetSlug);
        const data = res.data?.data;
        if (data && isMounted) {
          const transformed = transformBackendProductDetail(data);
          setProduct(transformed);
          setSelectedImage(transformed.images[0] || transformed.image);
          setSelectedOptions(getInitialOptions(transformed));
          setQuantity(1);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("API fetch error via productApiRequest, falling back to local data:", err);
      }

      // Fallback
      const fallback = getProductDetail(slug);
      if (isMounted) {
        setProduct(fallback || null);
        if (fallback) {
          setSelectedImage(fallback.images[0] || fallback.image);
          setSelectedOptions(getInitialOptions(fallback));
          setQuantity(1);
        }
        setLoading(false);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slug, initialProduct]);

  // Find the exact matching variant SKU based on selected options
  const currentVariant: ProductVariantSKU | undefined = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) {
      return undefined;
    }

    return (
      product.variants.find((v) => {
        return Object.entries(selectedOptions).every(
          ([key, val]) => v.options[key] === val
        );
      }) || product.variants[0]
    );
  }, [product, selectedOptions]);

  // Derived price & stock
  const currentPrice = currentVariant ? currentVariant.price : product?.price || 0;
  const currentOriginalPrice = currentVariant?.originalPrice || product?.originalPrice;
  const currentStock = currentVariant !== undefined ? currentVariant.stock : 0;
  const isOutOfStock = currentStock === 0;

  // Clamped effective quantity without cascading renders
  const effectiveQty = isOutOfStock
    ? 1
    : Math.min(Math.max(1, quantity), Math.max(1, currentStock));

  // Handle option select
  const handleSelectOption = (groupName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupName]: value,
    }));
    setQuantity(1);
  };

  // Quantity stepper handlers
  const handleDecreaseQty = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleIncreaseQty = () => {
    if (quantity < currentStock) {
      setQuantity((q) => q + 1);
    }
  };

  // Build summary string of selected options (e.g. "Double Rich Chocolate • 5 lbs (2.27kg)")
  const variantSummary = useMemo(() => {
    return Object.values(selectedOptions).join(" • ");
  }, [selectedOptions]);

  // Add to cart handler
  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;

    addItem(
      {
        productId: product.id,
        variantId: currentVariant?.id,
        slug: product.slug,
        name: product.name,
        image: selectedImage || product.image,
        price: currentPrice,
        originalPrice: currentOriginalPrice,
        selectedVariants: selectedOptions,
        variantSummary: variantSummary || "Tiêu chuẩn",
        stock: currentStock,
      },
      effectiveQty
    );

    setToastMessage(`Đã thêm ${effectiveQty} sản phẩm vào giỏ hàng!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Buy now handler
  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;

    addItem(
      {
        productId: product.id,
        variantId: currentVariant?.id,
        slug: product.slug,
        name: product.name,
        image: selectedImage || product.image,
        price: currentPrice,
        originalPrice: currentOriginalPrice,
        selectedVariants: selectedOptions,
        variantSummary: variantSummary || "Tiêu chuẩn",
        stock: currentStock,
      },
      effectiveQty
    );

    closeDrawer();
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="container py-16 text-center">
        <div className="inline-block w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-[var(--muted-foreground)]">
          Đang tải dữ liệu chi tiết sản phẩm &amp; biến thể...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--secondary)] flex items-center justify-center mx-auto mb-4 text-[var(--muted-foreground)]">
          ✕
        </div>
        <h1 className="font-heading font-bold text-2xl mb-2">
          Không tìm thấy sản phẩm
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Sản phẩm với đường dẫn &ldquo;{slug}&rdquo; không tồn tại hoặc đã ngừng kinh doanh.
        </p>
        <Link href="/products" className="btn btn-primary rounded-md">
          Quay Về Danh Sách Sản Phẩm
        </Link>
      </div>
    );
  }

  const isApparel = product.category === "apparel";
  const discountPercent = currentOriginalPrice
    ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
    : null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Segmented Control Demo Switcher (Exact Wireframe layout) */}
      <div style={{ backgroundColor: "var(--card-surface)", borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
        <div className="container flex flex-wrap items-center justify-between gap-3">
          <div style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
            Kiểm thử logic biến thể nghiệp vụ:
          </div>

          <div style={{ display: "inline-flex", backgroundColor: "var(--secondary)", padding: "3px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", gap: "4px" }}>
            <Link
              href="/products/whey-gold-standard-100"
              className={`btn btn-sm ${
                product.slug === "whey-gold-standard-100" || product.slug === "whey-gold-standard-100-isolate-5lbs"
                  ? "btn-secondary font-semibold"
                  : "btn-ghost"
              }`}
              style={{ height: "28px" }}
            >
              Mẫu 1: Whey Protein (BE data)
            </Link>
            <Link
              href="/products/ao-thun-the-thao-titanfit-dry-fit-athletics"
              className={`btn btn-sm ${
                product.slug === "ao-thun-the-thao-titanfit-dry-fit-athletics" || product.slug === "ao-thun-pro-combat-co-gian-4-chieu"
                  ? "btn-secondary font-semibold"
                  : "btn-ghost"
              }`}
              style={{ height: "28px" }}
            >
              Mẫu 2: Áo Tập Gym (BE data)
            </Link>
          </div>
        </div>
      </div>

      {/* Main PDP Grid (Exact Wireframe structure & styling) */}
      <main className="container">
        <div className="pdp-grid">
          {/* Left: Image Gallery */}
          <div>
            <div className="pdp-gallery-main">
              {product.badge && (
                <div style={{ position: "absolute", top: "12px", left: "12px", zIndex: 10 }}>
                  <span className="badge badge-primary" style={{ padding: "3px 8px", fontSize: "11px", fontWeight: "700" }}>
                    {product.badge}
                  </span>
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage || product.image}
                alt={product.name}
              />
            </div>

            {/* Thumbnails row */}
            <div className="pdp-thumbs">
              {product.images.map((img, idx) => {
                const isActive = selectedImage === img;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`thumb-btn ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedImage(img)}
                    aria-label={`Xem ảnh ${idx + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Product Info & Variants */}
          <div>
            {/* Meta Tags: Category, SKU & Stock Indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span className="badge badge-default" style={{ fontSize: "11px" }}>
                {product.categoryLabel}
              </span>

              <span className="font-mono" style={{ fontSize: "11px", color: "var(--subtle-foreground)" }}>
                SKU: <span style={{ color: "var(--foreground)" }}>{currentVariant?.sku || "TITAN-SKU"}</span>
              </span>

              {isOutOfStock ? (
                <span className="badge badge-destructive" style={{ fontSize: "11px" }}>
                  ● Tạm Hết Hàng
                </span>
              ) : (
                <span className="badge badge-success" style={{ fontSize: "11px" }}>
                  ● Còn <span>{currentStock}</span> {isApparel ? "chiếc" : "hộp"}
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 style={{ fontSize: "28px", lineHeight: "1.25", marginBottom: "12px", fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
              {product.name}
            </h1>

            {/* Price & Discount */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "20px" }}>
              <span style={{ fontSize: "24px", fontWeight: "700", color: "var(--foreground)", fontFamily: "'Outfit', sans-serif" }}>
                {formatVND(currentPrice)}
              </span>

              {currentOriginalPrice && currentOriginalPrice > currentPrice && (
                <span style={{ fontSize: "13.5px", color: "var(--subtle-foreground)", textDecoration: "line-through" }}>
                  {formatVND(currentOriginalPrice)}
                </span>
              )}

              {discountPercent && discountPercent > 0 && (
                <span className="badge badge-primary" style={{ fontSize: "11px" }}>
                  -{discountPercent}%
                </span>
              )}
            </div>

            {/* Description */}
            <p style={{ color: "var(--muted-foreground)", fontSize: "13.5px", lineHeight: "1.6", marginBottom: "24px" }}>
              {product.description}
            </p>

            {/* Dynamic Variant Options */}
            {product.variantOptions.map((group) => {
              const selectedVal = selectedOptions[group.name];

              return (
                <div key={group.name} className="variant-group">
                  <div className="variant-label">
                    <span>{group.name}</span>
                    <strong>{selectedVal}</strong>
                  </div>

                  <div className="variant-options">
                    {group.values.map((val) => {
                      const isSelected = selectedVal === val;

                      // Check if selecting this option leads to out of stock
                      const testOptions = { ...selectedOptions, [group.name]: val };
                      const testVariant = product.variants.find((v) =>
                        Object.entries(testOptions).every(
                          ([k, testVal]) => v.options[k] === testVal
                        )
                      );
                      const isValOutOfStock = testVariant && testVariant.stock === 0;

                      // Add price info if weight option group
                      const isWeightGroup = group.name.includes("Khối lượng") || group.name.includes("Trọng Lượng");

                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleSelectOption(group.name, val)}
                          className={`variant-btn ${isSelected ? "active" : ""} ${
                            isValOutOfStock && !isSelected ? "opacity-40" : ""
                          }`}
                        >
                          {val}
                          {isWeightGroup && testVariant ? ` • ${formatVND(testVariant.price)}` : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Action Row: Stepper, Add to Cart & Buy Now */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "28px" }}>
              <div className="stepper" style={{ height: "40px", padding: "0 4px" }}>
                <button
                  type="button"
                  className="stepper-btn"
                  style={{ width: "28px" }}
                  onClick={handleDecreaseQty}
                  disabled={effectiveQty <= 1 || isOutOfStock}
                  aria-label="Giảm số lượng"
                >
                  −
                </button>
                <span className="stepper-val" style={{ width: "32px", fontSize: "13.5px" }}>
                  {effectiveQty}
                </span>
                <button
                  type="button"
                  className="stepper-btn"
                  style={{ width: "28px" }}
                  onClick={handleIncreaseQty}
                  disabled={effectiveQty >= currentStock || isOutOfStock}
                  aria-label="Tăng số lượng"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-lg"
                style={{ flex: 1, height: "40px", fontWeight: 600 }}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? "Tạm Hết Hàng" : "Thêm Vào Giỏ Hàng"}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-lg"
                style={{ height: "40px", fontWeight: 600 }}
                onClick={handleBuyNow}
                disabled={isOutOfStock}
              >
                Mua Ngay
              </button>
            </div>

            {/* Specs Card (Exact wireframe styling) */}
            {product.specs && product.specs.length > 0 && (
              <div className="card" style={{ marginTop: "28px", padding: "18px" }}>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--foreground)", marginBottom: "10px" }}>
                  {isApparel ? "Thông Số Chất Liệu & Bảo Hành" : "Thành Phần Dinh Dưỡng Mỗi Khẩu Phần"}
                </div>
                <table className="specs-table">
                  <tbody>
                    {product.specs.map((spec, i) => (
                      <tr key={i}>
                        <td>{spec.label}</td>
                        <td>{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18181b] text-white border border-[#27272a] shadow-2xl px-5 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            onClick={openDrawer}
            className="text-xs text-[var(--primary)] font-bold ml-2 underline hover:no-underline"
          >
            Xem giỏ
          </button>
        </div>
      )}
    </div>
  );
}
