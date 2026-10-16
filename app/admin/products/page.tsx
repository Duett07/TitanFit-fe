"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import productApiRequest from "@/apiRequest/product";
import { ProductSummaryDto } from "@/types/product.type";
import { formatVND } from "@/data/products";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedProduct, setSelectedProduct] = useState<ProductSummaryDto | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await productApiRequest.getProducts({ size: 100 });
      const items = res.data?.data?.content || [];
      setProducts(items);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        errorObj.response?.data?.message ||
        errorObj.message ||
        "Không thể tải danh sách sản phẩm từ backend."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Extract unique categories
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.categorySlug && p.categoryName) {
        map.set(p.categorySlug, p.categoryName);
      }
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchCat = categoryFilter === "ALL" || p.categorySlug === categoryFilter;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.variants && p.variants.some((v) => v.sku?.toLowerCase().includes(q)));
      return matchCat && matchQuery;
    });
  }, [products, categoryFilter, searchQuery]);

  // Total stock across all variants
  const getTotalStock = (p: ProductSummaryDto) => {
    if (!p.variants || !Array.isArray(p.variants)) return 0;
    return p.variants.reduce((acc, cur) => acc + (cur.stockQuantity || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Quản Lý Sản Phẩm
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/25">
              {products.length} sản phẩm
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Backend API
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Danh mục sản phẩm, biến thể SKU và số lượng tồn kho đồng bộ trực tiếp từ Spring Boot
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchProducts}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-card hover:bg-secondary text-foreground border border-border transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={isLoading ? "animate-spin text-primary" : ""}
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            <span>{isLoading ? "Đang tải..." : "Làm Mới"}</span>
          </button>

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Về Tổng Quan</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-center justify-between gap-3">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={fetchProducts}
            className="px-3 py-1 rounded-lg bg-destructive text-white font-bold text-xs hover:bg-destructive/90 cursor-pointer"
          >
            Thử Lại
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sản phẩm, slug, SKU..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Select Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Danh mục:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 text-xs rounded-xl bg-card border border-border px-3 text-foreground focus:outline-none focus:border-primary cursor-pointer shadow-xs"
          >
            <option value="ALL">Tất cả danh mục ({products.length})</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3.5 px-4 whitespace-nowrap">Sản Phẩm</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Danh Mục</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Giá Niêm Yết</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Số Biến Thể</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Tổng Tồn Kho</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`sk-${idx}`} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-muted rounded w-48" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-muted rounded w-28" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-muted rounded w-20" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-muted rounded w-16" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-muted rounded w-20" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-7 bg-muted rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const totalStock = getTotalStock(p);
                  return (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      {/* Sản phẩm */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                            <Image
                              src={p.thumbnailUrl || "/images/placeholder.png"}
                              alt={p.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(p)}
                              className="font-bold text-foreground hover:text-primary transition-colors text-left line-clamp-1 cursor-pointer"
                            >
                              {p.name}
                            </button>
                            <span className="font-mono text-[10px] text-muted-foreground block truncate">
                              /{p.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Danh mục */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-secondary text-foreground border border-border">
                          {p.categoryName || "Chưa phân loại"}
                        </span>
                      </td>

                      {/* Giá niêm yết */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-foreground">
                        {formatVND(p.basePrice)}
                      </td>

                      {/* Số biến thể */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-medium text-foreground">
                          {p.variants?.length || 0} biến thể
                        </span>
                      </td>

                      {/* Tổng tồn kho */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            totalStock === 0
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                              : totalStock < 10
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {totalStock === 0 ? "Hết hàng" : totalStock < 10 ? `Sắp hết: ${totalStock}` : `Còn ${totalStock}`}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(p)}
                            className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-secondary text-foreground text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Chi Tiết SKU
                          </button>
                          <Link
                            href={`/products/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-[11px] transition-colors"
                            title="Xem trang Buyer"
                          >
                            ↗
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi Tiết Sản Phẩm & SKU */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                  <Image
                    src={selectedProduct.thumbnailUrl || "/images/placeholder.png"}
                    alt={selectedProduct.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground line-clamp-1">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedProduct.categoryName} • Giá cơ sở: {formatVND(selectedProduct.basePrice)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-foreground text-sm mb-2">
                  Danh Sách Biến Thể SKU ({selectedProduct.variants?.length || 0})
                </h4>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                        <th className="py-2.5 px-3">SKU Code</th>
                        <th className="py-2.5 px-3">Tên Biến Thể</th>
                        <th className="py-2.5 px-3 font-mono">Đơn Giá</th>
                        <th className="py-2.5 px-3 text-right">Tồn Kho</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {selectedProduct.variants?.map((v) => (
                        <tr key={v.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-mono text-primary font-bold">{v.sku}</td>
                          <td className="py-2.5 px-3 text-foreground font-medium">{v.variantName}</td>
                          <td className="py-2.5 px-3 font-mono">{formatVND(v.price)}</td>
                          <td className="py-2.5 px-3 text-right font-bold">
                            <span
                              className={
                                v.stockQuantity < 5
                                  ? "text-rose-500 font-bold"
                                  : v.stockQuantity < 10
                                  ? "text-amber-500 font-bold"
                                  : "text-foreground"
                              }
                            >
                              {v.stockQuantity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
              <Link
                href={`/products/${selectedProduct.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary font-semibold hover:underline"
              >
                Xem trên Storefront Buyer &rarr;
              </Link>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
