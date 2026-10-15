"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

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

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
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

  return (
    <>
      {/* Top Announcement Bar - Wireframe exact copy */}
      <div className="top-bar">
        Miễn phí giao hàng cho đơn từ 500.000₫ &bull;{" "}
        <strong>100% Chính Hãng Nhập Khẩu</strong> &bull; Hỗ trợ thanh toán VietQR tự động
      </div>

      {/* Header - Wireframe exact copy */}
      <header className="app-header">
        <div className="container header-row">
          <div className="brand-wrapper">
            <Link href="/" className="inline-flex items-center">
              <Image
                src={theme === "light" ? "/logo-light.svg" : "/logo.svg"}
                alt="TITANFIT Logo"
                width={140}
                height={28}
                className="brand-logo-img w-auto h-[28px]"
                priority
              />
            </Link>
          </div>

          <nav>
            <ul className="nav-links">
              <li>
                <Link
                  href="/"
                  className={`nav-link ${pathname === "/" ? "active" : ""}`}
                >
                  Trang Chủ
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=supplements"
                  className={`nav-link ${pathname === "/products" && typeof window !== "undefined" && window.location.search.includes("supplements")
                    ? "active"
                    : ""
                    }`}
                >
                  Thực Phẩm Bổ Sung
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=apparel"
                  className={`nav-link ${pathname === "/products" && typeof window !== "undefined" && window.location.search.includes("apparel")
                    ? "active"
                    : ""
                    }`}
                >
                  Đồ Tập &amp; Phụ Kiện
                </Link>
              </li>
            </ul>
          </nav>

          <div className="header-actions">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-outline btn-icon theme-toggle-btn"
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
            <form onSubmit={handleSearchSubmit} className="header-search">
              <span className="header-search-icon">
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
                className="input"
                placeholder="Tìm whey, đồ tập gym..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* Giỏ Hàng */}
            <Link href="/cart" className="btn btn-outline cart-trigger-btn">
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
              <span
                className="badge badge-primary cart-badge"
                style={{ padding: "1px 6px", fontSize: "10px" }}
              >
                2
              </span>
            </Link>

            {/* Đăng Nhập & Đăng Ký — Wireframe exact */}
            <div
              className="header-auth-container"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Link
                href="/login"
                className="btn btn-ghost btn-sm"
                style={{ fontWeight: 600 }}
              >
                Đăng Nhập
              </Link>
              <Link
                href="/register"
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 600 }}
              >
                Đăng Ký
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
