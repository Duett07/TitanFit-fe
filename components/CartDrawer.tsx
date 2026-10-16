"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { formatVND } from "@/data/products";

export default function CartDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    getTotalPrice,
    getTotalCount,
  } = useCartStore();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const handleCheckout = () => {
    closeDrawer();
    router.push("/checkout");
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
        isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Background click to close */}
      <div
        className="absolute inset-0"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <div
        className={`absolute right-0 top-0 bottom-0 w-full max-w-[400px] bg-card border-l border-border flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Giỏ Hàng Của Bạn"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground font-heading">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <span>Giỏ Hàng Của Bạn ({isMounted ? getTotalCount() : 0})</span>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            onClick={closeDrawer}
            aria-label="Đóng giỏ hàng"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-border/60">
          {!isMounted || items.length === 0 ? (
            <div className="text-center py-12 px-4 text-muted-foreground">
              <div className="flex justify-center mb-3 text-muted-foreground/50">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
              </div>
              <div className="font-semibold text-foreground text-sm">
                Giỏ hàng của bạn đang trống
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Hãy chọn thêm sản phẩm để tiếp tục đặt hàng.
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex gap-3">
                <div className="relative w-[60px] h-[60px] shrink-0 rounded-lg overflow-hidden bg-secondary border border-border/50">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="60px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-2">
                    <div className="text-xs font-semibold text-foreground truncate" title={item.name}>
                      {item.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer text-xs p-0.5 transition-colors"
                      title="Xóa"
                      aria-label={`Xóa ${item.name}`}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{item.variantSummary}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs font-bold text-primary">{formatVND(item.price)}</div>
                    <div className="inline-flex items-center rounded-md border border-border bg-secondary overflow-hidden">
                      <button
                        type="button"
                        className="w-6 h-6 flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Giảm"
                      >
                        −
                      </button>
                      <span className="px-2 text-xs font-semibold text-foreground text-center min-w-[24px]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="w-6 h-6 flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        aria-label="Tăng"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-border bg-secondary/30">
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-xs text-muted-foreground">Tạm tính:</span>
              <span className="text-lg font-bold text-foreground font-heading">
                {isMounted ? formatVND(getTotalPrice()) : "0 ₫"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm flex items-center justify-center shadow-md active:scale-98 transition-all cursor-pointer"
            >
              Tiến Hành Đặt Hàng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
