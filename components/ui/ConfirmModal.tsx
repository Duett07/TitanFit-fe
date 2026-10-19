"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { AlertTriangle, AlertCircle, Info, X, Loader2 } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  confirmButtonClassName?: string;
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
    confirmBtn: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus-visible:ring-rose-500",
  },
  warning: {
    icon: AlertCircle,
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus-visible:ring-amber-500",
  },
  info: {
    icon: Info,
    badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
    confirmBtn: "bg-primary hover:bg-primary/90 text-primary-foreground focus-visible:ring-primary",
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Giữ lại",
  variant = "danger",
  isLoading = false,
  confirmButtonClassName = "",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const config = variantConfig[variant] || variantConfig.danger;
  const IconComponent = config.icon;

  // Handle ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
        return;
      }

      // Focus trap navigation
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    },
    [onClose, isLoading]
  );

  useEffect(() => {
    if (!isOpen) return;

    // Save previously focused element to restore on close
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Add listeners and lock scroll
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Auto-focus the cancel button by default (safer than focusing destructive confirm)
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Restore focus
      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === "function"
      ) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={!isLoading ? onClose : undefined}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-card text-card-foreground rounded-2xl border border-border shadow-2xl overflow-hidden transition-all transform animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Visual Icon Badge */}
            <div
              className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center ${config.badgeBg}`}
            >
              <IconComponent className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3
                  id="confirm-modal-title"
                  className="text-base sm:text-lg font-bold font-heading text-foreground"
                >
                  {title}
                </h3>
                {!isLoading && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-7 h-7 -mr-1 -mt-1 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                    aria-label="Đóng"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div
                id="confirm-modal-description"
                className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-line"
              >
                {message}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-muted/40 border-t border-border/60">
          <button
            ref={cancelBtnRef}
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-accent text-foreground text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 active:scale-95 ${config.confirmBtn} ${confirmButtonClassName}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
