"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Menu, X, PhoneCall, User } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Trang Chủ", href: "/" },
  { label: "Đồ Thể Thao", href: "/do-the-thao", badge: "HOT" },
  { label: "Dinh Dưỡng Thể Hình", href: "/dinh-duong" },
  { label: "Phụ Kiện Tập", href: "/phu-kien" },
];

export default function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const cartItemCount = 3; // Mock cart item count for prominent badge display

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      {/* Top Notification Bar */}
      <div className="top-bar">
        <div className="container-custom flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-2 text-[11.5px]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hệ thống phân phối thể thao & dinh dưỡng chính hãng 100%</span>
          </div>
          <div className="mx-auto sm:mx-0 text-center text-[12px]">
            ⚡ Giao hàng nhanh 2H nội thành • Hotline CSKH:{" "}
            <a
              href="tel:19008899"
              className="font-bold text-primary hover:underline"
            >
              1900 8899
            </a>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[11.5px] text-muted-foreground">
            <Link href="/he-thong-cua-hang" className="hover:text-foreground">
              Hệ thống cửa hàng
            </Link>
            <span>•</span>
            <Link href="/tra-cuu-don-hang" className="hover:text-foreground">
              Tra cứu đơn hàng
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="app-header">
        <div className="container-custom">
          <div className="header-row">
            {/* Logo Brand */}
            <div className="brand-wrapper">
              <Link
                href="/"
                className="flex items-center gap-2 group transition-opacity hover:opacity-95"
              >
                <div className="relative h-9 w-36 sm:w-44">
                  {/* Dark mode logo */}
                  <Image
                    src="/images/titanfit-logo-dark.png"
                    alt="TITANFIT Sports & Nutrition"
                    fill
                    sizes="(max-width: 640px) 144px, 176px"
                    className="object-contain block dark:block"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center" aria-label="Main Navigation">
              <ul className="nav-links">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="nav-link relative py-1">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 uppercase tracking-wider">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Header Right Actions */}
            <div className="header-actions">
              {/* Quick Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="relative hidden md:flex items-center"
              >
                <Search
                  size={16}
                  className="absolute left-3 text-muted-foreground pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Tìm đồ tập, whey protein..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9 pr-8 w-48 lg:w-64 transition-all focus:w-72 bg-secondary/80 focus:bg-background text-[13px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground text-xs"
                    aria-label="Xóa tìm kiếm"
                  >
                    ×
                  </button>
                )}
              </form>

              {/* Hotline Callout */}
              <a
                href="tel:19008899"
                className="hidden xl:inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-foreground text-[12.5px] font-medium border border-border hover:border-primary/50 transition-colors"
                title="Gọi ngay tổng đài CSKH"
              >
                <PhoneCall size={14} className="text-primary animate-bounce" />
                <span>1900 8899</span>
              </a>

              {/* User Account Button */}
              <Link
                href="/account/login"
                className="btn btn-secondary btn-icon text-muted-foreground hover:text-foreground"
                aria-label="Tài khoản cá nhân"
                title="Tài khoản cá nhân"
              >
                <User size={18} />
              </Link>

              {/* Cart Button with Prominent Counter Badge */}
              <Link
                href="/cart"
                className="btn btn-secondary btn-icon relative group border-border hover:border-primary text-foreground"
                aria-label="Giỏ hàng TITANFIT"
                title="Xem giỏ hàng"
              >
                <ShoppingCart
                  size={19}
                  className="group-hover:text-primary transition-colors"
                />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-primary text-white text-[11px] font-extrabold flex items-center justify-center shadow-md shadow-primary/30 ring-2 ring-background">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn btn-secondary btn-icon lg:hidden"
                aria-label="Mở menu điều hướng"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-5 animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="relative mb-4">
              <Search
                size={16}
                className="absolute left-3 top-3 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Tìm sản phẩm thể thao..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9 w-full"
              />
            </form>

            {/* Mobile Links */}
            <ul className="flex flex-col gap-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-secondary text-sm font-semibold text-foreground transition-colors"
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Mobile Footer Info */}
            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <PhoneCall size={14} className="text-primary" />
                <span>CSKH: </span>
                <a
                  href="tel:19008899"
                  className="font-bold text-foreground hover:text-primary"
                >
                  1900 8899
                </a>
              </div>
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="text-primary font-bold hover:underline"
              >
                Giỏ hàng ({cartItemCount})
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
