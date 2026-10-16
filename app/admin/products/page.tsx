"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import productApiRequest from "@/apiRequest/product";
import categoryApiRequest from "@/apiRequest/category";
import {
  ProductSummaryDto,
  AdminProductFormDto,
  CreateProductVariantDto,
} from "@/types/product.type";
import { CategoryDto } from "@/types/category.type";
import { formatVND } from "@/data/products";
import { emitSyncEvent, useAutoSync } from "@/lib/sync";

// Mẫu ảnh sẵn cho tiện chọn nhanh khi thêm sản phẩm mới
const SAMPLE_IMAGES = [
  { label: "Whey Protein", url: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80" },
  { label: "Áo Thun Pro-Combat", url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80" },
  { label: "Creatine 300g", url: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=600&q=80" },
  { label: "Pre-Workout C4", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80" },
  { label: "Bình Lắc Shaker", url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80" },
  { label: "Quần Short Gym", url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductSummaryDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // State cho Modal Thêm Mới / Sửa Sản Phẩm
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategorySlug, setFormCategorySlug] = useState("");
  const [formBasePrice, setFormBasePrice] = useState<number | "">("");
  const [formDescription, setFormDescription] = useState("");
  const [formThumbnailUrl, setFormThumbnailUrl] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formVariants, setFormVariants] = useState<CreateProductVariantDto[]>([
    { variantName: "Mặc định", price: 0, stockQuantity: 50, sku: "" },
  ]);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Tải danh mục từ backend
  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryApiRequest.getAllCategories();
      const list = res.data?.data || [];
      setCategories(list);
      if (list.length > 0 && !formCategorySlug) {
        setFormCategorySlug(list[0].slug);
      }
    } catch (e) {
      console.warn("Could not load categories:", e);
    }
  }, [formCategorySlug]);

  // Tải danh sách sản phẩm từ backend
  const fetchProducts = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setIsLoading(true);
      setErrorMessage(null);
    }
    try {
      // Ưu tiên endpoint Admin để lấy cả sản phẩm ẩn
      let items: ProductSummaryDto[] = [];
      try {
        const adminRes = await productApiRequest.adminGetAllProducts();
        items = adminRes.data?.data || [];
      } catch {
        const publicRes = await productApiRequest.getProducts({ size: 100 });
        items = publicRes.data?.data?.content || [];
      }
      setProducts(items);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        errorObj.response?.data?.message ||
        errorObj.message ||
        "Không thể tải danh sách sản phẩm từ backend."
      );
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  // Real-time synchronization: Auto-refresh products when updated from other tabs or actions
  useAutoSync({
    eventTypes: ["PRODUCT_UPDATED", "INVENTORY_UPDATED"],
    onSync: () => fetchProducts(true),
    intervalMs: 6000,
    enableFocusSync: true,
  });

  // Bật/Tắt trạng thái is_active trực tiếp trên bảng
  const handleToggleActive = async (p: ProductSummaryDto) => {
    const currentActive = p.isActive !== undefined ? p.isActive : true;
    const nextActive = !currentActive;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((item) =>
        item.id === p.id ? { ...item, isActive: nextActive } : item
      )
    );

    try {
      await productApiRequest.adminToggleActive(p.id, nextActive);
      if (nextActive) {
        showToast(`Đã kích hoạt sản phẩm "${p.name}" ĐANG BÁN!`, "success");
      } else {
        showToast(`Đã chuyển sản phẩm "${p.name}" sang TẠM ẨN!`, "info");
      }
      // Bắn sự kiện đồng bộ tức thời sang trang chủ và trang danh mục sản phẩm của Buyer
      emitSyncEvent("PRODUCT_UPDATED", { productId: p.id, isActive: nextActive });
    } catch (err) {
      console.error("Toggle active error:", err);
      // Revert lại nếu có lỗi
      setProducts((prev) =>
        prev.map((item) =>
          item.id === p.id ? { ...item, isActive: currentActive } : item
        )
      );
      showToast("Không thể thay đổi trạng thái sản phẩm lúc này.", "error");
    }
  };

  // Mở Modal Thêm Sản Phẩm Mới
  const openAddProductModal = () => {
    setEditingProductId(null);
    setFormName("");
    setFormSlug("");
    setFormCategorySlug(categories[0]?.slug || "whey-protein");
    setFormBasePrice("");
    setFormDescription("");
    setFormThumbnailUrl(SAMPLE_IMAGES[0].url);
    setFormIsActive(true);
    setFormVariants([
      { variantName: "Tiêu chuẩn", price: 0, stockQuantity: 50, sku: "" },
    ]);
    setIsModalOpen(true);
  };

  // Mở Modal Sửa Sản Phẩm
  const openEditProductModal = async (p: ProductSummaryDto) => {
    setEditingProductId(p.id);
    setFormName(p.name);
    setFormSlug(p.slug || "");
    setFormCategorySlug(p.categorySlug || categories[0]?.slug || "");
    setFormBasePrice(p.basePrice);
    setFormThumbnailUrl(p.thumbnailUrl || SAMPLE_IMAGES[0].url);
    setFormIsActive(p.isActive !== undefined ? p.isActive : true);

    // Điền danh sách biến thể có sẵn
    if (p.variants && p.variants.length > 0) {
      setFormVariants(
        p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          variantName: v.variantName,
          price: v.price,
          stockQuantity: v.stockQuantity,
        }))
      );
    } else {
      setFormVariants([
        { variantName: "Tiêu chuẩn", price: p.basePrice, stockQuantity: 50, sku: "" },
      ]);
    }

    setIsModalOpen(true);

    // Cố gắng tải thêm mô tả chi tiết nếu có
    try {
      const detailRes = await productApiRequest.getProductBySlug(p.slug);
      if (detailRes.data?.data?.description) {
        setFormDescription(detailRes.data.data.description);
      }
    } catch {
      setFormDescription("");
    }
  };

  // Đóng modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProductId(null);
  };

  // Xử lý thêm một dòng biến thể mới
  const handleAddVariantRow = () => {
    const defaultPrice = Number(formBasePrice) || 0;
    setFormVariants((prev) => [
      ...prev,
      {
        variantName: "",
        price: defaultPrice,
        stockQuantity: 20,
        sku: "",
      },
    ]);
  };

  // Xử lý thay đổi trường trong biến thể
  const handleVariantChange = (
    index: number,
    field: keyof CreateProductVariantDto,
    val: string | number
  ) => {
    setFormVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Xóa một dòng biến thể
  const handleRemoveVariantRow = (index: number) => {
    if (formVariants.length <= 1) {
      showToast("Sản phẩm cần ít nhất một biến thể hoặc SKU!", "error");
      return;
    }
    setFormVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Xử lý chọn ảnh từ máy tính (FileReader sang Base64 data URL)
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn đúng tệp hình ảnh (PNG, JPG, WEBP)!", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhẹ hơn!", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      setFormThumbnailUrl(base64Url);
      showToast("Đã tải ảnh lên thành công!", "success");
    };
    reader.readAsDataURL(file);
  };

  // Bấm "Lưu Sản Phẩm" ➔ Gọi API backend cập nhật ngay lập tức
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showToast("Vui lòng nhập tên sản phẩm!", "error");
      return;
    }
    if (formBasePrice === "" || Number(formBasePrice) < 0) {
      showToast("Vui lòng nhập giá cơ bản hợp lệ!", "error");
      return;
    }
    if (formVariants.length === 0) {
      showToast("Vui lòng thêm ít nhất một biến thể SKU!", "error");
      return;
    }

    const cleanVariants = formVariants.map((v, i) => ({
      id: v.id,
      variantName: v.variantName.trim() || `Biến thể ${i + 1}`,
      price: Number(v.price) >= 0 ? Number(v.price) : Number(formBasePrice),
      stockQuantity: Number(v.stockQuantity) >= 0 ? Number(v.stockQuantity) : 0,
      sku: v.sku?.trim() || undefined,
    }));

    const payload: AdminProductFormDto = {
      name: formName.trim(),
      slug: formSlug.trim() || undefined,
      categorySlug: formCategorySlug || categories[0]?.slug || "whey-protein",
      basePrice: Number(formBasePrice),
      description: formDescription.trim(),
      thumbnailUrl: formThumbnailUrl || SAMPLE_IMAGES[0].url,
      isActive: formIsActive,
      variants: cleanVariants,
    };

    setIsSaving(true);
    try {
      if (editingProductId) {
        await productApiRequest.adminUpdateProduct(editingProductId, payload);
        showToast(`Đã cập nhật sản phẩm "${payload.name}" thành công!`, "success");
      } else {
        await productApiRequest.adminCreateProduct(payload);
        showToast(`Đã thêm mới sản phẩm "${payload.name}" thành công!`, "success");
      }
      closeModal();
      // Bắn sự kiện đồng bộ để trang Buyer cập nhật sản phẩm mới ngay lập tức
      emitSyncEvent("PRODUCT_UPDATED");
      emitSyncEvent("INVENTORY_UPDATED");
      await fetchProducts(true);
    } catch (err: unknown) {
      console.error("Save product error:", err);
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(
        errorObj.response?.data?.message || "Lỗi khi lưu sản phẩm. Vui lòng thử lại.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Xóa sản phẩm
  const handleDeleteProduct = async (p: ProductSummaryDto) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn XÓA sản phẩm "${p.name}" không?\nHành động này không thể hoàn tác!`
      )
    ) {
      return;
    }

    try {
      await productApiRequest.adminDeleteProduct(p.id);
      showToast(`Đã xóa sản phẩm "${p.name}" thành công!`, "success");
      emitSyncEvent("PRODUCT_UPDATED");
      emitSyncEvent("INVENTORY_UPDATED");
      fetchProducts(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(
        errorObj.response?.data?.message || "Không thể xóa sản phẩm lúc này.",
        "error"
      );
    }
  };

  // Tính tổng tồn kho của 1 sản phẩm
  const getTotalStock = (p: ProductSummaryDto) => {
    if (!p.variants || !Array.isArray(p.variants)) return 0;
    return p.variants.reduce((acc, cur) => acc + (cur.stockQuantity || 0), 0);
  };

  // Lọc sản phẩm theo tìm kiếm, danh mục, trạng thái
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchCat = categoryFilter === "ALL" || p.categorySlug === categoryFilter;
      const isProductActive = p.isActive !== undefined ? p.isActive : true;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && isProductActive) ||
        (statusFilter === "INACTIVE" && !isProductActive);

      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.variants && p.variants.some((v) => v.sku?.toLowerCase().includes(q)));

      return matchCat && matchStatus && matchQuery;
    });
  }, [products, categoryFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all transform animate-in fade-in slide-in-from-bottom-4 duration-200 border ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-950/20"
              : toastMessage.type === "error"
              ? "bg-rose-600 text-white border-rose-500 shadow-rose-950/20"
              : "bg-zinc-800 text-white border-zinc-700 shadow-zinc-950/20"
          }`}
        >
          {toastMessage.type === "success" && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
          {toastMessage.type === "error" && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {toastMessage.type === "info" && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-75 text-white/80 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Nút Thêm Mới */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Quản Lý Sản Phẩm &amp; Biến Thể
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
            Tạo mới sản phẩm kèm upload ảnh, quản lý giá bán, biến thể SKU và bật/tắt trạng thái kinh doanh
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Nút Thêm Mới Sản Phẩm */}
          <button
            type="button"
            onClick={openAddProductModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/25 transition-all cursor-pointer active:scale-95"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            <span>Thêm Sản Phẩm Mới</span>
          </button>

          {/* Nút Làm Mới */}
          <button
            type="button"
            onClick={() => fetchProducts(false)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-card hover:bg-secondary text-foreground border border-border transition-colors cursor-pointer disabled:opacity-50"
            title="Đồng bộ lại từ máy chủ"
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
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-center justify-between gap-3">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => fetchProducts(false)}
            className="px-3 py-1 rounded-lg bg-destructive text-white font-bold text-xs hover:bg-destructive/90 cursor-pointer"
          >
            Thử Lại
          </button>
        </div>
      )}

      {/* Toolbar Tìm Kiếm & Bộ Lọc */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Ô Tìm Kiếm */}
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

        {/* Lọc theo Danh Mục & Trạng Thái */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Lọc danh mục */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 text-xs rounded-xl bg-card border border-border px-3 text-foreground focus:outline-none focus:border-primary cursor-pointer shadow-xs"
          >
            <option value="ALL">Tất cả ngành hàng</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Lọc trạng thái bán */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            className="h-10 text-xs rounded-xl bg-card border border-border px-3 text-foreground focus:outline-none focus:border-primary cursor-pointer shadow-xs"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">● Đang bán</option>
            <option value="INACTIVE">○ Tạm ẩn</option>
          </select>

          <div className="text-xs text-muted-foreground pl-1">
            Hiển thị <strong className="text-foreground">{filteredProducts.length}</strong> / {products.length} sản phẩm
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách Sản Phẩm */}
      <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3.5 px-4 whitespace-nowrap">Ảnh</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Tên Sản Phẩm</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Danh Mục</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Giá Bán</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Biến Thể SKU</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Tổng Tồn Kho</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Trạng Thái Bán</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`sk-${idx}`} className="animate-pulse">
                    <td className="py-4 px-4"><div className="w-10 h-10 bg-muted rounded-lg" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-muted rounded w-48 mb-1" /><div className="h-3 bg-muted/60 rounded w-28" /></td>
                    <td className="py-4 px-4"><div className="h-5 bg-muted rounded w-24" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-muted rounded w-20" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-muted rounded w-16" /></td>
                    <td className="py-4 px-4"><div className="h-5 bg-muted rounded-full w-20" /></td>
                    <td className="py-4 px-4"><div className="h-6 bg-muted rounded-full w-24" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-7 bg-muted rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m7.5 4.27 9 5.15" />
                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-sm">Không tìm thấy sản phẩm nào</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Thử đổi từ khóa tìm kiếm hoặc bấm &quot;Thêm Sản Phẩm Mới&quot;
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const totalStock = getTotalStock(p);
                  const isProductActive = p.isActive !== undefined ? p.isActive : true;

                  return (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      {/* Ảnh thu nhỏ */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-muted shrink-0 border border-border shadow-xs">
                          <Image
                            src={p.thumbnailUrl || SAMPLE_IMAGES[0].url}
                            alt={p.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </td>

                      {/* Tên sản phẩm */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => openEditProductModal(p)}
                          className="font-bold text-foreground hover:text-primary transition-colors text-left line-clamp-1 cursor-pointer"
                        >
                          {p.name}
                        </button>
                        <span className="font-mono text-[10px] text-muted-foreground block truncate">
                          /{p.slug}
                        </span>
                      </td>

                      {/* Danh mục */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-secondary text-foreground border border-border">
                          {p.categoryName || "Chưa phân loại"}
                        </span>
                      </td>

                      {/* Giá bán */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-foreground">
                        {formatVND(p.basePrice)}
                      </td>

                      {/* Biến thể SKU */}
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
                          {totalStock === 0
                            ? "Hết hàng"
                            : totalStock < 10
                            ? `Sắp hết (${totalStock})`
                            : `Còn ${totalStock}`}
                        </span>
                      </td>

                      {/* Nút Bật/Tắt trạng thái is_active trực tiếp trên bảng */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer active:scale-95 shadow-xs ${
                            isProductActive
                              ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground border border-border line-through"
                          }`}
                          title={isProductActive ? "Bấm để TẠM ẨN sản phẩm khỏi Buyer" : "Bấm để BẬT BÁN sản phẩm"}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isProductActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                            }`}
                          />
                          <span>{isProductActive ? "● Đang bán" : "○ Tạm ẩn"}</span>
                        </button>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(p)}
                            className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            className="px-2 py-1 rounded-lg border border-destructive/20 hover:border-destructive text-destructive hover:bg-destructive/10 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Xóa sản phẩm"
                          >
                            Xóa
                          </button>
                          <Link
                            href={`/products/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-[11px] transition-colors"
                            title="Xem trang bán lẻ (Buyer Store)"
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

      {/* ================= MODAL: THÊM MỚI / SỬA SẢN PHẨM ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-3xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {editingProductId ? "Chỉnh Sửa Sản Phẩm" : "Thêm Mới Sản Phẩm"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cấu hình thông tin chung, ảnh đại diện và danh sách biến thể SKU tồn kho
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* PHẦN 1: THÔNG TIN CHUNG */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
                  1. Thông Tin Chung
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Tên sản phẩm */}
                  <div className="sm:col-span-2">
                    <label className="font-bold text-foreground block mb-1">
                      Tên Sản Phẩm <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="VD: Sữa Tăng Cơ Whey Gold Standard 100% Isolate 5 Lbs"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  {/* Danh mục */}
                  <div>
                    <label className="font-bold text-foreground block mb-1">
                      Ngành Hàng / Danh Mục <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formCategorySlug}
                      onChange={(e) => setFormCategorySlug(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Giá cơ bản */}
                  <div>
                    <label className="font-bold text-foreground block mb-1">
                      Giá Cơ Bản (₫) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={formBasePrice}
                      onChange={(e) => setFormBasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="1850000"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  {/* Trạng thái Bán (is_active) */}
                  <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div>
                      <span className="font-bold text-foreground block text-xs">
                        Trạng Thái Kinh Doanh (is_active)
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Bật để hiển thị sản phẩm ngay lập tức trên cửa hàng Buyer
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Mô tả chi tiết */}
                  <div className="sm:col-span-2">
                    <label className="font-bold text-foreground block mb-1">
                      Mô Tả Chi Tiết Sản Phẩm
                    </label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Nhập thành phần dinh dưỡng, hướng dẫn sử dụng, thông số kỹ thuật..."
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* PHẦN 2: HÌNH ẢNH SẢN PHẨM */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
                  2. Hình Ảnh Sản Phẩm
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                  {/* Preview ảnh hiện tại */}
                  <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl bg-background border border-border">
                    <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
                      <Image
                        src={formThumbnailUrl || SAMPLE_IMAGES[0].url}
                        alt="Preview"
                        fill
                        sizes="112px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-2">Ảnh đại diện chính</span>
                  </div>

                  {/* Nhập link hoặc chọn file */}
                  <div className="sm:col-span-8 space-y-2.5">
                    <div>
                      <label className="font-bold text-foreground block mb-1">Link Ảnh Trực Tiếp (URL):</label>
                      <input
                        type="url"
                        value={formThumbnailUrl}
                        onChange={(e) => setFormThumbnailUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border cursor-pointer transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" x2="12" y1="3" y2="15" />
                        </svg>
                        <span>Tải Ảnh Từ Máy Tính</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleImageFileSelect}
                          className="hidden"
                        />
                      </label>

                      {formThumbnailUrl && (
                        <button
                          type="button"
                          onClick={() => setFormThumbnailUrl("")}
                          className="px-2.5 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs hover:bg-destructive/10"
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>

                    {/* Mẫu ảnh chọn nhanh */}
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-1">Hoặc chọn nhanh ảnh mẫu:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {SAMPLE_IMAGES.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setFormThumbnailUrl(img.url)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                              formThumbnailUrl === img.url
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground border-border hover:text-foreground"
                            }`}
                          >
                            {img.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 3: BẢNG CON QUẢN LÝ DANH SÁCH BIẾN THỂ (VARIANTS / SKU) */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
                      3. Quản Lý Danh Sách Biến Thể SKU
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Định nghĩa các phân loại như Vị (Chocolate, Dâu...) hoặc Size (M, L, XL...)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                    <span>Thêm Biến Thể Mới</span>
                  </button>
                </div>

                {/* Bảng con danh sách biến thể */}
                <div className="border border-border rounded-xl overflow-hidden bg-background">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                        <th className="py-2.5 px-3">Tên Biến Thể *</th>
                        <th className="py-2.5 px-3">Mã SKU (Tùy chọn)</th>
                        <th className="py-2.5 px-3">Giá Bán Riêng (₫)</th>
                        <th className="py-2.5 px-3 text-center">Tồn Kho</th>
                        <th className="py-2.5 px-3 text-right">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {formVariants.map((v, idx) => (
                        <tr key={idx} className="hover:bg-muted/10">
                          {/* Tên biến thể */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              required
                              value={v.variantName}
                              onChange={(e) => handleVariantChange(idx, "variantName", e.target.value)}
                              placeholder="VD: Vị Double Rich Chocolate • 5 Lbs"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                            />
                          </td>

                          {/* SKU */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={v.sku || ""}
                              onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                              placeholder="Tự động sinh nếu để trống"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-foreground text-xs font-mono focus:outline-none focus:border-primary"
                            />
                          </td>

                          {/* Giá bán riêng */}
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              value={v.price}
                              onChange={(e) => handleVariantChange(idx, "price", Number(e.target.value))}
                              className="w-28 px-2.5 py-1.5 rounded-lg bg-card border border-border text-foreground text-xs font-mono font-bold focus:outline-none focus:border-primary"
                            />
                          </td>

                          {/* Tồn kho */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              value={v.stockQuantity}
                              onChange={(e) => handleVariantChange(idx, "stockQuantity", Number(e.target.value))}
                              className="w-20 px-2 py-1.5 rounded-lg bg-card border border-border text-foreground text-xs text-center font-bold focus:outline-none focus:border-primary"
                            />
                          </td>

                          {/* Xóa dòng */}
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariantRow(idx)}
                              className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 inline-flex items-center justify-center transition-colors cursor-pointer"
                              title="Xóa biến thể này"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSaving && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>{isSaving ? "Đang Lưu..." : "Lưu Sản Phẩm"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
