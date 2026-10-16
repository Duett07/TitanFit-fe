"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import Logo from "@/components/Logo";

interface AdminLayoutProps {
  children: React.ReactNode;
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

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "order",
    title: "Đơn hàng mới #TF-849201",
    description: "Khách đặt Whey Gold + Áo Pro-Combat (2.490.000₫)",
    time: "5 phút trước",
    isRead: false,
    link: "/admin/orders",
  },
  {
    id: "notif-2",
    type: "inventory",
    title: "Cảnh báo tồn kho SKU",
    description: "Whey vị Dâu 2lbs chỉ còn 2 hộp trong kho!",
    time: "15 phút trước",
    isRead: false,
    link: "/admin/inventory",
  },
  {
    id: "notif-3",
    type: "payment",
    title: "Thanh toán VietQR hoàn tất",
    description: "Đơn hàng #TF-712894 đã nhận tiền 1.850.000₫",
    time: "1 giờ trước",
    isRead: false,
    link: "/admin/orders",
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const notifRef = useRef<HTMLDivElement>(null);

  // 1. Strict Role Guard: Only ROLE_ADMIN is allowed to access /admin
  useEffect(() => {
    let storedUser: { role?: string; fullName?: string; email?: string } | null = null;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("user");
        if (raw) storedUser = JSON.parse(raw);
      } catch {
        // ignore parse error
      }
    }

    const activeUser = user || storedUser;
    const activeIsAuth = isAuthenticated || !!storedUser;

    // Check 1: User is not logged in -> redirect to login
    if (!activeIsAuth || !activeUser) {
      router.replace("/login?redirect=/admin");
      return;
    }

    // Check 2: User is logged in but role is NOT ROLE_ADMIN -> redirect to home with error
    if (activeUser.role !== "ROLE_ADMIN") {
      try {
        sessionStorage.setItem("titanfit_auth_error", "Không có quyền truy cập");
      } catch {}
      router.replace("/?error=" + encodeURIComponent("Không có quyền truy cập"));
      return;
    }

    // Role is valid ROLE_ADMIN
    setIsCheckingRole(false);
  }, [isAuthenticated, user, router]);

  // Sync theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const current = (localStorage.getItem("titanfit_theme_mode") as "dark" | "light") || "light";
      setTheme(current);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("titanfit_theme_mode", nextTheme);
      localStorage.setItem("titanfit_theme", nextTheme);
      window.dispatchEvent(new Event("themechange"));
    } catch {}
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

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  // Loading state while checking admin permissions
  if (isCheckingRole) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-foreground">
          Đang xác thực quyền quản trị viên TITANFIT...
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Vui lòng đợi trong giây lát.
        </p>
      </div>
    );
  }

  const navItems = [
    {
      label: "Tổng Quan",
      href: "/admin",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
        </svg>
      ),
      badge: (
        <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
          3
        </span>
      ),
      isActive: pathname.startsWith("/admin/orders"),
    },
    {
      label: "Quản Lý Sản Phẩm",
      href: "/admin/products",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" x2="21" y1="6" y2="6" />
          <line x1="8" x2="21" y1="12" y2="12" />
          <line x1="8" x2="21" y1="18" y2="18" />
          <line x1="3" x2="3.01" y1="6" y2="6" />
          <line x1="3" x2="3.01" y1="12" y2="12" />
          <line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
      ),
      badge: (
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
          <span>⚠️</span> 2 cảnh báo
        </span>
      ),
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <span className={`shrink-0 ${item.isActive ? "text-primary" : "text-muted-foreground"}`}>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Xem Website Buyer</span>
              <svg className="ml-auto w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Sidebar Footer: User Card & Logout */}
        <div className="p-3.5 border-t border-border shrink-0 bg-card/60 flex flex-col gap-2.5">
          <div className="p-2.5 rounded-xl bg-secondary/60 border border-border flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-foreground truncate">
                {user?.fullName || "Quản Trị Viên"}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {user?.email || "admin@titanfit.vn"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full h-9 rounded-xl border border-destructive/30 hover:border-destructive text-destructive hover:bg-destructive/10 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          setIsNotifOpen(false);
                          router.push(notif.link);
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
                          {notif.type === "order" ? "📦" : notif.type === "inventory" ? "⚠️" : "💰"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{notif.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                            {notif.description}
                          </p>
                          <p className="text-[10px] text-muted-foreground/75 mt-1">{notif.time}</p>
                        </div>
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        )}
                      </div>
                    ))}
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
