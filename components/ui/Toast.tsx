"use client";

import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  text: string;
  type?: ToastType;
  onClose?: () => void;
  className?: string;
}

const typeStyles: Record<
  ToastType,
  {
    container: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    container: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
  },
  error: {
    container: "bg-destructive/10 border-destructive/30 text-destructive",
    icon: <AlertCircle className="w-4 h-4 text-destructive shrink-0" />,
  },
  warning: {
    container: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
    icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
  },
  info: {
    container: "bg-secondary border-border text-foreground",
    icon: <Info className="w-4 h-4 text-primary shrink-0" />,
  },
};

export const Toast: React.FC<ToastProps> = ({
  text,
  type = "info",
  onClose,
  className = "",
}) => {
  const current = typeStyles[type];

  return (
    <div
      role="alert"
      className={`fixed top-6 right-6 z-50 max-w-sm px-4 py-3 rounded-xl shadow-xl border text-xs sm:text-sm font-medium flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 ${
        current.container
      } ${className}`}
    >
      {current.icon}
      <span className="flex-1 leading-snug">{text}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1 text-inherit opacity-70 hover:opacity-100"
          aria-label="Đóng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
