"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UIProductDetail, ProductVariantSKU } from "@/data/products";
import { formatVND } from "@/lib/format";
import { useCartStore } from "@/stores/useCartStore";
import productApiRequest from "@/apiRequest/product";
import { transformBackendProductDetail } from "@/lib/backend-adapter";
import { useAutoSync } from "@/lib/sync";

// Helper to extract initial options
function getInitialOptions(p: UIProductDetail): Record<string, string> {
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
  initialProduct?: UIProductDetail | null;
}) {
  const router = useRouter();
  const { addItem, closeDrawer, openDrawer } = useCartStore();

  const [product, setProduct] = useState<UIProductDetail | null>(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [selectedImage, setSelectedImage] = useState<string>(
    initialProduct ? initialProduct.images[0] || initialProduct.image : ""
  );
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    initialProduct ? getInitialOptions(initialProduct) : {}
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch product from API
  const loadProduct = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      try {
        const res = await productApiRequest.getProductBySlug(slug);
        const data = res.data?.data;
        if (data) {
          const transformed = transformBackendProductDetail(data);
          setProduct(transformed);
          if (!silent) {
            setSelectedImage(transformed.images[0] || transformed.image);
            setSelectedOptions(getInitialOptions(transformed));
            setQuantity(1);
          }
          if (!silent) setLoading(false);
          return;
        }

        if (!silent) {
          setProduct(null);
          setLoading(false);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("API fetch error via productApiRequest:", err);
        }
        if (!silent) {
          setProduct(null);
          setLoading(false);
        }
      }
    },
    [slug]
  );

  useEffect(() => {
    let isMounted = true;
    if (!initialProduct) {
      Promise.resolve().then(() => {
        if (isMounted) {
          void loadProduct(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [initialProduct, loadProduct]);

  // Real-time synchronization: Auto-refresh product details and stock when modified in admin
  useAutoSync({
    eventTypes: ["PRODUCT_UPDATED"],
    onSync: () => loadProduct(true),
    intervalMs: 60000,
    enableFocusSync: true,
  });

  // Find the exact matching variant SKU based on selected options
  const currentVariant: ProductVariantSKU | undefined = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) {
      return undefined;
    }

    return (
      product.variants.find((v) => {
        return Object.entries(selectedOptions).every(([key, val]) => v.options[key] === val);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">
          Đang tải dữ liệu chi tiết sản phẩm &amp; biến thể...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground text-xl">
          ✕
        </div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
          Không tìm thấy sản phẩm
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Sản phẩm với đường dẫn &ldquo;{slug}&rdquo; không tồn tại hoặc đã ngừng kinh doanh.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
        >
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
    <div className="min-h-screen bg-background">
      {/* Main PDP Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Image Gallery */}
          <div className="lg:col-span-6">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-card border border-border flex items-center justify-center mb-4">
              {product.badge && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white shadow-sm">
                    {product.badge}
                  </span>
                </div>
              )}
              <Image
                src={selectedImage || product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Thumbnails row */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => {
                  const isActive = selectedImage === img;
                  return (
                    <button
                      key={img || idx}
                      type="button"
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        isActive
                          ? "border-primary shadow-sm"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedImage(img)}
                      aria-label={`Xem ảnh ${idx + 1}`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Product Info & Variants */}
          <div className="lg:col-span-6">
            {/* Meta Tags: Category, SKU & Stock Indicator */}
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                {product.categoryLabel}
              </span>

              <span className="font-mono text-xs text-muted-foreground">
                SKU:{" "}
                <span className="text-foreground font-semibold">
                  {currentVariant?.sku || "TITAN-SKU"}
                </span>
              </span>

              {isOutOfStock ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                  ● Tạm Hết Hàng
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ● Còn <span>{currentStock}</span> {isApparel ? "chiếc" : "hộp"}
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground mb-3 leading-tight">
              {product.name}
            </h1>

            {/* Price & Discount */}
            <div className="flex items-baseline gap-2.5 mb-5">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">
                {formatVND(currentPrice)}
              </span>

              {currentOriginalPrice && currentOriginalPrice > currentPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatVND(currentOriginalPrice)}
                </span>
              )}

              {discountPercent && discountPercent > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-white">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Dynamic Variant Options */}
            {product.variantOptions.map((group) => {
              const selectedVal = selectedOptions[group.name];

              return (
                <div key={group.name} className="mb-5">
                  <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    <span>{group.name}</span>
                    <strong className="text-foreground">{selectedVal}</strong>
                  </div>

                  <div className="flex flex-wrap gap-2">
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
                      const isWeightGroup =
                        group.name.includes("Khối lượng") || group.name.includes("Trọng Lượng");

                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleSelectOption(group.name, val)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-xs font-bold"
                              : "border-border bg-card text-foreground hover:border-primary/50"
                          } ${isValOutOfStock && !isSelected ? "opacity-40" : ""}`}
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
            <div className="flex flex-wrap gap-3 items-center mt-7">
              <div className="inline-flex items-center border border-border rounded-xl bg-card overflow-hidden h-11">
                <button
                  type="button"
                  className="w-10 h-full flex items-center justify-center text-sm font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                  onClick={handleDecreaseQty}
                  disabled={effectiveQty <= 1 || isOutOfStock}
                  aria-label="Giảm số lượng"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold text-foreground">
                  {effectiveQty}
                </span>
                <button
                  type="button"
                  className="w-10 h-full flex items-center justify-center text-sm font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                  onClick={handleIncreaseQty}
                  disabled={effectiveQty >= currentStock || isOutOfStock}
                  aria-label="Tăng số lượng"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="flex-1 h-11 inline-flex items-center justify-center px-6 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? "Tạm Hết Hàng" : "Thêm Vào Giỏ Hàng"}
              </button>

              <button
                type="button"
                className="h-11 inline-flex items-center justify-center px-6 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
              >
                Mua Ngay
              </button>
            </div>

            {/* Specs Card */}
            {product.specs && product.specs.length > 0 && (
              <div className="mt-7 p-5 rounded-2xl bg-card border border-border">
                <div className="font-semibold text-xs text-foreground uppercase tracking-wider mb-3">
                  {isApparel
                    ? "Thông Số Chất Liệu & Bảo Hành"
                    : "Thành Phần Dinh Dưỡng Mỗi Khẩu Phần"}
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {product.specs.map((spec, i) => (
                      <tr key={i} className="border-b border-border/60 last:border-0">
                        <td className="py-2.5 text-muted-foreground">{spec.label}</td>
                        <td className="py-2.5 text-right font-medium text-foreground">
                          {spec.value}
                        </td>
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
            className="text-xs text-primary font-bold ml-2 underline hover:no-underline"
          >
            Xem giỏ
          </button>
        </div>
      )}
    </div>
  );
}
