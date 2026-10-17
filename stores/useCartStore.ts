"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  id: string; // Unique combination of productId + variant key
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
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

      addItem: (product, quantity = 1) => {
        const variantKey = Object.entries(product.selectedVariants)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}:${v}`)
          .join("|");
        const itemId = `${product.productId}-${variantKey}`;

        const items = get().items;
        const existingIndex = items.findIndex((item) => item.id === itemId);

        if (existingIndex > -1) {
          const updatedItems = [...items];
          const newQty = Math.min(
            updatedItems[existingIndex].quantity + quantity,
            product.stock
          );
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
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
            quantity: Math.min(quantity, product.stock),
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
        if (!get().isDrawerOpen) set({ isDrawerOpen: true });
      },
      closeDrawer: () => {
        if (get().isDrawerOpen) set({ isDrawerOpen: false });
      },
      toggleDrawer: () => set({ isDrawerOpen: !get().isDrawerOpen }),

      getTotalCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "titanfit_cart_storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist cart items, not open/closed state of drawer
      partialize: (state) => ({ items: state.items }),
    }
  )
);
