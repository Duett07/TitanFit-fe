"use client";

import React, { Suspense, useState, useTransition, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PRODUCTS,
  Product,
  ProductCategory,
  PriceFilterKey,
  SortOptionKey,
  formatVND,
} from "@/data/products";

// Fallback loader while searchParams resolve
function ProductsLoading() {
  return (
    <div className="container" style={{ padding: "40px 0", minHeight: "50vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--muted-foreground)" }}>
        <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
        </svg>
        <span>Đang tải danh mục sản phẩm TITANFIT...</span>
      </div>
    </div>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Mobile Filter Drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Cart toast notification
  const [toastText, setToastText] = useState<string | null>(null);

  // Parse filters from URL Search Params
  const categoryParam = searchParams.get("category") || searchParams.get("type");
  const priceParam = searchParams.get("price");
  const sortParam = searchParams.get("sort");
  const searchQuery = searchParams.get("q")?.trim();

  // Normalize Category
  const activeCategory: ProductCategory = useMemo(() => {
    if (!categoryParam) return "all";
    const lower = categoryParam.toLowerCase();
    if (lower === "apparel" || lower === "sports_gear" || lower === "dothethao") {
      return "apparel";
    }
    if (lower === "supplements" || lower === "thucphambosung") {
      return "supplements";
    }
    return "all";
  }, [categoryParam]);

  // Normalize Price Filter
  const activePrice: PriceFilterKey = useMemo(() => {
    if (
      priceParam === "under500k" ||
      priceParam === "500k-1tr" ||
      priceParam === "1tr-2tr" ||
      priceParam === "over2tr"
    ) {
      return priceParam;
    }
    return "all";
  }, [priceParam]);

  // Normalize Sort
  const activeSort: SortOptionKey = useMemo(() => {
    if (sortParam === "price-asc" || sortParam === "price-desc") {
      return sortParam;
    }
    return "newest";
  }, [sortParam]);

  // Helper to update URL params
  const updateParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === "all") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `/products?${queryString}` : "/products", {
        scroll: false,
      });
    });
  };

  // Filter Handlers
  const handleCategoryChange = (category: ProductCategory) => {
    updateParams({ category: category === "all" ? null : category });
  };

  const handlePriceChange = (price: PriceFilterKey) => {
    updateParams({ price: price === "all" ? null : price });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sort = e.target.value as SortOptionKey;
    updateParams({ sort: sort === "newest" ? null : sort });
  };

  const handleClearSearch = () => {
    updateParams({ q: null });
  };

  const handleResetFilters = () => {
    startTransition(() => {
      router.replace("/products", { scroll: false });
    });
    setIsMobileFilterOpen(false);
  };

  // Quick add to cart
  const handleAddToCart = (product: Product) => {
    setToastText(`Đã thêm "${product.name}" vào giỏ hàng!`);
    setTimeout(() => {
      setToastText(null);
    }, 3000);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...PRODUCTS];

    // 0. Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.categoryLabel.toLowerCase().includes(q) ||
          (item.badge && item.badge.toLowerCase().includes(q))
      );
    }

    // 1. Filter by category
    if (activeCategory !== "all") {
      result = result.filter((item) => item.category === activeCategory);
    }

    // 2. Filter by price range
    if (activePrice === "under500k") {
      result = result.filter((item) => item.price < 500000);
    } else if (activePrice === "500k-1tr") {
      result = result.filter((item) => item.price >= 500000 && item.price <= 1000000);
    } else if (activePrice === "1tr-2tr") {
      result = result.filter((item) => item.price > 1000000 && item.price <= 2000000);
    } else if (activePrice === "over2tr") {
      result = result.filter((item) => item.price > 2000000);
    }

    // 3. Sort
    if (activeSort === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (activeSort === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else {
      // Newest (higher id or isNew prioritized)
      result.sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return b.id - a.id;
      });
    }

    return result;
  }, [searchQuery, activeCategory, activePrice, activeSort]);

  // Count active filters (for badge)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (activeCategory !== "all") count++;
    if (activePrice !== "all") count++;
    return count;
  }, [searchQuery, activeCategory, activePrice]);

  return (
    <>
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

      {/* Clean Breadcrumbs Header - Match Wireframe */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "18px 0",
          backgroundColor: "var(--card-surface)",
        }}
      >
        <div className="container">
          <div
            style={{
              fontSize: "12px",
              color: "var(--subtle-foreground)",
              marginBottom: "6px",
            }}
          >
            <Link href="/" style={{ color: "var(--muted-foreground)" }}>
              Trang Chủ
            </Link>{" "}
            / <span style={{ color: "var(--foreground)" }}>Danh Mục Sản Phẩm</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "10px" }}>
            <h1
              className="font-heading"
              style={{ fontSize: "26px", fontWeight: "700" }}
            >
              {activeCategory === "supplements"
                ? "Thực Phẩm Bổ Sung Thể Hình"
                : activeCategory === "apparel"
                  ? "Đồ Tập & Phụ Kiện Thể Thao"
                  : "Tất Cả Sản Phẩm Dinh Dưỡng & Đồ Tập"}
            </h1>
            <span style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
              Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm
            </span>
          </div>
        </div>
      </div>

      <main className="container">
        {/* Mobile Filter Trigger Button */}
        <div className="md:hidden flex items-center justify-between py-3 border-b border-[var(--border)] mb-4">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="btn btn-outline btn-sm flex items-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>Bộ Lọc</span>
            {activeFiltersCount > 0 && (
              <span className="badge badge-primary px-1.5 py-0.2 text-[11px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-[var(--primary)] hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="catalog-grid">
          {/* CỘT TRÁI: SIDEBAR FILTER (Desktop) */}
          <aside className="filter-card hidden md:block">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--foreground)",
                  }}
                >
                  Bộ Lọc Tìm Kiếm
                </span>
                {activeFiltersCount > 0 && (
                  <span className="badge badge-primary text-[10px] px-1.5 py-0.5">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-ghost btn-sm text-[11.5px] p-1 h-auto"
                >
                  Xóa lọc
                </button>
              )}
            </div>

            {/* Phân loại danh mục */}
            <div className="filter-sec">
              <div className="filter-heading">Phân Loại Danh Mục</div>
              <label className="check-label">
                <input
                  type="radio"
                  name="category"
                  checked={activeCategory === "all"}
                  onChange={() => handleCategoryChange("all")}
                />
                <span style={{ fontWeight: activeCategory === "all" ? 600 : 400 }}>
                  Tất cả ({PRODUCTS.length})
                </span>
              </label>
              <label className="check-label">
                <input
                  type="radio"
                  name="category"
                  checked={activeCategory === "apparel"}
                  onChange={() => handleCategoryChange("apparel")}
                />
                <span style={{ fontWeight: activeCategory === "apparel" ? 600 : 400 }}>
                  Đồ thể thao ({PRODUCTS.filter((p) => p.category === "apparel").length})
                </span>
              </label>
              <label className="check-label">
                <input
                  type="radio"
                  name="category"
                  checked={activeCategory === "supplements"}
                  onChange={() => handleCategoryChange("supplements")}
                />
                <span style={{ fontWeight: activeCategory === "supplements" ? 600 : 400 }}>
                  Thực phẩm bổ sung ({PRODUCTS.filter((p) => p.category === "supplements").length})
                </span>
              </label>
            </div>

            {/* Lọc theo khoảng giá */}
            <div className="filter-sec">
              <div className="filter-heading">Khoảng Giá</div>
              <label className="check-label">
                <input
                  type="radio"
                  name="price"
                  checked={activePrice === "all"}
                  onChange={() => handlePriceChange("all")}
                />
                <span style={{ fontWeight: activePrice === "all" ? 600 : 400 }}>
                  Tất cả khoảng giá
                </span>
              </label>
              <label className="check-label">
                <input
                  type="radio"
                  name="price"
                  checked={activePrice === "under500k"}
                  onChange={() => handlePriceChange("under500k")}
                />
                <span style={{ fontWeight: activePrice === "under500k" ? 600 : 400 }}>
                  Dưới 500k
                </span>
              </label>
              <label className="check-label">
                <input
                  type="radio"
                  name="price"
                  checked={activePrice === "500k-1tr"}
                  onChange={() => handlePriceChange("500k-1tr")}
                />
                <span style={{ fontWeight: activePrice === "500k-1tr" ? 600 : 400 }}>
                  500k - 1tr
                </span>
              </label>
              <label className="check-label">
                <input
                  type="radio"
                  name="price"
                  checked={activePrice === "1tr-2tr"}
                  onChange={() => handlePriceChange("1tr-2tr")}
                />
                <span style={{ fontWeight: activePrice === "1tr-2tr" ? 600 : 400 }}>
                  1tr - 2tr
                </span>
              </label>
              <label className="check-label">
                <input
                  type="radio"
                  name="price"
                  checked={activePrice === "over2tr"}
                  onChange={() => handlePriceChange("over2tr")}
                />
                <span style={{ fontWeight: activePrice === "over2tr" ? 600 : 400 }}>
                  Trên 2tr
                </span>
              </label>
            </div>

            {/* Nút Đặt lại bộ lọc */}
            <div style={{ paddingTop: "8px" }}>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-outline btn-sm w-full justify-center"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                <span>Đặt lại bộ lọc</span>
              </button>
            </div>
          </aside>

          {/* CỘT PHẢI: PRODUCT GRID & TOOLBAR */}
          <section>
            {/* Thanh chọn sắp xếp & đếm sản phẩm */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                  Tìm thấy <strong>{filteredProducts.length}</strong> sản phẩm
                </span>

                {/* Tags bộ lọc đang chọn */}
                <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
                  {searchQuery && (
                    <span className="badge badge-secondary text-xs flex items-center gap-1">
                      Tìm: &ldquo;{searchQuery}&rdquo;
                      <button
                        onClick={handleClearSearch}
                        className="hover:text-red-500 font-bold ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {activeCategory !== "all" && (
                    <span className="badge badge-secondary text-xs flex items-center gap-1">
                      {activeCategory === "apparel" ? "Đồ thể thao" : "Thực phẩm bổ sung"}
                      <button
                        onClick={() => handleCategoryChange("all")}
                        className="hover:text-red-500 font-bold ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {activePrice !== "all" && (
                    <span className="badge badge-secondary text-xs flex items-center gap-1">
                      {activePrice === "under500k"
                        ? "Dưới 500k"
                        : activePrice === "500k-1tr"
                          ? "500k - 1tr"
                          : activePrice === "1tr-2tr"
                            ? "1tr - 2tr"
                            : "Trên 2tr"}
                      <button
                        onClick={() => handlePriceChange("all")}
                        className="hover:text-red-500 font-bold ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>

              {/* Thanh chọn sắp xếp */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "12.5px",
                    color: "var(--subtle-foreground)",
                  }}
                >
                  Sắp xếp:
                </span>
                <select
                  value={activeSort}
                  onChange={handleSortChange}
                  className="input cursor-pointer"
                  style={{ width: "170px", height: "34px", fontSize: "12.5px" }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                </select>
              </div>
            </div>

            {/* LƯỚI SẢN PHẨM HOẶC EMPTY STATE */}
            {filteredProducts.length === 0 ? (
              /* Trạng thái rỗng (Empty state) */
              <div
                className="card"
                style={{
                  padding: "60px 24px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "var(--card-surface)",
                  border: "1px dashed var(--border)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    backgroundColor: "var(--secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    color: "var(--muted-foreground)",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </div>
                <h3
                  className="font-heading"
                  style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}
                >
                  Không tìm thấy sản phẩm nào
                </h3>
                <p
                  style={{
                    fontSize: "13.5px",
                    color: "var(--muted-foreground)",
                    maxWidth: "420px",
                    lineHeight: "1.5",
                    marginBottom: "24px",
                  }}
                >
                  Không có sản phẩm nào phù hợp với danh mục hoặc khoảng giá bạn đã chọn. Hãy thử nới lỏng bộ lọc hoặc đặt lại bộ lọc.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-primary"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mr-1.5"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                  <span>Đặt lại bộ lọc</span>
                </button>
              </div>
            ) : (
              /* Lưới sản phẩm (Product Grid) */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: "18px",
                }}
              >
                {filteredProducts.map((product) => {
                  const discountPercent = product.originalPrice
                    ? Math.round(
                      ((product.originalPrice - product.price) / product.originalPrice) * 100
                    )
                    : null;

                  return (
                    <div key={product.id} className="product-card">
                      {/* Ảnh Thumbnail & Nhãn giảm giá / badge */}
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

                        <Link href={`/products/${product.slug}`} className="block w-full h-full">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={320}
                            height={320}
                            className="w-full h-full object-cover transition-transform duration-300"
                            priority={product.id <= 4}
                          />
                        </Link>
                      </div>

                      {/* Thông tin sản phẩm */}
                      <div className="product-info">
                        <span className="product-category">{product.categoryLabel}</span>
                        <Link
                          href={`/products/${product.slug}`}
                          className="product-name hover:text-[var(--primary)] transition-colors"
                          title={product.name}
                        >
                          {product.name}
                        </Link>

                        {/* Hàng giá bán dạng xxx.xxx ₫ */}
                        <div className="product-price-row">
                          <span className="price-main">{formatVND(product.price)}</span>
                          {product.originalPrice && (
                            <span className="price-del">{formatVND(product.originalPrice)}</span>
                          )}
                        </div>

                        {/* Nút hành động */}
                        <div className="product-actions">
                          <Link
                            href={`/products/${product.slug}`}
                            className="btn btn-secondary btn-sm flex-1 text-center justify-center font-medium"
                          >
                            Xem chi tiết
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="btn btn-outline btn-sm btn-icon"
                            title="Thêm nhanh vào giỏ"
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
            )}
          </section>
        </div>
      </main>

      {/* MOBILE FILTER DRAWER / SHEET */}
      {isMobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Drawer content */}
          <div
            className="relative ml-auto w-full max-w-xs h-full bg-[var(--background)] border-l border-[var(--border)] p-5 flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-200"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <h3 className="font-heading font-semibold text-base">Bộ Lọc Sản Phẩm</h3>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="btn btn-ghost btn-sm btn-icon"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {/* Danh mục */}
              <div>
                <div className="filter-heading">Phân Loại Danh Mục</div>
                <label className="check-label">
                  <input
                    type="radio"
                    name="mobile-category"
                    checked={activeCategory === "all"}
                    onChange={() => handleCategoryChange("all")}
                  />
                  <span>Tất cả ({PRODUCTS.length})</span>
                </label>
                <label className="check-label">
                  <input
                    type="radio"
                    name="mobile-category"
                    checked={activeCategory === "apparel"}
                    onChange={() => handleCategoryChange("apparel")}
                  />
                  <span>Đồ thể thao ({PRODUCTS.filter((p) => p.category === "apparel").length})</span>
                </label>
                <label className="check-label">
                  <input
                    type="radio"
                    name="mobile-category"
                    checked={activeCategory === "supplements"}
                    onChange={() => handleCategoryChange("supplements")}
                  />
                  <span>Thực phẩm bổ sung ({PRODUCTS.filter((p) => p.category === "supplements").length})</span>
                </label>
              </div>

              {/* Khoảng giá */}
              <div>
                <div className="filter-heading">Khoảng Giá</div>
                <label className="check-label">
                  <input
                    type="radio"
                    name="mobile-price"
                    checked={activePrice === "all"}
                    onChange={() => handlePriceChange("all")}
                  />
                  <span>Tất cả</span>
                </label>
                <label className="check-label">
                  <input
                    type="radio"
                    name="mobile-price"
                    checked={activePrice === "under500k"}
                    onChange={() => handlePriceChange("under500k")}
                  />
                  <span>Dưới 500k</span>
                </label>
                <label className="check-label">
                  <input
                    type="radio"
                    name="mobile-price"
                    checked={activePrice === "500k-1tr"}
                    onChange={() => handlePriceChange("500k-1tr")}
                  />
                  <span>500k - 1tr</span>
                </label>
                <label className="check-label">
                  <input
                    type="radio"
                    name="mobile-price"
                    checked={activePrice === "1tr-2tr"}
                    onChange={() => handlePriceChange("1tr-2tr")}
                  />
                  <span>1tr - 2tr</span>
                </label>
                <label className="check-label">
                  <input
                    type="radio"
                    name="mobile-price"
                    checked={activePrice === "over2tr"}
                    onChange={() => handlePriceChange("over2tr")}
                  />
                  <span>Trên 2tr</span>
                </label>
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-4 border-t border-[var(--border)] flex gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-outline btn-sm flex-1 justify-center"
              >
                Đặt lại
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="btn btn-primary btn-sm flex-1 justify-center"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  );
}
