"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import productApiRequest from "@/apiRequest/product";
import { ProductSummaryDto, VariantDto } from "@/types/product.type";
import { formatVND } from "@/data/products";

interface LowStockItem {
  id: string;
  sku: string;
  productName: string;
  slug: string;
  variantName: string;
  price: number;
  stock: number;
}

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(10);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await productApiRequest.getProducts({ size: 100 });
      const products: ProductSummaryDto[] = res.data?.data?.content || [];
      const items: LowStockItem[] = [];

      products.forEach((p: ProductSummaryDto) => {
        if (p.variants && Array.isArray(p.variants)) {
          p.variants.forEach((v: VariantDto) => {
            items.push({
              id: v.id,
              sku: v.sku,
              productName: p.name,
              slug: p.slug,
              variantName: v.variantName || "Tiêu chuẩn",
              price: v.price,
              stock: v.stockQuantity ?? 0,
            });
          });
        }
      });

      // Sort lowest stock first
      items.sort((a, b) => a.stock - b.stock);
      setInventory(items);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        errorObj.response?.data?.message ||
        errorObj.message ||
        "Không thể tải dữ liệu tồn kho từ backend."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const alertItems = useMemo(() => {
    return inventory.filter((item) => item.stock <= threshold);
  }, [inventory, threshold]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Cảnh Báo Tồn Kho & SKU
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/30">
              {alertItems.length} SKU cảnh báo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kiểm soát mức dự trữ kho cho từng SKU, phát hiện kịp thời các sản phẩm sắp cạn hàng
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchInventory}
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
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground transition-colors"
          >
            <span>Quản Lý Sản Phẩm</span>
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={fetchInventory}
            className="px-3 py-1 rounded bg-destructive text-white font-bold"
          >
            Thử Lại
          </button>
        </div>
      )}

      {/* Threshold Control */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border text-xs">
        <span className="font-semibold text-foreground">Ngưỡng cảnh báo tồn kho:</span>
        <div className="flex items-center gap-2">
          {[5, 10, 15, 20].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setThreshold(num)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                threshold === num
                  ? "bg-amber-500 text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              &le; {num} sản phẩm
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3.5 px-4 whitespace-nowrap">Mã SKU</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Tên Sản Phẩm</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Biến Thể</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Đơn Giá</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Mức Tồn Kho</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Trạng Thái Kho</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`sk-${idx}`} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-muted rounded w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-muted rounded w-44" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-muted rounded w-28" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-muted rounded w-16" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-muted rounded w-12" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-muted rounded-full w-20" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-6 bg-muted rounded w-12 ml-auto" /></td>
                  </tr>
                ))
              ) : alertItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="text-2xl mb-2">🎉</div>
                    <p className="font-semibold text-sm text-foreground">Không có SKU nào dưới ngưỡng cảnh báo</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Tất cả các mặt hàng hiện đều có lượng tồn kho an toàn.</p>
                  </td>
                </tr>
              ) : (
                alertItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary whitespace-nowrap">
                      {item.sku}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {item.productName}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {item.variantName}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {formatVND(item.price)}
                    </td>
                    <td className="py-3.5 px-4 font-black text-sm">
                      <span className={item.stock === 0 ? "text-rose-600" : "text-amber-500"}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.stock === 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          Hết hàng
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          Sắp hết ({item.stock})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/products/${item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-secondary text-foreground text-[11px] font-semibold transition-colors inline-block"
                      >
                        Xem SP ↗
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
