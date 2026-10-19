"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";

import Logo from "@/components/Logo";

const subscribeTheme = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("themechange", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("themechange", callback);
  };
};

const getThemeSnapshot = (): "dark" | "light" => {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem("titanfit_theme_mode") as "dark" | "light") || "light";
};

const getThemeServerSnapshot = (): "dark" | "light" => "light";

const getShortName = (fullName?: string) => {
  if (!fullName) return "Tài Khoản";
  const parts = fullName.trim().split(" ");
  return parts.length > 2 ? parts.slice(-2).join(" ") : fullName;
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const { openDrawer, items } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isHydrated = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const currentUser = isHydrated && isAuthenticated ? user : null;

  const cartCount = isHydrated
    ? items.reduce((total, item) => total + item.quantity, 0)
    : 0;

  const theme = React.useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("titanfit_theme_mode", nextTheme);
      localStorage.setItem("titanfit_theme", nextTheme);
      window.dispatchEvent(new Event("themechange"));
    } catch {
      // Ignore in SSR
    }
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    const storedErr = sessionStorage.getItem("titanfit_auth_error");

    if (err || storedErr) {
      const msg = err || storedErr || "Không có quyền truy cập";
      sessionStorage.removeItem("titanfit_auth_error");
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);

      let isMounted = true;
      Promise.resolve().then(() => {
        if (isMounted) {
          setToastMessage(msg);
        }
      });
      const timer = setTimeout(() => {
        if (isMounted) setToastMessage(null);
      }, 4500);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [pathname]);

  if (pathname?.startsWith("/admin")) {
    return (
      <>
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border bg-rose-950 text-rose-100 border-rose-800 text-sm font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
            <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border bg-rose-950 text-rose-100 border-rose-800 text-sm font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Announcement Bar */}
      <div className="bg-secondary border-b border-border py-2 text-center text-xs text-muted-foreground font-medium transition-colors">
        Miễn phí giao hàng cho đơn từ 500.000₫ &bull;{" "}
        <strong className="text-foreground">100% Chính Hãng Nhập Khẩu</strong> &bull; Hỗ trợ thanh toán VietQR tự động
      </div>

      {/* Header Navbar */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-3 lg:gap-6">
          <div className="flex items-center shrink-0">
            <Link href="/" className="inline-flex items-center" aria-label="TITANFIT Trang Chủ">
              <Logo className="h-7 sm:h-8 w-auto" height={30} />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center shrink-0">
            <ul className="flex items-center gap-1 list-none p-0 m-0">
              <li>
                <Link
                  href="/"
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    pathname === "/"
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  Trang Chủ
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=supplements"
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    pathname === "/products" &&
                    typeof window !== "undefined" &&
                    window.location.search.includes("supplements")
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  Thực Phẩm Bổ Sung
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=apparel"
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    pathname === "/products" &&
                    typeof window !== "undefined" &&
                    window.location.search.includes("apparel")
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  Đồ Tập &amp; Phụ Kiện
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg border border-border bg-card hover:bg-secondary text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Chuyển chế độ Sáng / Tối"
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

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative hidden xl:flex items-center">
              <span className="absolute left-3 text-muted-foreground pointer-events-none flex items-center">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </span>
              <input
                type="text"
                className="w-36 2xl:w-48 h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-foreground text-xs font-sans placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-background transition-all"
                placeholder="Tìm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* Giỏ Hàng */}
            <button
              type="button"
              onClick={openDrawer}
              className="h-9 px-3 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              title="Xem giỏ hàng"
              aria-label={`Giỏ Hàng (${cartCount})`}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <span>Giỏ Hàng</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                {cartCount}
              </span>
            </button>

            {/* 3. Dynamic Header Auth Container */}
            <div className="flex items-center gap-2">
              {currentUser ? (
                <div className="relative" ref={dropdownRef}>
                  {/* Wireframe-matched Pill Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="inline-flex items-center gap-2 py-1 pl-1.5 pr-3 rounded-full bg-secondary border border-border hover:border-primary text-foreground text-xs font-semibold transition-colors cursor-pointer select-none"
                    id="userMenuTrigger"
                    title={currentUser.fullName}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs ring-1 ring-border shrink-0">
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="max-w-[120px] truncate">{getShortName(currentUser.fullName)}</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {/* Wireframe-matched 300px Dropdown Portal */}
                  <div
                    className={`${
                      isUserMenuOpen ? "block" : "hidden"
                    } absolute right-0 top-full mt-2 w-[300px] bg-card border border-border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95`}
                    id="userDropdownMenu"
                  >
                    {/* 1. Header with Avatar & Tier */}
                    <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm ring-2 ring-primary/40 shrink-0">
                        {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-foreground truncate" title={currentUser.fullName}>
                          {currentUser.fullName}
                        </div>
                        <div className="text-[11.5px] text-muted-foreground truncate mt-0.5" title={currentUser.email}>
                          {currentUser.email}
                        </div>
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary mt-1">
                          {currentUser.role === "ROLE_ADMIN" ? "Quản Trị Viên (Admin)" : "Hội Viên Vàng (Gold)"}
                        </span>
                      </div>
                    </div>

                    {/* 2. Quick Mini-Metrics Bar */}
                    <div className="grid grid-cols-3 gap-1 p-2 bg-secondary/60 border border-border rounded-lg mx-3.5 my-2.5 text-center">
                      <Link
                        href="/order-tracking"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex flex-col items-center hover:opacity-80 transition-opacity"
                        title="Xem đơn hàng đang giao"
                      >
                        <span className="text-[14.5px] font-extrabold text-primary font-heading">1</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Đang Giao</span>
                      </Link>
                      <div
                        className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
                        title="Xem kho voucher"
                      >
                        <span className="text-[14.5px] font-extrabold text-emerald-500 font-heading">3</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Voucher</span>
                      </div>
                      <div
                        className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
                        title="Điểm thưởng thành viên"
                      >
                        <span className="text-[14.5px] font-extrabold text-primary font-heading">1.250</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Điểm ⭐</span>
                      </div>
                    </div>

                    {/* 3. Group 1: ĐƠN HÀNG & MUA SẮM */}
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-1.5">
                      Đơn Hàng & Mua Sắm
                    </div>

                    {currentUser.role === "ROLE_ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full px-4 py-2 text-xs font-semibold text-primary hover:bg-secondary flex items-center gap-2.5 transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <span>Cổng Quản Trị Shop (Admin)</span>
                        <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">Admin</span>
                      </Link>
                    )}

                    <Link
                      href="/order-tracking"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary hover:text-primary flex items-center gap-2.5 transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <path d="M2 10h20" />
                      </svg>
                      <span>Đơn Hàng Của Tôi</span>
                      <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary text-white">1 đang giao</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary hover:text-primary flex items-center gap-2.5 transition-colors text-left cursor-pointer"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-500">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                      <span>Sản Phẩm Đã Lưu (Wishlist)</span>
                      <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">4 món</span>
                    </button>

                    <Link
                      href="/order-tracking"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary hover:text-primary flex items-center gap-2.5 transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                        <path d="M3 2v6h6" />
                        <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
                      </svg>
                      <span>Mua Lại Đơn Trước (Re-Order)</span>
                    </Link>

                    {/* 4. Group 2: ƯU ĐÃI & VÍ THÀNH VIÊN */}
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-1.5 mt-1 border-t border-border/50">
                      Ưu Đãi & Ví Của Tôi
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary hover:text-primary flex items-center gap-2.5 transition-colors text-left cursor-pointer"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
                        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                        <path d="M13 5v2" />
                        <path d="M13 17v2" />
                        <path d="M13 11v2" />
                      </svg>
                      <span>Kho Voucher Giảm Giá</span>
                      <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">3 mã</span>
                    </button>

                    {/* 5. Group 3: THIẾT LẬP TÀI KHOẢN */}
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-1.5 mt-1 border-t border-border/50">
                      Thiết Lập Tài Khoản
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary hover:text-primary flex items-center gap-2.5 transition-colors text-left cursor-pointer"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>Hồ Sơ & Sổ Địa Chỉ Giao Hàng</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary hover:text-primary flex items-center gap-2.5 transition-colors text-left cursor-pointer"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                        <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v5Z" />
                        <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
                      </svg>
                      <span>Trung Tâm Hỗ Trợ Khách Hàng</span>
                    </button>

                    {/* 6. Đăng Xuất */}
                    <button
                      type="button"
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await logout();
                        router.push("/login");
                      }}
                      className="w-full px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 border-t border-border mt-1.5 flex items-center gap-2.5 transition-colors text-left cursor-pointer"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" x2="9" y1="12" y2="12" />
                      </svg>
                      <span>Đăng Xuất Khỏi Tài Khoản</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="h-9 px-3 rounded-lg text-xs font-semibold text-foreground hover:bg-secondary flex items-center transition-colors"
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    href="/register"
                    className="h-9 px-3.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary/90 flex items-center shadow-xs transition-colors"
                  >
                    Đăng Ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
