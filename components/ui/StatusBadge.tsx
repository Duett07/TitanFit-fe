import React from "react";
import { Check, Truck, CheckCircle2, XCircle, AlertCircle, AlertTriangle } from "lucide-react";

export type OrderStatusType = "PENDING" | "CONFIRMED" | "SHIPPING" | "DELIVERED" | "CANCELLED";

export type InventoryStatusType = "ACTIVE" | "INACTIVE" | "LOW_STOCK" | "OUT_OF_STOCK";

export type BadgeVariant = "order" | "inventory" | "payment" | "custom";

export interface StatusBadgeProps {
  status: string;
  label?: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  variant = "order",
  size = "md",
  showIcon = true,
  className = "",
}) => {
  const normalizedStatus = (status || "").toUpperCase();

  // 1. Order Statuses
  if (
    variant === "order" ||
    ["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"].includes(normalizedStatus)
  ) {
    switch (normalizedStatus) {
      case "PENDING":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 ${
              size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
            } ${className}`}
          >
            {showIcon && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            )}
            <span>{label || "Chờ duyệt"}</span>
          </span>
        );
      case "CONFIRMED":
        return (
          <span
            className={`inline-flex items-center gap-1 font-bold rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 ${
              size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
            } ${className}`}
          >
            {showIcon && <Check className="w-3 h-3 shrink-0" />}
            <span>{label || "Đã xác nhận"}</span>
          </span>
        );
      case "SHIPPING":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 ${
              size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
            } ${className}`}
          >
            {showIcon && <Truck className="w-3 h-3 shrink-0" />}
            <span>{label || "Đang giao hàng"}</span>
          </span>
        );
      case "DELIVERED":
      case "COMPLETED":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ${
              size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
            } ${className}`}
          >
            {showIcon && <CheckCircle2 className="w-3 h-3 shrink-0" />}
            <span>{label || "Đã hoàn thành"}</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span
            className={`inline-flex items-center gap-1 font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 ${
              size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
            } ${className}`}
          >
            {showIcon && <XCircle className="w-3 h-3 shrink-0" />}
            <span>{label || "Đã hủy"}</span>
          </span>
        );
    }
  }

  // 2. Inventory / Stock Statuses
  if (
    variant === "inventory" ||
    ["ACTIVE", "INACTIVE", "LOW_STOCK", "OUT_OF_STOCK"].includes(normalizedStatus)
  ) {
    switch (normalizedStatus) {
      case "ACTIVE":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ${
              size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
            } ${className}`}
          >
            {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            <span>{label || "Đang kinh doanh"}</span>
          </span>
        );
      case "INACTIVE":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-muted text-muted-foreground border border-border ${
              size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
            } ${className}`}
          >
            {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />}
            <span>{label || "Tạm dừng"}</span>
          </span>
        );
      case "LOW_STOCK":
        return (
          <span
            className={`inline-flex items-center gap-1 font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 ${
              size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
            } ${className}`}
          >
            {showIcon && <AlertTriangle className="w-3 h-3 shrink-0" />}
            <span>{label || "Sắp hết hàng"}</span>
          </span>
        );
      case "OUT_OF_STOCK":
        return (
          <span
            className={`inline-flex items-center gap-1 font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 ${
              size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
            } ${className}`}
          >
            {showIcon && <AlertCircle className="w-3 h-3 shrink-0" />}
            <span>{label || "Hết hàng"}</span>
          </span>
        );
    }
  }

  // 3. Fallback / Custom Status
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full bg-secondary text-secondary-foreground border border-border ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      } ${className}`}
    >
      <span>{label || status}</span>
    </span>
  );
};
