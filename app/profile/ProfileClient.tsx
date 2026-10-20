"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useHydrated } from "@/hooks/useHydrated";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Toast } from "@/components/ui";
import { useAddresses, useMyOrders } from "@/hooks/queries";
import { OrderResponse } from "@/types/order.type";
import ProfileSidebar, { ProfileTab } from "./components/ProfileSidebar";
import ProfileInfoTab from "./components/ProfileInfoTab";
import ProfileAddressesTab from "./components/ProfileAddressesTab";
import ProfileSecurityTab from "./components/ProfileSecurityTab";
import ProfileOrdersTab from "./components/ProfileOrdersTab";

export default function ProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHydrated = useHydrated();
  const { user, isAuthenticated, logout } = useAuthStore();

  // Active Tab derived directly from URL query param
  const tabParam = searchParams.get("tab") as ProfileTab;
  const activeTab: ProfileTab =
    tabParam && ["profile", "addresses", "security", "orders"].includes(tabParam)
      ? tabParam
      : "profile";

  const handleTabChange = (tab: ProfileTab) => {
    router.replace(`/profile?tab=${tab}`, { scroll: false });
  };

  // Enforce auth check once hydrated
  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace("/login?redirect=/profile");
    }
  }, [isHydrated, isAuthenticated, router]);

  // Toast feedback state
  const [toast, setToast] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Queries for badge counts in sidebar
  const { data: addresses = [] } = useAddresses();
  const { data: rawOrders = [] } = useMyOrders();
  const orders = useMemo<OrderResponse[]>(() => {
    if (Array.isArray(rawOrders)) return rawOrders;
    if (
      rawOrders &&
      typeof rawOrders === "object" &&
      "content" in rawOrders &&
      Array.isArray((rawOrders as { content?: unknown }).content)
    ) {
      return (rawOrders as { content: OrderResponse[] }).content;
    }
    return [];
  }, [rawOrders]);

  // Logout modal state
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
    router.replace("/login");
  };

  // Prevent SSR flash
  if (!isHydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Đang tải hồ sơ của bạn...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Toast Notification */}
      {toast.show && (
        <Toast
          text={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}

      {/* Breadcrumb Bar */}
      <div className="border-b border-border bg-card/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Link href="/" className="hover:text-primary transition-colors">
              Trang Chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-semibold">Tài Khoản</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-primary font-bold">Hồ Sơ Cá Nhân</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Page Header */}
        <div className="mb-8 pb-6 border-b border-border">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground tracking-tight">
            Tài Khoản Của Tôi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý thông tin hồ sơ, sổ địa chỉ giao hàng và cài đặt bảo mật
          </p>
        </div>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT SIDEBAR (4 cols) ================= */}
          <ProfileSidebar
            user={user}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            addressCount={addresses.length}
            orderCount={orders.length}
            onLogoutClick={() => setIsLogoutModalOpen(true)}
          />

          {/* ================= RIGHT MAIN CONTENT (8 cols) ================= */}
          <div className="lg:col-span-8">
            {activeTab === "profile" && (
              <ProfileInfoTab user={user} showToast={showToast} />
            )}

            {activeTab === "addresses" && (
              <ProfileAddressesTab user={user} showToast={showToast} />
            )}

            {activeTab === "security" && (
              <ProfileSecurityTab showToast={showToast} />
            )}

            {activeTab === "orders" && (
              <ProfileOrdersTab />
            )}
          </div>
        </div>
      </main>

      {/* Confirm Logout Modal */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Đăng Xuất Tài Khoản"
        message="Bạn có chắc chắn muốn đăng xuất khỏi phiên làm việc hiện tại không?"
        confirmText="Đăng Xuất"
        cancelText="Hủy"
        variant="warning"
        onConfirm={handleConfirmLogout}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
}
