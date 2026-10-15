"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { formatVND } from "@/data/products";

export default function CartDrawer() {
  const router = useRouter();
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
    <div className={`sheet-overlay ${isDrawerOpen ? "open" : ""}`}>
      {/* Background click to close */}
      <div
        style={{ position: "absolute", inset: 0 }}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <div className="sheet-content" role="dialog" aria-modal="true" aria-label="Giỏ Hàng Của Bạn">
        {/* Header */}
        <div className="sheet-header">
          <div className="sheet-title">
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
            className="sheet-close"
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
        <div className="sheet-body">
          {!isMounted || items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--muted-foreground)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", color: "var(--subtle-foreground)" }}>
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
              <div style={{ fontWeight: 600, color: "var(--foreground)", fontSize: "14px" }}>
                Giỏ hàng của bạn đang trống
              </div>
              <div style={{ fontSize: "12.5px", marginTop: "4px" }}>
                Hãy chọn thêm sản phẩm để tiếp tục đặt hàng.
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="cart-item">
                <div style={{ position: "relative", width: "60px", height: "60px", flexShrink: 0, borderRadius: "var(--radius-sm)", overflow: "hidden", backgroundColor: "var(--secondary)" }}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="60px"
                    className="object-cover"
                  />
                </div>
                <div className="cart-item-details">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <div className="cart-item-name">{item.name}</div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", fontSize: "12px", padding: "0 2px" }}
                      title="Xóa"
                      aria-label={`Xóa ${item.name}`}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="cart-item-variant">{item.variantSummary}</div>
                  <div className="cart-item-footer">
                    <div className="cart-item-price">{formatVND(item.price)}</div>
                    <div className="stepper">
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Giảm"
                      >
                        −
                      </button>
                      <span className="stepper-val">{item.quantity}</span>
                      <button
                        type="button"
                        className="stepper-btn"
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
          <div className="sheet-footer">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>Tạm tính:</span>
              <span
                className="cart-total-amount"
                style={{ fontSize: "18px", fontWeight: 700, color: "var(--foreground)", fontFamily: "'Outfit', sans-serif" }}
              >
                {isMounted ? formatVND(getTotalPrice()) : "0 ₫"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Tiến Hành Đặt Hàng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
