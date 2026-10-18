"use client";

import React, { Suspense, useState, useTransition, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Product,
  ProductCategory,
  PriceFilterKey,
  SortOptionKey,
} from "@/data/products";
import { formatVND } from "@/lib/format";
import productApiRequest from "@/apiRequest/product";
import { transformBackendProductSummary } from "@/lib/backend-adapter";
import { useAutoSync } from "@/lib/sync";

// Fallback loader while searchParams resolve
function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[50vh] flex items-center justify-center gap-3 text-muted-foreground">
      <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
      </svg>
      <span className="text-sm font-medium">Đang tải danh mục sản phẩm TITANFIT...</span>
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

  // Dynamic product list fetched from backend
  const [productList, setProductList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadProducts = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await productApiRequest.getProducts({ page: 0, size: 50 });
      const content = res.data?.data?.content;
      if (content && Array.isArray(content)) {
        setProductList(content.map(transformBackendProductSummary));
        setFetchError(null);
      } else {
        setProductList([]);
      }
    } catch (err) {
      console.error("Error fetching products via productApiRequest:", err);
      setProductList([]);
      setFetchError("Không thể tải danh sách sản phẩm từ máy chủ.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProducts(false);
  }, [loadProducts]);

  // Tự động làm mới danh sách sản phẩm khi Admin thêm/sửa/tắt bật hoặc khi quay lại tab
  useAutoSync({
    eventTypes: ["PRODUCT_UPDATED"],
    onSync: () => loadProducts(true),
    intervalMs: 8000,
    enableFocusSync: true,
  });

  // Category item counts derived from loaded products
  const categoryCounts = useMemo(() => {
    const apparel = productList.filter((p) => p.category === "apparel").length;
    const supplements = productList.filter((p) => p.category === "supplements").length;
    return {
      total: productList.length,
      apparel,
      supplements,
    };
  }, [productList]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...productList];

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
        return typeof b.id === "number" && typeof a.id === "number"
          ? b.id - a.id
          : String(b.id).localeCompare(String(a.id));
      });
    }

    return result;
  }, [productList, searchQuery, activeCategory, activePrice, activeSort]);

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

      {/* Clean Breadcrumbs Header */}
      <div className="border-b border-border py-5 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs text-muted-foreground mb-1.5">
            <Link href="/" className="hover:text-foreground transition-colors">
              Trang Chủ
            </Link>{" "}
            / <span className="text-foreground font-medium">Danh Mục Sản Phẩm</span>
          </div>
          <div className="flex justify-between items-baseline flex-wrap gap-2.5">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
              {activeCategory === "supplements"
                ? "Thực Phẩm Bổ Sung Thể Hình"
                : activeCategory === "apparel"
                  ? "Đồ Tập & Phụ Kiện Thể Thao"
                  : "Tất Cả Sản Phẩm Dinh Dưỡng & Đồ Tập"}
            </h1>
            <span className="text-xs sm:text-sm text-muted-foreground">
              Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile Filter Trigger Button */}
        <div className="md:hidden flex items-center justify-between py-3 border-b border-border mb-4">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors text-foreground"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>Bộ Lọc</span>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-medium text-primary hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] gap-6">
          {/* CỘT TRÁI: SIDEBAR FILTER (Desktop) */}
          <aside className="hidden md:block bg-card border border-border rounded-2xl p-5 sticky top-24 self-start">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  Bộ Lọc Tìm Kiếm
                </span>
                {activeFiltersCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded transition-colors"
                >
                  Xóa lọc
                </button>
              )}
            </div>

            {/* Phân loại danh mục */}
            <div className="py-4 border-b border-border">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Phân Loại Danh Mục</div>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <input
                  type="radio"
                  name="category"
                  checked={activeCategory === "all"}
                  onChange={() => handleCategoryChange("all")}
                  className="accent-primary"
                />
                <span className={activeCategory === "all" ? "font-bold text-foreground" : ""}>
                  Tất cả ({categoryCounts.total})
                </span>
              </label>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <input
                  type="radio"
                  name="category"
                  checked={activeCategory === "apparel"}
                  onChange={() => handleCategoryChange("apparel")}
                  className="accent-primary"
                />
                <span className={activeCategory === "apparel" ? "font-bold text-foreground" : ""}>
                  Đồ thể thao ({categoryCounts.apparel})
                </span>
              </label>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <input
                  type="radio"
                  name="category"
                  checked={activeCategory === "supplements"}
                  onChange={() => handleCategoryChange("supplements")}
                  className="accent-primary"
                />
                <span className={activeCategory === "supplements" ? "font-bold text-foreground" : ""}>
                  Thực phẩm bổ sung ({categoryCounts.supplements})
                </span>
              </label>
            </div>

            {/* Lọc theo khoảng giá */}
            <div className="py-4 border-b border-border">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Khoảng Giá</div>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <input
                  type="radio"
                  name="price"
                  checked={activePrice === "all"}
                  onChange={() => handlePriceChange("all")}
                  className="accent-primary"
                />
                <span className={activePrice === "all" ? "font-bold text-foreground" : ""}>
                  Tất cả khoảng giá
                </span>
              </label>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <input
                  type="radio"
                  name="price"
                  checked={activePrice === "under500k"}
                  onChange={() => handlePriceChange("under500k")}
                  className="accent-primary"
                />
                <span className={activePrice === "under500k" ? "font-bold text-foreground" : ""}>
                  Dưới 500k
                </span>
              </label>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <input
                  type="radio"
                  name="price"
                  checked={activePrice === "500k-1tr"}
                  onChange={() => handlePriceChange("500k-1tr")}
                  className="accent-primary"
                />
                <span className={activePrice === "500k-1tr" ? "font-bold text-foreground" : ""}>
                  500k - 1tr
                </span>
              </label>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <input
                  type="radio"
                  name="price"
                  checked={activePrice === "1tr-2tr"}
                  onChange={() => handlePriceChange("1tr-2tr")}
                  className="accent-primary"
                />
                <span className={activePrice === "1tr-2tr" ? "font-bold text-foreground" : ""}>
                  1tr - 2tr
                </span>
              </label>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <input
                  type="radio"
                  name="price"
                  checked={activePrice === "over2tr"}
                  onChange={() => handlePriceChange("over2tr")}
                  className="accent-primary"
                />
                <span className={activePrice === "over2tr" ? "font-bold text-foreground" : ""}>
                  Trên 2tr
                </span>
              </label>
            </div>

            {/* Nút Đặt lại bộ lọc */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Tìm thấy <strong>{filteredProducts.length}</strong> sản phẩm
                </span>

                {/* Tags bộ lọc đang chọn */}
                <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
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
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
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
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Sắp xếp:
                </span>
                <select
                  value={activeSort}
                  onChange={handleSortChange}
                  className="px-3 py-1.5 rounded-xl border border-border bg-card text-foreground text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                </select>
              </div>
            </div>

            {/* LƯỚI SẢN PHẨM, LOADING SKELETON HOẶC EMPTY STATE */}
            {isLoading ? (
              /* Loading Skeleton Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, idx) => (
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
                ))}
              </div>
            ) : fetchError ? (
              /* Trạng thái lỗi tải dữ liệu từ máy chủ */
              <div className="p-12 text-center flex flex-col items-center justify-center bg-card border border-dashed border-destructive/40 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                  Lỗi kết nối máy chủ
                </h3>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
                  {fetchError}
                </p>
                <button
                  type="button"
                  onClick={() => loadProducts(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-sm text-sm"
                >
                  Thử lại
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              /* Trạng thái rỗng (Empty state) */
              <div className="p-12 text-center flex flex-col items-center justify-center bg-card border border-dashed border-border rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-4">
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
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                  Không tìm thấy sản phẩm nào
                </h3>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
                  Không có sản phẩm nào phù hợp với danh mục hoặc khoảng giá bạn đã chọn. Hãy thử nới lỏng bộ lọc hoặc đặt lại bộ lọc.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-sm text-sm"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map((product) => {
                  const discountPercent =
                    product.originalPrice && product.originalPrice > product.price
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
                      {/* Ảnh Thumbnail & Nhãn giảm giá / badge */}
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

                        <Link href={`/products/${product.slug}`} className="block w-full h-full relative">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            priority={typeof product.id === "number" ? product.id <= 4 : false}
                          />
                        </Link>
                      </div>

                      {/* Thông tin sản phẩm */}
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

                        {/* Hàng giá bán dạng xxx.xxx ₫ */}
                        <div className="flex items-baseline gap-2 mt-auto mb-3">
                          <span className="text-base font-bold text-primary">{formatVND(product.price)}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-xs text-muted-foreground line-through">{formatVND(product.originalPrice)}</span>
                          )}
                        </div>

                        {/* Nút hành động */}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/products/${product.slug}`}
                            className="flex-1 text-center py-2 px-3 text-xs font-semibold rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                          >
                            Xem chi tiết
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="p-2 rounded-xl border border-border text-foreground hover:bg-primary hover:text-white hover:border-primary transition-colors"
                            title="Thêm nhanh vào giỏ"
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
            className="relative ml-auto w-full max-w-xs h-full bg-background border-l border-border p-5 flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-200"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-heading font-semibold text-base text-foreground">Bộ Lọc Sản Phẩm</h3>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {/* Danh mục */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Phân Loại Danh Mục</div>
                <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <input
                    type="radio"
                    name="mobile-category"
                    checked={activeCategory === "all"}
                    onChange={() => handleCategoryChange("all")}
                    className="accent-primary"
                  />
                  <span>Tất cả ({categoryCounts.total})</span>
                </label>
                <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <input
                    type="radio"
                    name="mobile-category"
                    checked={activeCategory === "apparel"}
                    onChange={() => handleCategoryChange("apparel")}
                    className="accent-primary"
                  />
                  <span>Đồ thể thao ({categoryCounts.apparel})</span>
                </label>
                <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <input
                    type="radio"
                    name="mobile-category"
                    checked={activeCategory === "supplements"}
                    onChange={() => handleCategoryChange("supplements")}
                    className="accent-primary"
                  />
                  <span>Thực phẩm bổ sung ({categoryCounts.supplements})</span>
                </label>
              </div>

              {/* Khoảng giá */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Khoảng Giá</div>
                <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <input
                    type="radio"
                    name="mobile-price"
                    checked={activePrice === "all"}
                    onChange={() => handlePriceChange("all")}
                    className="accent-primary"
                  />
                  <span>Tất cả</span>
                </label>
                <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <input
                    type="radio"
                    name="mobile-price"
                    checked={activePrice === "under500k"}
                    onChange={() => handlePriceChange("under500k")}
                    className="accent-primary"
                  />
                  <span>Dưới 500k</span>
                </label>
                <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <input
                    type="radio"
                    name="mobile-price"
                    checked={activePrice === "500k-1tr"}
                    onChange={() => handlePriceChange("500k-1tr")}
                    className="accent-primary"
                  />
                  <span>500k - 1tr</span>
                </label>
                <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <input
                    type="radio"
                    name="mobile-price"
                    checked={activePrice === "1tr-2tr"}
                    onChange={() => handlePriceChange("1tr-2tr")}
                    className="accent-primary"
                  />
                  <span>1tr - 2tr</span>
                </label>
                <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <input
                    type="radio"
                    name="mobile-price"
                    checked={activePrice === "over2tr"}
                    onChange={() => handlePriceChange("over2tr")}
                    className="accent-primary"
                  />
                  <span>Trên 2tr</span>
                </label>
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-4 border-t border-border flex gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors text-foreground"
              >
                Đặt lại
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
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
