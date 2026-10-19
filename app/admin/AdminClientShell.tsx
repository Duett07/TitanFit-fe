"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import Logo from "@/components/Logo";
import orderApiRequest from "@/apiRequest/order";
import productApiRequest from "@/apiRequest/product";
import { ProductSummaryDto } from "@/types/product.type";
import { UserResponse } from "@/types/auth.type";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { useAutoSync } from "@/lib/sync";

interface AdminClientShellProps {
  children: React.ReactNode;
  initialUser: UserResponse;
}

interface NotificationItem {
  id: string;
  type: "order" | "inventory" | "payment";
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  link: string;
}

function getUserInitials(name?: string): string {
  if (!name || !name.trim()) return "AD";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function AdminClientShell({ children, initialUser }: AdminClientShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user: storeUser, logout } = useAuthStore();
  const user = storeUser || initialUser;

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileSidebarOpen(false);
  }

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("titanfit_theme_mode") as "dark" | "light") || "light";
    }
    return "light";
  });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  const notifRef = useRef<HTMLDivElement>(null);

  // Sync initial user with auth store and query cache on mount if needed
  useEffect(() => {
    if (initialUser) {
      queryClient.setQueryData(queryKeys.auth.session(), initialUser);
      if (!storeUser || storeUser.id !== initialUser.id) {
        useAuthStore.getState().setUser(initialUser);
      }
    }
  }, [initialUser, storeUser, queryClient]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("titanfit_theme_mode", nextTheme);
      window.dispatchEvent(new Event("themechange"));
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Could not save theme preference to localStorage:", e);
      }
    }
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  // Sync real counts & generate live notifications from backend
  const refreshCounts = useCallback(() => {
    Promise.allSettled([
      orderApiRequest.getAllOrders(),
      productApiRequest
        .adminGetAllProducts()
        .catch(() => productApiRequest.getProducts({ size: 100 })),
    ]).then(([ordersRes, productsRes]) => {
      const generatedNotifs: NotificationItem[] = [];

      // 1. Process orders
      if (ordersRes.status === "fulfilled") {
        const rawOrders = ordersRes.value.data?.data || [];
        const pendingOrders = rawOrders.filter(
          (o) =>
            (o.orderStatus || "").toUpperCase() === "PENDING" ||
            (o.orderStatus || "").toUpperCase() === "CONFIRMED"
        );
        setPendingCount(pendingOrders.length);

        if (pendingOrders.length > 0) {
          const newest = pendingOrders[0];
          generatedNotifs.push({
            id: `notif-orders-${newest?.orderCode || pendingOrders.length}`,
            type: "order",
            title: `${pendingOrders.length} đơn hàng mới cần xử lý`,
            description: `Đơn #${newest?.orderCode || "mới"} đang chờ xử lý và xuất kho.`,
            time: newest?.createdAt
              ? new Date(newest.createdAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Hôm nay",
            isRead: false,
            link: "/admin/orders",
          });
        }
      } else if (process.env.NODE_ENV !== "production") {
        console.warn("Could not refresh orders:", ordersRes.reason);
      }

      // 2. Process products / low stock
      if (productsRes.status === "fulfilled") {
        const raw = productsRes.value.data?.data;
        const products: ProductSummaryDto[] = Array.isArray(raw)
          ? raw
          : (raw as { content?: ProductSummaryDto[] })?.content || [];

        let lowStockVariantsCount = 0;
        let sampleProduct = "";

        products.forEach((p) => {
          if (p.variants && Array.isArray(p.variants)) {
            p.variants.forEach((v) => {
              if (v.stockQuantity !== undefined && v.stockQuantity < 10) {
                lowStockVariantsCount++;
                if (!sampleProduct) {
                  sampleProduct = `${p.name} (${v.variantName}: còn ${v.stockQuantity})`;
                }
              }
            });
          }
        });

        setLowStockCount(lowStockVariantsCount);

        if (lowStockVariantsCount > 0) {
          generatedNotifs.push({
            id: `notif-low-stock-${lowStockVariantsCount}`,
            type: "inventory",
            title: `${lowStockVariantsCount} biến thể sắp hết hàng (< 10)`,
            description: sampleProduct
              ? `Cảnh báo: ${sampleProduct}. Cần bổ sung nhập kho.`
              : `Có ${lowStockVariantsCount} biến thể tồn kho dưới 10 sản phẩm.`,
            time: "Cảnh báo kho",
            isRead: false,
            link: "/admin/inventory",
          });
        }
      } else if (process.env.NODE_ENV !== "production") {
        console.warn("Could not refresh products count:", productsRes.reason);
      }

      // 3. Update notifications while preserving isRead status
      setNotifications((prev) => {
        const readIds = new Set(prev.filter((n) => n.isRead).map((n) => n.id));
        return generatedNotifs.map((n) => ({
          ...n,
          isRead: readIds.has(n.id),
        }));
      });
    });
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts, pathname]);

  // Real-time synchronization for admin layout badges: event-driven + focus sync + 60s background heartbeat
  useAutoSync({
    eventTypes: ["ORDER_UPDATED", "PRODUCT_UPDATED", "INVENTORY_UPDATED"],
    onSync: refreshCounts,
    intervalMs: 60000,
    enableFocusSync: true,
  });

  const navItems = [
    {
      label: "Tổng Quan",
      href: "/admin",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
      badge: null,
      isActive: pathname === "/admin",
    },
    {
      label: "Quản Lý Đơn Hàng",
      href: "/admin/orders",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
        </svg>
      ),
      badge:
        pendingCount > 0 ? (
          <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
            {pendingCount}
          </span>
        ) : null,
      isActive: pathname.startsWith("/admin/orders"),
    },
    {
      label: "Quản Lý Sản Phẩm",
      href: "/admin/products",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m7.5 4.27 9 5.15" />
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      ),
      badge: null,
      isActive: pathname.startsWith("/admin/products"),
    },
    {
      label: "Tồn Kho Cảnh Báo",
      href: "/admin/inventory",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="8" x2="21" y1="6" y2="6" />
          <line x1="8" x2="21" y1="12" y2="12" />
          <line x1="8" x2="21" y1="18" y2="18" />
          <line x1="3" x2="3.01" y1="6" y2="6" />
          <line x1="3" x2="3.01" y1="12" y2="12" />
          <line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
      ),
      badge:
        lowStockCount > 0 ? (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <span>⚠️</span> {lowStockCount} SKU
          </span>
        ) : null,
      isActive: pathname.startsWith("/admin/inventory"),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row antialiased">
      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR (FIXED DESKTOP / DRAWER MOBILE) ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-border px-5 flex items-center justify-between shrink-0">
          <Link href="/admin" className="inline-flex items-center gap-2.5">
            <Logo className="h-7 w-auto" height={28} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded-md">
              ADMIN
            </span>
          </Link>
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Đóng Menu"
          >
            <svg
              width="18"
              height="18"
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

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 flex flex-col gap-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2">
            Menu Quản Trị
          </div>

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium transition-all select-none ${
                item.isActive
                  ? "bg-primary/10 text-primary font-bold shadow-xs border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
              }`}
            >
              <span
                className={`shrink-0 ${item.isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
              {item.badge}
            </Link>
          ))}

          <div className="pt-4 mt-2 border-t border-border">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5">
              Cửa Hàng
            </div>
            {/* Storefront Link */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Xem Website Buyer</span>
              <svg
                className="ml-auto w-3.5 h-3.5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Sidebar Footer: User Card & Logout */}
        <div className="p-3.5 border-t border-border shrink-0 bg-card/60 flex flex-col gap-2.5">
          <div className="p-2.5 rounded-xl bg-secondary/60 border border-border flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm uppercase">
              {getUserInitials(user?.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-foreground truncate">
                {user?.fullName || "Quản Trị Viên"}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {user?.email || "Tài khoản quản trị"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full h-9 rounded-xl border border-destructive/30 hover:border-destructive text-destructive hover:bg-destructive/10 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            <span>Đăng Xuất</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ================= HEADER ADMIN ================= */}
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/85 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Page Info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Mở Menu Quản Trị"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" x2="21" y1="6" y2="6" />
                <line x1="3" x2="21" y1="12" y2="12" />
                <line x1="3" x2="21" y1="18" y2="18" />
              </svg>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary hidden sm:inline uppercase tracking-wider">
                  TITANFIT Portal
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">&bull;</span>
                <h1 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  Hệ Thống Quản Trị Cửa Hàng Thể Thao
                </h1>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-secondary text-foreground flex items-center justify-center transition-colors cursor-pointer"
              title={theme === "dark" ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
              aria-label="Đổi giao diện"
            >
              {theme === "dark" ? (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>

            {/* Notification Bell with Dropdown Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                id="notifBellBtn"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative w-9 h-9 rounded-lg border border-border bg-background hover:bg-secondary text-foreground flex items-center justify-center transition-colors cursor-pointer"
                title={`Thông báo hệ thống (${unreadCount} mới)`}
                aria-label="Thông báo"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {unreadCount > 0 && (
                  <span
                    id="notifBadgeDot"
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-card animate-pulse"
                  />
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotifOpen && (
                <div
                  id="notifDropdown"
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="p-3.5 border-b border-border flex items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">Thông Báo</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <div className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-2 text-base">
                          🔔
                        </div>
                        <p className="text-xs font-semibold text-foreground">
                          Không có thông báo mới
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Tất cả đơn hàng và tồn kho đều ổn định.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <Link
                          key={notif.id}
                          href={notif.link}
                          onClick={() => {
                            setIsNotifOpen(false);
                          }}
                          className={`p-3.5 flex items-start gap-3 hover:bg-secondary/60 transition-colors cursor-pointer ${
                            !notif.isRead ? "bg-primary/5" : ""
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                              notif.type === "order"
                                ? "bg-primary/15 text-primary"
                                : notif.type === "inventory"
                                  ? "bg-amber-500/15 text-amber-500"
                                  : "bg-emerald-500/15 text-emerald-500"
                            }`}
                          >
                            {notif.type === "order"
                              ? "📦"
                              : notif.type === "inventory"
                                ? "⚠️"
                                : "💰"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                              {notif.description}
                            </p>
                            <p className="text-[10px] text-muted-foreground/75 mt-1">
                              {notif.time}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          )}
                        </Link>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-border bg-muted/20 text-center">
                    <Link
                      href="/admin/orders"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-xs font-semibold text-primary hover:underline inline-block py-1"
                    >
                      Xem tất cả đơn hàng &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Storefront Link (Desktop) */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-background hover:bg-secondary text-xs font-semibold text-foreground transition-colors"
            >
              <span>Xem Storefront</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
            </Link>

            {/* Admin Profile Badge */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs shadow-xs">
                AD
              </div>
              <span className="hidden md:inline text-xs font-bold text-foreground">
                {user?.fullName || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
