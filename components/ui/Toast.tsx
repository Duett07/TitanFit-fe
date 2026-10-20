"use client";

import React from "react";
import { X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  text: string;
  type?: ToastType;
  onClose?: () => void;
  action?: React.ReactNode;
  className?: string;
}

const typeStyles: Record<
  ToastType,
  {
    container: string;
    dot: string;
  }
> = {
  success: {
    container: "bg-emerald-950 text-emerald-100 border-emerald-800 shadow-emerald-950/40",
    dot: "bg-emerald-400",
  },
  error: {
    container: "bg-rose-950 text-rose-100 border-rose-800 shadow-rose-950/40",
    dot: "bg-rose-400",
  },
  warning: {
    container: "bg-amber-950 text-amber-100 border-amber-800 shadow-amber-950/40",
    dot: "bg-amber-400",
  },
  info: {
    container: "bg-zinc-900 text-zinc-100 border-zinc-700 shadow-zinc-950/40",
    dot: "bg-zinc-400",
  },
};

export const Toast: React.FC<ToastProps> = ({
  text,
  type = "info",
  onClose,
  action,
  className = "",
}) => {
  const current = typeStyles[type];

  return (
    <div
      role="alert"
      className={`fixed top-6 right-6 z-[60] max-w-sm sm:max-w-md px-4 py-3 rounded-xl shadow-xl border text-sm font-medium flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 ${
        current.container
      } ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${current.dot} animate-pulse shrink-0`} />
      <span className="flex-1 leading-snug">{text}</span>
      {action && <div className="shrink-0">{action}</div>}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1 text-inherit opacity-70 hover:opacity-100"
          aria-label="Đóng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
