"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import productApiRequest from "@/apiRequest/product";

export interface CartItem {
  id: string; // Canonical backend variant UUID (or productId-variantKey fallback)
  productId: number | string;
  variantId?: string; // Backend variant UUID
  slug: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  selectedVariants: Record<string, string>;
  variantSummary: string; // e.g. "Double Rich Chocolate • 5 lbs"
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  isSyncing: boolean;
  syncNotice: string | null;
  addItem: (
    product: {
      productId: number | string;
      variantId?: string;
      slug: string;
      name: string;
      image: string;
      price: number;
      originalPrice?: number;
      selectedVariants: Record<string, string>;
      variantSummary: string;
      stock: number;
    },
    quantity?: number
  ) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  getTotalCount: () => number;
  getTotalPrice: () => number;
  syncCart: () => Promise<{
    hasChanges: boolean;
    changedCount: number;
    outOfStockCount: number;
  }>;
  dismissSyncNotice: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      isSyncing: false,
      syncNotice: null,

      addItem: (product, quantity = 1) => {
        const variantKey = Object.entries(product.selectedVariants)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}:${v}`)
          .join("|");
        // Prioritize backend variant UUID as canonical cart item key
        const itemId = product.variantId || `${product.productId}-${variantKey}`;

        const items = get().items;
        const existingIndex = items.findIndex(
          (item) => item.id === itemId || (Boolean(product.variantId) && item.variantId === product.variantId)
        );

        if (existingIndex > -1) {
          const updatedItems = [...items];
          const newQty = Math.min(
            updatedItems[existingIndex].quantity + quantity,
            product.stock
          );
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            id: itemId,
            variantId: product.variantId || updatedItems[existingIndex].variantId,
            price: product.price,
            stock: product.stock,
            quantity: newQty,
          };
          set({ items: updatedItems, isDrawerOpen: true });
        } else {
          const newItem: CartItem = {
            id: itemId,
            productId: product.productId,
            variantId: product.variantId,
            slug: product.slug,
            name: product.name,
            image: product.image,
            price: product.price,
            originalPrice: product.originalPrice,
            selectedVariants: product.selectedVariants,
            variantSummary: product.variantSummary,
            quantity: Math.min(quantity, Math.max(1, product.stock)),
            stock: product.stock,
          };
          set({ items: [...items, newItem], isDrawerOpen: true });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        const updated = get().items.map((item) => {
          if (item.id === id) {
            const boundedQty = Math.min(Math.max(1, quantity), item.stock);
            return { ...item, quantity: boundedQty };
          }
          return item;
        });
        set({ items: updated });
      },

      clearCart: () => {
        set({ items: [] });
      },

      openDrawer: () => {
        if (!get().isDrawerOpen) {
          set({ isDrawerOpen: true });
          get().syncCart();
        }
      },
      closeDrawer: () => {
        if (get().isDrawerOpen) set({ isDrawerOpen: false });
      },
      toggleDrawer: () => {
        const nextState = !get().isDrawerOpen;
        set({ isDrawerOpen: nextState });
        if (nextState) get().syncCart();
      },

      getTotalCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      syncCart: async () => {
        const currentItems = get().items;
        if (currentItems.length === 0) {
          return { hasChanges: false, changedCount: 0, outOfStockCount: 0 };
        }

        set({ isSyncing: true });

        try {
          const uniqueSlugs = Array.from(
            new Set(currentItems.map((item) => item.slug).filter(Boolean))
          );
          const productMap = new Map<string, any>();

          await Promise.all(
            uniqueSlugs.map(async (slug) => {
              try {
                const res = await productApiRequest.getProductBySlug(slug);
                if (res.data?.data) {
                  productMap.set(slug, res.data.data);
                }
              } catch {
                // Ignore individual product fetch error
              }
            })
          );

          let hasChanges = false;
          let changedCount = 0;
          let outOfStockCount = 0;

          const updatedItems = currentItems.map((item) => {
            const freshProduct = productMap.get(item.slug);
            if (!freshProduct) return item;

            // Find matching variant by variantId (UUID), or SKU, or summary
            const freshVariant = (freshProduct.variants || []).find(
              (v: any) =>
                (item.variantId && v.id === item.variantId) ||
                (v.sku && item.id.includes(v.sku)) ||
                (v.variantName && item.variantSummary.includes(v.variantName))
            );

            if (!freshVariant) return item;

            const newPrice = freshVariant.price ?? item.price;
            const newStock =
              freshVariant.stockQuantity ?? freshVariant.stock ?? item.stock;
            const newQty = Math.min(item.quantity, Math.max(0, newStock));

            const isPriceChanged = newPrice !== item.price;
            const isStockChanged =
              newStock !== item.stock || newQty !== item.quantity;

            if (isPriceChanged || isStockChanged) {
              hasChanges = true;
              changedCount++;
              if (newStock === 0) outOfStockCount++;

              return {
                ...item,
                id: freshVariant.id || item.id,
                variantId: freshVariant.id || item.variantId,
                price: newPrice,
                stock: newStock,
                quantity: newQty,
              };
            }

            return item;
          });

          let syncNotice: string | null = null;
          if (outOfStockCount > 0) {
            syncNotice = `Có ${outOfStockCount} sản phẩm trong giỏ đã hết hàng hoặc giảm tồn kho.`;
          } else if (hasChanges) {
            syncNotice = `Đã cập nhật giá và tồn kho mới nhất từ hệ thống.`;
          }

          set({
            items: updatedItems,
            isSyncing: false,
            syncNotice,
          });

          return { hasChanges, changedCount, outOfStockCount };
        } catch (error) {
          console.error("Lỗi khi đồng bộ giỏ hàng:", error);
          set({ isSyncing: false });
          return { hasChanges: false, changedCount: 0, outOfStockCount: 0 };
        }
      },

      dismissSyncNotice: () => set({ syncNotice: null }),
    }),
    {
      name: "titanfit_cart_storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist cart items, not open/closed state of drawer or ephemeral sync notices
      partialize: (state) => ({ items: state.items }),
    }
  )
);
