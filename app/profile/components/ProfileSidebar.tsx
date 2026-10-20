"use client";

import React from "react";
import Link from "next/link";
import {
  User,
  MapPin,
  ShieldCheck,
  Package,
  LogOut,
  Award,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { UserResponse } from "@/types/auth.type";

export type ProfileTab = "profile" | "addresses" | "security" | "orders";

interface ProfileSidebarProps {
  user: UserResponse;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  addressCount: number;
  orderCount: number;
  onLogoutClick: () => void;
}

export default function ProfileSidebar({
  user,
  activeTab,
  onTabChange,
  addressCount,
  orderCount,
  onLogoutClick,
}: ProfileSidebarProps) {
  const avatarInitial = user.fullName ? user.fullName.trim().charAt(0).toUpperCase() : "U";

  return (
    <aside className="lg:col-span-4 flex flex-col gap-6">
      {/* 1. Identity & Member Tier Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center font-black text-2xl ring-4 ring-primary/20 shadow-md shrink-0">
            {avatarInitial}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className="text-lg font-bold font-heading text-foreground truncate"
              title={user.fullName}
            >
              {user.fullName}
            </h2>
            <p className="text-xs text-muted-foreground truncate mt-0.5" title={user.email}>
              {user.email}
            </p>
            {user.role === "ROLE_ADMIN" && (
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-secondary text-foreground border border-border">
                  Quản Trị Viên
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs List */}
      <nav className="bg-card border border-border rounded-2xl p-2 shadow-sm flex flex-col gap-1">
        <button
          type="button"
          onClick={() => onTabChange("profile")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
            activeTab === "profile"
              ? "bg-primary text-white shadow-sm shadow-primary/20"
              : "text-foreground hover:bg-secondary"
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span>Thông Tin Cá Nhân</span>
          <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
        </button>

        <button
          type="button"
          onClick={() => onTabChange("addresses")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
            activeTab === "addresses"
              ? "bg-primary text-white shadow-sm shadow-primary/20"
              : "text-foreground hover:bg-secondary"
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span>Sổ Địa Chỉ Nhận Hàng</span>
          <span
            className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === "addresses"
                ? "bg-white/20 text-white"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {addressCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("security")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
            activeTab === "security"
              ? "bg-primary text-white shadow-sm shadow-primary/20"
              : "text-foreground hover:bg-secondary"
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Đổi Mật Khẩu & Bảo Mật</span>
          <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
        </button>

        <button
          type="button"
          onClick={() => onTabChange("orders")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
            activeTab === "orders"
              ? "bg-primary text-white shadow-sm shadow-primary/20"
              : "text-foreground hover:bg-secondary"
          }`}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span>Đơn Hàng Gần Đây</span>
          <span
            className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === "orders" ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
            }`}
          >
            {orderCount}
          </span>
        </button>

        {user.role === "ROLE_ADMIN" && (
          <Link
            href="/admin"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-primary hover:bg-primary/10 transition-colors mt-1 border-t border-border"
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>Cổng Quản Trị (Admin Portal)</span>
            <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
          </Link>
        )}

        {/* Logout Button */}
        <button
          type="button"
          onClick={onLogoutClick}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left mt-1 border-t border-border"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Đăng Xuất Tài Khoản</span>
        </button>
      </nav>
    </aside>
  );
}
