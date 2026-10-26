"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Star, CheckCircle2, Sparkles } from "lucide-react";
import { formatVND } from "@/lib/format";
import { getErrorMessage } from "@/lib/error";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import orderApiRequest from "@/apiRequest/order";
import reviewApiRequest from "@/apiRequest/review";
import ReviewModal from "@/components/review/ReviewModal";
import { OrderResponse } from "@/types/order.type";
import { useAutoSync } from "@/lib/sync";
import { useHydrated } from "@/hooks/useHydrated";
import { Toast } from "@/components/ui";
import { extractOrdersList } from "@/hooks/queries/useOrders";

export interface TrackingOrderItem {
  id?: string;
  productId?: string;
  productSlug?: string;
  name: string;
  variant: string;
  price: number;
  qty: number;
  thumb?: string;
}

export interface TrackingOrder {
  code: string;
  time: string;
  status: "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED" | string;
  customer: string;
  phone: string;
  address: string;
  note?: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  items: TrackingOrderItem[];
  trackingNumber?: string;
  carrier?: string;
  logs?: { time: string; text: string }[];
}

// Helper: Map product name keywords to thumbnails
function getProductThumbnail(name: string): string {
  const lower = (name || "").toLowerCase();
  if (lower.includes("creatine")) return "/images/products/titan-creatine.jpg";
  if (lower.includes("mass")) return "/images/products/titan-mass.jpg";
  if (
    lower.includes("pre-workout") ||
    lower.includes("c4") ||
    lower.includes("abe") ||
    lower.includes("bcaa") ||
    lower.includes("xtend")
  ) {
    return "/images/products/titan-preworkout.jpg";
  }
  if (
    lower.includes("áo") ||
    lower.includes("quần") ||
    lower.includes("dry-fit") ||
    lower.includes("tshirt") ||
    lower.includes("belt") ||
    lower.includes("đai") ||
    lower.includes("shaker")
  ) {
    return "/images/products/titan-dryfit.jpg";
  }
  return "/images/products/titan-iso-whey.jpg";
}

// Helper: Normalize phone numbers for comparison (remove spaces, dots, dashes, +84)
function normalizePhone(phone?: string): string {
  if (!phone) return "";
  let clean = phone.replace(/[^0-9]/g, "");
  if (clean.startsWith("84")) {
    clean = "0" + clean.slice(2);
  }
  return clean;
}

// Convert backend API order to TrackingOrder format
function mapApiOrderToTracking(apiOrder: OrderResponse): TrackingOrder {
  let mappedStatus = "PENDING";
  const rawStatus = (apiOrder.orderStatus || "").toUpperCase();
  if (rawStatus === "SHIPPING" || rawStatus === "DELIVERING") {
    mappedStatus = "SHIPPING";
  } else if (rawStatus === "COMPLETED" || rawStatus === "DELIVERED") {
    mappedStatus = "COMPLETED";
  } else if (rawStatus === "CANCELLED") {
    mappedStatus = "CANCELLED";
  } else if (rawStatus === "CONFIRMED") {
    mappedStatus = "CONFIRMED";
  }

  const items: TrackingOrderItem[] = (apiOrder.items || []).map((it) => ({
    id: it.id,
    productId: it.productId,
    productSlug: it.productSlug,
    name: it.productName || "Sản Phẩm TITANFIT",
    variant: it.variantName || "Tiêu Chuẩn",
    price: Number(it.price) || 0,
    qty: it.quantity || 1,
    thumb: getProductThumbnail(it.productName || ""),
  }));

  const orderDate = apiOrder.createdAt
    ? new Date(apiOrder.createdAt).toLocaleDateString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Vừa xong";

  const orderTimeOnly = apiOrder.createdAt
    ? new Date(apiOrder.createdAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "09:00";

  let logs: { time: string; text: string }[] = [];
  if (mappedStatus === "CANCELLED") {
    logs = [
      {
        time: "Đã hủy",
        text: `Đơn hàng #${apiOrder.orderCode} đã được ghi nhận hủy theo yêu cầu.`,
      },
      {
        time: orderTimeOnly,
        text: `Đơn hàng #${apiOrder.orderCode} đã được khởi tạo trên hệ thống TITANFIT.`,
      },
    ];
  } else if (mappedStatus === "COMPLETED") {
    logs = [
      {
        time: "16:45",
        text: `Giao hàng thành công. Người nhận: ${apiOrder.customerName || "Khách Hàng"} (đã ký nhận)`,
      },
      {
        time: "14:10",
        text: `Bưu tá Viettel Post đã liên hệ và phát hàng tới ${apiOrder.shippingAddress || "địa chỉ nhận hàng"}`,
      },
      {
        time: "08:30",
        text: "Kiện hàng đã xuất kho trung tâm TITANFIT và bàn giao cho Viettel Post",
      },
      {
        time: orderTimeOnly,
        text: `Đơn hàng #${apiOrder.orderCode} đã được tạo thành công trên hệ thống`,
      },
    ];
  } else if (mappedStatus === "SHIPPING") {
    logs = [
      {
        time: "11:20",
        text: `Bưu tá Viettel Post đang tiến hành phát hàng tới: ${apiOrder.shippingAddress || "địa chỉ người nhận"}`,
      },
      {
        time: "08:15",
        text: "Kiện hàng đã xuất kho trung tâm TITANFIT và bàn giao cho đơn vị vận chuyển",
      },
      { time: orderTimeOnly, text: `Đơn hàng #${apiOrder.orderCode} đã được tạo thành công` },
    ];
  } else if (mappedStatus === "CONFIRMED") {
    logs = [
      {
        time: "Đã duyệt",
        text: `Đơn hàng #${apiOrder.orderCode} đã được Quản trị viên TITANFIT xác nhận và chuyển kho đóng gói.`,
      },
      {
        time: orderTimeOnly,
        text: `Đơn hàng #${apiOrder.orderCode} đã được tạo thành công trên hệ thống trực tuyến TITANFIT`,
      },
    ];
  } else {
    // PENDING
    logs = [
      {
        time: "Đang xử lý",
        text: "Bộ phận kho TITANFIT đang kiểm tra tồn kho, niêm phong kiện hàng & dán tem bảo hành",
      },
      {
        time: orderTimeOnly,
        text: `Đơn hàng #${apiOrder.orderCode} đã được tạo thành công trên hệ thống trực tuyến TITANFIT`,
      },
    ];
  }

  const isVietQR = apiOrder.paymentMethod === "VIETQR";
  const isPaid = apiOrder.paymentStatus === "PAID";

  return {
    code: apiOrder.orderCode,
    time: orderDate,
    status: mappedStatus,
    customer: apiOrder.customerName || "Khách Hàng",
    phone: apiOrder.phone || "",
    address: apiOrder.shippingAddress || "Địa chỉ giao hàng đã đăng ký",
    note: apiOrder.note || "Giao giờ hành chính, gọi trước khi đến",
    paymentMethod: isVietQR ? "Chuyển khoản VietQR (Napas247)" : "Thanh toán khi nhận hàng (COD)",
    paymentStatus: isPaid
      ? "Đã thanh toán"
      : isVietQR
        ? "Chờ đối soát (VietQR)"
        : "Chờ thu tiền khi giao (COD)",
    total: Number(apiOrder.totalAmount) || 0,
    trackingNumber: `VTP-${apiOrder.orderCode.replace(/[^0-9]/g, "") || "84920199"}`,
    carrier: "Viettel Post Express",
    logs,
    items:
      items.length > 0
        ? items
        : [
            {
              name: "Combo Thể Hình TITANFIT Chuyên Nghiệp",
              variant: "Gói Đặt Hàng Tiêu Chuẩn",
              price: Number(apiOrder.totalAmount) || 0,
              qty: 1,
              thumb: "/images/products/titan-iso-whey.jpg",
            },
          ],
  };
}

export default function OrderTrackingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedOrderParam =
    searchParams.get("orderCode") || searchParams.get("order") || "";

  const { isAuthenticated } = useAuthStore();
  const { addItem, openDrawer } = useCartStore();

  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<TrackingOrder | null>(null);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isHydrated = useHydrated();

  // Enforce authentication: Redirect to login immediately if not logged in once hydrated
  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      const currentUrl =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/order-tracking";
      router.replace(`/login?redirect=${encodeURIComponent(currentUrl)}`);
    }
  }, [isHydrated, isAuthenticated, router]);

  // Order lookup form state
  const [searchCode, setSearchCode] = useState<string>(requestedOrderParam);
  const [searchPhone, setSearchPhone] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);
  const [isLookupFormOpen, setIsLookupFormOpen] = useState<boolean>(false);

  useEffect(() => {
    if (requestedOrderParam) {
      setSearchCode(requestedOrderParam);
    }
  }, [requestedOrderParam]);

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Cancel order support modal state
  const [cancelModalOrder, setCancelModalOrder] = useState<TrackingOrder | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "info" | "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "info" | "success" | "error" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch real order data directly from backend API
  const loadInitialData = useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsLoading(true);
      }

      try {
        // 1. Fetch real orders of the authenticated user from Backend API
        const res = await orderApiRequest.getMyOrders();
        const rawOrders = extractOrdersList(res.data?.data);
        let apiOrders: TrackingOrder[] = rawOrders.map(mapApiOrderToTracking);

        // 2. If a specific order is requested via query param (?orderCode=TF-xxxxxx or ?order=TF-xxxxxx), verify presence
        if (requestedOrderParam) {
          const found = apiOrders.find(
            (o) => o.code.toLowerCase() === requestedOrderParam.toLowerCase()
          );
          if (!found) {
            try {
              const singleRes = await orderApiRequest.getOrderByCode(requestedOrderParam);
              if (singleRes.data?.data) {
                const fetchedOrder = mapApiOrderToTracking(singleRes.data.data);
                apiOrders = [fetchedOrder, ...apiOrders];
              }
            } catch (err) {
              if (process.env.NODE_ENV !== "production") {
                console.warn("Could not fetch requested order by code:", err);
              }
            }
          }
        }

        setOrders(apiOrders);

        // Determine active order preserving selection or requested order
        setActiveOrder((prev) => {
          if (requestedOrderParam) {
            const found = apiOrders.find(
              (o) => o.code.toLowerCase() === requestedOrderParam.toLowerCase()
            );
            if (found) return found;
          }

          if (prev?.code) {
            const updatedCurrent = apiOrders.find(
              (o) => o.code.toLowerCase() === prev.code.toLowerCase()
            );
            if (updatedCurrent) return updatedCurrent;
          }

          return apiOrders[0] || null;
        });
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Could not fetch user orders from backend:", err);
        }
        if (!silent) {
          setOrders([]);
          setActiveOrder(null);
        }
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [requestedOrderParam]
  );

  useEffect(() => {
    async function init() {
      await loadInitialData(false);
    }

    if (isAuthenticated) {
      init();
    }
  }, [isAuthenticated, loadInitialData]);

  // Review Modal state
  const [reviewModalState, setReviewModalState] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
    variantName?: string;
  }>({
    isOpen: false,
    productId: "",
    productName: "",
    variantName: "",
  });

  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);

  const loadReviewedProductIds = useCallback(async () => {
    try {
      const res = await reviewApiRequest.getMyReviewedProductIds();
      if (res.data?.data) {
        setReviewedProductIds(res.data.data);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Could not load reviewed product IDs:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void loadReviewedProductIds();
    }
  }, [isAuthenticated, loadReviewedProductIds]);

  const handleReviewSuccess = () => {
    if (reviewModalState.productId) {
      setReviewedProductIds((prev) => [...prev, reviewModalState.productId]);
    }
    showToast("Đánh giá sản phẩm thành công! Cảm ơn bạn đã đóng góp nhận xét.", "success");
  };

  const firstUnreviewedItem = useMemo(() => {
    if (!activeOrder || activeOrder.status !== "COMPLETED") return null;
    return activeOrder.items.find(
      (it) => it.productId && !reviewedProductIds.includes(it.productId)
    );
  }, [activeOrder, reviewedProductIds]);

  // Real-time synchronization: Auto-refresh when admin changes order status,
  // when switching back to tab (focus/visibility), and periodic 3s polling
  useAutoSync({
    eventTypes: ["ORDER_UPDATED"],
    onSync: async (msg) => {
      // 1. Instant optimistic UI update if message includes orderCode & status
      if (msg?.payload && typeof msg.payload === "object") {
        const p = msg.payload as { orderCode?: string; status?: string };
        if (p.orderCode && p.status) {
          const upperStatus = p.status.toUpperCase();
          const mapped =
            upperStatus === "COMPLETED" || upperStatus === "DELIVERED"
              ? "COMPLETED"
              : upperStatus === "SHIPPING" || upperStatus === "DELIVERING"
                ? "SHIPPING"
                : upperStatus === "CANCELLED"
                  ? "CANCELLED"
                  : upperStatus === "CONFIRMED"
                    ? "CONFIRMED"
                    : "PENDING";

          setOrders((prev) =>
            prev.map((ord) =>
              ord.code.toLowerCase() === p.orderCode?.toLowerCase()
                ? { ...ord, status: mapped }
                : ord
            )
          );
          setActiveOrder((prev) => {
            if (prev && prev.code.toLowerCase() === p.orderCode?.toLowerCase()) {
              return { ...prev, status: mapped };
            }
            return prev;
          });
        }
      }

      // 2. Authoritative background sync from backend
      await loadInitialData(true);
    },
    intervalMs: 3000,
    enableFocusSync: true,
  });

  // Tab Counts
  const counts = useMemo(() => {
    return {
      ALL: orders.length,
      PENDING: orders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED").length,
      SHIPPING: orders.filter((o) => o.status === "SHIPPING").length,
      COMPLETED: orders.filter((o) => o.status === "COMPLETED").length,
      CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
    };
  }, [orders]);

  // Filtered orders list based on activeTab
  const filteredOrders = useMemo(() => {
    if (activeTab === "ALL") return orders;
    if (activeTab === "PENDING") {
      return orders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED");
    }
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  // Handle Tab Switch
  const handleTabClick = (tabKey: string) => {
    setActiveTab(tabKey);
    const matches =
      tabKey === "ALL"
        ? orders
        : tabKey === "PENDING"
          ? orders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED")
          : orders.filter((o) => o.status === tabKey);
    if (matches.length > 0) {
      // If current active order isn't in filtered list, switch to first match
      if (!matches.some((o) => o.code === activeOrder?.code)) {
        setActiveOrder(matches[0]);
      }
    } else {
      showToast(`Không có đơn hàng nào trong trạng thái này`, "info");
    }
  };

  // Handle Guest Order Lookup Submit
  const handleGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setSearchSuccess(null);

    const code = searchCode.trim();
    const phone = searchPhone.trim();

    if (!code) {
      setSearchError("Vui lòng nhập Mã đơn hàng cần tra cứu (VD: KZ-849201 hoặc TF-123456).");
      return;
    }

    if (!phone) {
      setSearchError("Vui lòng nhập Số điện thoại đặt hàng để xác thực quyền xem thông tin.");
      return;
    }

    const cleanInputPhone = normalizePhone(phone);
    if (cleanInputPhone.length < 9) {
      setSearchError("Số điện thoại không đúng định dạng (VD: 0987654321).");
      return;
    }

    setIsSearching(true);

    try {
      // 1. Check in local loaded orders first
      const localMatch = orders.find((o) => o.code.toLowerCase() === code.toLowerCase());
      if (localMatch) {
        const orderPhoneClean = normalizePhone(localMatch.phone);
        if (orderPhoneClean === cleanInputPhone) {
          setActiveOrder(localMatch);
          setSearchSuccess(`Đã tìm thấy đơn hàng #${localMatch.code}!`);
          showToast(`Tìm thấy đơn hàng #${localMatch.code}`, "success");
          setIsLookupFormOpen(false);
          document.getElementById("activeOrderSection")?.scrollIntoView({ behavior: "smooth" });
          return;
        } else {
          setSearchError("Không tìm thấy đơn hàng hoặc số điện thoại không trùng khớp.");
          return;
        }
      }

      // 2. Query backend by { orderCode, phone } to verify authorization server-side
      const res = await orderApiRequest.trackOrder({
        orderCode: code,
        phone: cleanInputPhone,
      });

      if (res.data?.data) {
        const backendOrder = mapApiOrderToTracking(res.data.data);
        // Append to orders list and set active
        setOrders((prev) => [backendOrder, ...prev.filter((o) => o.code !== backendOrder.code)]);
        setActiveOrder(backendOrder);
        setSearchSuccess(`Đã tìm thấy đơn hàng #${backendOrder.code}!`);
        setIsLookupFormOpen(false);
        document.getElementById("activeOrderSection")?.scrollIntoView({ behavior: "smooth" });
      } else {
        setSearchError("Không tìm thấy đơn hàng hoặc số điện thoại không trùng khớp.");
      }
    } catch (err: unknown) {
      const message = getErrorMessage(
        err,
        "Không tìm thấy đơn hàng hoặc số điện thoại không trùng khớp. Vui lòng kiểm tra lại."
      );
      setSearchError(message);
    } finally {
      setIsSearching(false);
    }
  };

  // Copy Order Code to Clipboard
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    showToast(`Đã sao chép mã đơn hàng #${text}`, "success");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Cancel Order Support Modal Handler
  const handleOpenCancelModal = (order: TrackingOrder) => {
    setCancelModalOrder(order);
  };

  // Re-Order items back into cart
  const handleReBuy = () => {
    if (!activeOrder || !activeOrder.items.length) return;

    activeOrder.items.forEach((item, idx) => {
      addItem(
        {
          productId: idx + 10,
          slug: "san-pham-titanfit",
          name: item.name,
          image: item.thumb || "/images/products/titan-iso-whey.jpg",
          price: item.price,
          selectedVariants: { "Phiên bản": item.variant },
          variantSummary: item.variant,
          stock: 20,
        },
        item.qty
      );
    });

    showToast(`Đã thêm ${activeOrder.items.length} món vào giỏ hàng!`, "success");
    openDrawer();
  };

  // Refresh Tracking Logs & Order Data from Backend
  const handleRefreshData = async () => {
    showToast("Đang đồng bộ dữ liệu đơn hàng từ hệ thống TITANFIT...", "info");
    await loadInitialData(true);
    showToast("Dữ liệu đơn hàng đã được cập nhật mới nhất!", "success");
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-muted-foreground">
          Đang tải lịch sử & hành trình đơn hàng...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          text={toastMessage.text}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground transition-colors">
            Trang Chủ
          </Link>
          <span>&rsaquo;</span>
          <span className="hover:text-foreground">Tài Khoản Khách Hàng</span>
          <span>&rsaquo;</span>
          <span className="text-foreground font-semibold">Đơn Hàng Của Tôi</span>
        </div>

        {/* Page Title & Refresh Action */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading tracking-tight">
              Đơn Hàng Của Tôi
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Theo dõi trạng thái giao hàng theo thời gian thực, kiểm tra lịch sử mua sắm và hóa đơn
              điện tử
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLookupFormOpen(!isLookupFormOpen)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold transition-colors cursor-pointer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span>{isLookupFormOpen ? "Ẩn Khung Tra Cứu" : "Tra Cứu Mã Đơn Khác"}</span>
            </button>
            <button
              type="button"
              onClick={handleRefreshData}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold transition-colors cursor-pointer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              <span>Làm Mới Hành Trình</span>
            </button>
          </div>
        </div>

        {/* DEDICATED MANUAL LOOKUP CARD */}
        {isLookupFormOpen && (
          <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-md animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground">
                    Tra Cứu Đơn Hàng Bằng Mã Đơn
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Nhập Mã đơn hàng và Số điện thoại nhận hàng để tra cứu lộ trình vận chuyển
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLookupFormOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Đóng ✕
              </button>
            </div>

            {searchError && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{searchError}</span>
              </div>
            )}

            {searchSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{searchSuccess}</span>
              </div>
            )}

            <form
              onSubmit={handleGuestLookup}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end"
            >
              <div className="sm:col-span-5">
                <label
                  className="block text-xs font-semibold text-foreground mb-1.5"
                  htmlFor="guestOrderCode"
                >
                  Mã Đơn Hàng <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  </span>
                  <input
                    id="guestOrderCode"
                    type="text"
                    className="w-full h-10.5 pl-10 pr-3.5 rounded-xl bg-secondary border border-border text-foreground text-xs font-mono font-bold placeholder:text-muted-foreground focus:outline-none focus:border-primary uppercase"
                    placeholder="VD: KZ-849201 hoặc TF-123456"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="sm:col-span-5">
                <label
                  className="block text-xs font-semibold text-foreground mb-1.5"
                  htmlFor="guestOrderPhone"
                >
                  Số Điện Thoại Nhận Hàng <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <input
                    id="guestOrderPhone"
                    type="tel"
                    className="w-full h-10.5 pl-10 pr-3.5 rounded-xl bg-secondary border border-border text-foreground text-xs font-sans placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    placeholder="VD: 0987 654 321"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full h-10.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSearching ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Tra cứu...</span>
                    </>
                  ) : (
                    <span>Tra Cứu</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. FILTER TABS (PILLS) */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-border text-xs font-medium scrollbar-none">
          <button
            type="button"
            onClick={() => handleTabClick("ALL")}
            className={`px-4 py-2 rounded-full cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === "ALL"
                ? "bg-foreground text-background font-bold shadow-xs"
                : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Tất Cả Đơn ({counts.ALL})
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("PENDING")}
            className={`px-4 py-2 rounded-full cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === "PENDING"
                ? "bg-foreground text-background font-bold shadow-xs"
                : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Chờ Xác Nhận / Thanh Toán ({counts.PENDING})
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("SHIPPING")}
            className={`px-4 py-2 rounded-full cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === "SHIPPING"
                ? "bg-foreground text-background font-bold shadow-xs"
                : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Đang Vận Chuyển ({counts.SHIPPING})
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("COMPLETED")}
            className={`px-4 py-2 rounded-full cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === "COMPLETED"
                ? "bg-foreground text-background font-bold shadow-xs"
                : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Đã Giao Thành Công ({counts.COMPLETED})
          </button>
          {counts.CANCELLED > 0 && (
            <button
              type="button"
              onClick={() => handleTabClick("CANCELLED")}
              className={`px-4 py-2 rounded-full cursor-pointer whitespace-nowrap transition-colors ${
                activeTab === "CANCELLED"
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Đã Hủy ({counts.CANCELLED})
            </button>
          )}
        </div>

        {/* 4. MAIN BUYER 2-COLUMN GRID LAYOUT (Synchronized with wireframe) */}
        {activeOrder ? (
          <div
            id="activeOrderSection"
            className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 xl:gap-8 items-start"
          >
            {/* Left Column: Delivery Progress & Recipient Info */}
            <div className="flex flex-col gap-6">
              {/* Card 1: Delivery Progress Timeline */}
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-sm">
                {/* Header: Order Code & Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-border">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-xs text-muted-foreground">Mã Đơn Hàng:</span>
                    <span className="font-mono text-base sm:text-lg font-bold text-primary">
                      #{activeOrder.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(activeOrder.code)}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
                    >
                      {copiedCode ? "Đã copy!" : "Copy"}
                    </button>
                    <span className="text-xs text-muted-foreground hidden sm:inline">&bull;</span>
                    <span className="text-xs text-muted-foreground">
                      Đặt lúc {activeOrder.time}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {activeOrder.status === "PENDING" && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        ⏳ Chờ Xác Nhận / Thanh Toán
                      </span>
                    )}
                    {activeOrder.status === "CONFIRMED" && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        📦 Đã Xác Nhận / Chuẩn Bị Hàng
                      </span>
                    )}
                    {activeOrder.status === "SHIPPING" && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/20">
                        🚚 Đang Vận Chuyển
                      </span>
                    )}
                    {activeOrder.status === "COMPLETED" && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ✅ Đã Giao Thành Công
                      </span>
                    )}
                    {activeOrder.status === "CANCELLED" && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                        ❌ Đã Hủy Đơn
                      </span>
                    )}
                  </div>
                </div>

                {/* Subheader: Lộ Trình & Mã Vận Đơn */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                  <div className="text-sm font-bold text-foreground flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-primary"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                    <span>Lộ Trình Giao Hàng Chi Tiết</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Mã vận đơn:{" "}
                    <strong className="font-mono text-foreground font-semibold">
                      {activeOrder.trackingNumber || "VTP-84920199"}
                    </strong>{" "}
                    ({activeOrder.carrier || "Viettel Post Express"})
                  </div>
                </div>

                {/* Stepper Timeline 5 Nodes */}
                <div className="relative py-3 overflow-x-auto">
                  <div className="min-w-[480px] relative flex justify-between">
                    {/* Connecting line */}
                    <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-border -z-0" />

                    {/* Node 1: Đặt Hàng */}
                    <div className="relative z-10 flex flex-col items-center text-center w-24">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold mb-2 shadow-xs">
                        ✓
                      </div>
                      <div className="text-xs font-bold text-foreground">Đặt Hàng</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Thành công</div>
                    </div>

                    {/* Node 2: Đã Xác Nhận */}
                    <div className="relative z-10 flex flex-col items-center text-center w-24">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all ${
                          activeOrder.status === "PENDING"
                            ? "bg-primary text-white ring-4 ring-primary/20 shadow-xs"
                            : activeOrder.status === "CANCELLED"
                              ? "bg-muted text-muted-foreground"
                              : "bg-emerald-500 text-white"
                        }`}
                      >
                        {activeOrder.status === "PENDING"
                          ? "2"
                          : activeOrder.status === "CANCELLED"
                            ? "✕"
                            : "✓"}
                      </div>
                      <div
                        className={`text-xs font-bold ${activeOrder.status === "PENDING" ? "text-primary" : "text-foreground"}`}
                      >
                        Đã Xác Nhận
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {activeOrder.status === "PENDING" ? "Đang xử lý" : "Đã duyệt"}
                      </div>
                    </div>

                    {/* Node 3: Đóng Gói Kho */}
                    <div className="relative z-10 flex flex-col items-center text-center w-24">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all ${
                          activeOrder.status === "SHIPPING" || activeOrder.status === "COMPLETED"
                            ? "bg-emerald-500 text-white"
                            : "bg-secondary text-muted-foreground border border-border"
                        }`}
                      >
                        {activeOrder.status === "SHIPPING" || activeOrder.status === "COMPLETED"
                          ? "✓"
                          : "3"}
                      </div>
                      <div className="text-xs font-semibold text-foreground">Đóng Gói Kho</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Tem niêm phong</div>
                    </div>

                    {/* Node 4: Đang Vận Chuyển */}
                    <div className="relative z-10 flex flex-col items-center text-center w-24">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all ${
                          activeOrder.status === "SHIPPING"
                            ? "bg-primary text-white ring-4 ring-primary/20 shadow-xs"
                            : activeOrder.status === "COMPLETED"
                              ? "bg-emerald-500 text-white"
                              : "bg-secondary text-muted-foreground border border-border"
                        }`}
                      >
                        {activeOrder.status === "COMPLETED" ? "✓" : "4"}
                      </div>
                      <div
                        className={`text-xs font-bold ${activeOrder.status === "SHIPPING" ? "text-primary" : "text-foreground"}`}
                      >
                        Đang Vận Chuyển
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Viettel Post</div>
                    </div>

                    {/* Node 5: Giao Thành Công */}
                    <div className="relative z-10 flex flex-col items-center text-center w-24">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all ${
                          activeOrder.status === "COMPLETED"
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "bg-secondary text-muted-foreground border border-border"
                        }`}
                      >
                        {activeOrder.status === "COMPLETED" ? "✓" : "5"}
                      </div>
                      <div className="text-xs font-semibold text-foreground">Giao Thành Công</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Ký nhận hàng</div>
                    </div>
                  </div>
                </div>

                {/* Timeline Logs */}
                <div className="mt-6 p-4 rounded-xl bg-secondary/60 border border-border">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Nhật Ký Hành Trình Giao Vận
                  </div>
                  <div className="flex flex-col gap-2.5 text-xs">
                    {(activeOrder.logs || []).map((log, i) => (
                      <div key={i} className="flex items-baseline gap-3">
                        <span className="font-semibold text-primary min-w-[45px]">{log.time}</span>
                        <span
                          className={
                            i === 0 ? "text-foreground font-medium" : "text-muted-foreground"
                          }
                        >
                          {log.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review Callout when order is COMPLETED */}
                {activeOrder.status === "COMPLETED" && (
                  <div className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">
                          Đơn hàng đã giao thành công!
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {firstUnreviewedItem
                            ? "Bạn hài lòng với sản phẩm? Hãy chia sẻ cảm nhận và đánh giá ngay nhé."
                            : "Bạn đã hoàn thành đánh giá cho các sản phẩm trong đơn hàng này. Cảm ơn bạn!"}
                        </p>
                      </div>
                    </div>
                    {firstUnreviewedItem && firstUnreviewedItem.productId ? (
                      <button
                        type="button"
                        onClick={() =>
                          setReviewModalState({
                            isOpen: true,
                            productId: firstUnreviewedItem.productId!,
                            productName: firstUnreviewedItem.name,
                            variantName: firstUnreviewedItem.variant,
                          })
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-white text-white" />
                        <span>Đánh Giá Ngay</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã Đánh Giá Xong</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card 2: Recipient Details & Payment Info */}
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-sm">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-3 mb-4 border-b border-border">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>Thông Tin Nhận Hàng &amp; Thanh Toán</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Người Nhận Hàng
                    </div>
                    <div className="font-bold text-foreground text-sm">{activeOrder.customer}</div>
                    <div className="text-muted-foreground mt-0.5 font-mono">
                      {activeOrder.phone}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Địa Chỉ Nhận Hàng
                    </div>
                    <div className="font-medium text-foreground leading-relaxed">
                      {activeOrder.address}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Phương Thức Thanh Toán
                    </div>
                    <div className="font-bold text-primary">{activeOrder.paymentMethod}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Trạng Thái Thanh Toán
                    </div>
                    <div className="font-bold text-amber-600 dark:text-amber-400">
                      {activeOrder.paymentStatus}
                    </div>
                  </div>
                </div>

                {activeOrder.note && (
                  <div className="mt-3.5 p-3.5 rounded-xl bg-secondary/50 border border-border/80 text-xs">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Ghi Chú Giao Hàng
                    </div>
                    <div className="italic text-muted-foreground">{activeOrder.note}</div>
                  </div>
                )}
              </div>

              {/* Card 3: Other Past Orders List */}
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 20v-6M6 20V10M18 20V4" />
                    </svg>
                    <span>Các Đơn Hàng Khác Của Bạn</span>
                  </h3>
                  <span className="text-xs text-muted-foreground">Bấm vào để xem chi tiết</span>
                </div>

                <div className="flex flex-col gap-3">
                  {filteredOrders
                    .filter((o) => o.code !== activeOrder.code)
                    .map((ord) => (
                      <div
                        key={ord.code}
                        onClick={() => {
                          setActiveOrder(ord);
                          document
                            .getElementById("activeOrderSection")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="p-3.5 rounded-xl border border-border hover:border-primary bg-card hover:bg-secondary/40 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-primary text-xs sm:text-sm">
                              #{ord.code}
                            </span>
                            {ord.status === "PENDING" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                ⏳ Chờ Duyệt
                              </span>
                            )}
                            {ord.status === "CONFIRMED" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                📦 Đã Duyệt
                              </span>
                            )}
                            {ord.status === "SHIPPING" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary">
                                🚚 Đang Giao
                              </span>
                            )}
                            {ord.status === "COMPLETED" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                ✅ Đã Giao
                              </span>
                            )}
                            {ord.status === "CANCELLED" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                                ❌ Đã Hủy
                              </span>
                            )}
                            <span className="text-[11px] text-muted-foreground">
                              &bull; {ord.time}
                            </span>
                          </div>
                          <div className="text-xs text-foreground mt-1 line-clamp-1">
                            {ord.items.map((i) => i.name).join(" + ")}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                          <strong className="text-xs sm:text-sm font-extrabold text-foreground font-heading">
                            {formatVND(ord.total)}
                          </strong>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border bg-secondary text-foreground hover:bg-secondary/80">
                            Xem Đơn
                          </span>
                        </div>
                      </div>
                    ))}

                  {filteredOrders.filter((o) => o.code !== activeOrder.code).length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      Không có đơn hàng nào khác trong danh mục này.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Order Items Summary & Sticky Financial Card */}
            <div className="lg:sticky lg:top-24 flex flex-col gap-6">
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-primary"
                    >
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    <span>
                      Sản Phẩm Trong Đơn ({activeOrder.items.reduce((s, it) => s + it.qty, 0)} món)
                    </span>
                  </h3>
                  <span className="font-mono text-xs font-bold text-primary">
                    #{activeOrder.code}
                  </span>
                </div>

                {/* Items List */}
                <div className="divide-y divide-border/60 mb-5">
                  {activeOrder.items.map((item, index) => {
                    const isReviewed = item.productId
                      ? reviewedProductIds.includes(item.productId)
                      : false;

                    return (
                      <div
                        key={item.id || `${activeOrder.code}-${item.name}-${item.variant}-${index}`}
                        className="py-3 flex items-center gap-3"
                      >
                        <div className="relative w-14 h-14 rounded-xl bg-secondary border border-border shrink-0 overflow-hidden">
                          <Image
                            src={item.thumb || "/images/products/titan-iso-whey.jpg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-bold text-xs sm:text-sm text-foreground truncate"
                            title={item.name}
                          >
                            {item.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {item.variant}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Số lượng: <strong className="text-foreground">{item.qty}</strong> &times;{" "}
                            {formatVND(item.price)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className="font-heading font-extrabold text-xs sm:text-sm text-foreground text-right">
                            {formatVND(item.price * item.qty)}
                          </div>

                          {/* Review Action for Completed Order */}
                          {activeOrder.status === "COMPLETED" && item.productId && (
                            isReviewed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Đã đánh giá</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setReviewModalState({
                                    isOpen: true,
                                    productId: item.productId!,
                                    productName: item.name,
                                    variantName: item.variant,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                              >
                                <Star className="w-2.5 h-2.5 fill-white text-white" />
                                <span>Đánh Giá</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Financial Breakdown */}
                <div className="pt-4 border-t border-border space-y-2 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Tạm tính:</span>
                    <span className="font-semibold text-foreground">
                      {formatVND(activeOrder.total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Phí vận chuyển:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Miễn Phí
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Giảm giá ưu đãi:</span>
                    <span>0 ₫</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 mt-1 border-t border-border">
                    <span className="font-bold text-sm text-foreground">Tổng Thanh Toán:</span>
                    <strong className="text-xl font-extrabold text-primary font-heading">
                      {formatVND(activeOrder.total)}
                    </strong>
                  </div>
                </div>

                {/* Order Actions */}
                <div className="mt-6 flex flex-col gap-2.5">
                  {/* Primary Review Button when order is COMPLETED */}
                  {activeOrder.status === "COMPLETED" && firstUnreviewedItem?.productId && (
                    <button
                      type="button"
                      onClick={() =>
                        setReviewModalState({
                          isOpen: true,
                          productId: firstUnreviewedItem.productId!,
                          productName: firstUnreviewedItem.name,
                          variantName: firstUnreviewedItem.variant,
                        })
                      }
                      className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-white text-white" />
                      <span>Đánh Giá Sản Phẩm Đã Nhận</span>
                    </button>
                  )}

                  {activeOrder.status === "PENDING" && (
                    <button
                      type="button"
                      onClick={() => handleOpenCancelModal(activeOrder)}
                      className="w-full h-10 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span>Yêu Cầu Hỗ Trợ Hủy Đơn</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleReBuy}
                    className="w-full h-10 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 2v6h6" />
                      <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
                    </svg>
                    <span>Mua Lại Đơn Này</span>
                  </button>

                  <Link
                    href="/products"
                    className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>Tiếp Tục Mua Sắm</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>

                  <div className="text-center text-xs text-muted-foreground pt-3 border-t border-border/60">
                    Tổng đài hỗ trợ 24/7:{" "}
                    <a href="tel:19008899" className="font-bold text-foreground hover:underline">
                      1900 8899
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state if no orders exist */
          <div className="text-center py-16 px-4 bg-card border border-border rounded-2xl shadow-sm">
            <div className="w-16 h-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto mb-4 text-2xl">
              📦
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Không tìm thấy đơn hàng nào</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Bạn chưa có đơn hàng nào trong trạng thái này hoặc mã đơn tra cứu không tồn tại.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsLookupFormOpen(true)}
                className="h-10 px-5 rounded-xl border border-border bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                Nhập Mã Đơn Tra Cứu
              </button>
              <Link
                href="/products"
                className="h-10 px-5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center shadow-sm"
              >
                Khám Phá Sản Phẩm Ngay
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Cancel Order Support Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setCancelModalOrder(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Header Icon & Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 id="cancel-modal-title" className="text-base font-bold text-foreground">
                  Yêu Cầu Hỗ Trợ Hủy Đơn Hàng
                </h3>
                <p className="text-xs text-muted-foreground">
                  Đơn hàng #{cancelModalOrder.code} &bull; {cancelModalOrder.time}
                </p>
              </div>
            </div>

            {/* Notice */}
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border/80 text-xs text-muted-foreground leading-relaxed mb-4">
              Đơn hàng đang ở trạng thái <strong className="text-foreground">Chờ xác nhận</strong>{" "}
              và chuẩn bị xuất kho. Để đảm bảo hủy kịp thời và hoàn tiền (nếu đã thanh toán), quý
              khách vui lòng liên hệ trực tiếp với bộ phận CSKH TitanFit.
            </div>

            {/* Order Code Quick Copy Box */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/80 border border-border mb-4">
              <div className="text-xs">
                <span className="text-muted-foreground block text-[11px]">
                  Mã đơn hàng của bạn:
                </span>
                <strong className="text-sm font-mono text-primary font-bold">
                  #{cancelModalOrder.code}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(cancelModalOrder.code)}
                className="px-3 py-1.5 rounded-lg bg-background hover:bg-muted border border-border text-xs font-semibold text-foreground transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Sao chép</span>
              </button>
            </div>

            {/* Contact Channels */}
            <div className="space-y-2.5 mb-6">
              {/* Channel 1: Hotline */}
              <a
                href="tel:19008888"
                className="flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Hotline Hỗ Trợ 24/7
                    </span>
                    <span className="text-sm font-extrabold text-primary">1900 8888</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                  Gọi ngay &rarr;
                </span>
              </a>

              {/* Channel 2: Email */}
              <a
                href={`mailto:cskh@titanfit.vn?subject=${encodeURIComponent(
                  `[Yêu cầu hủy đơn hàng #${cancelModalOrder.code}]`
                )}&body=${encodeURIComponent(
                  `Xin chào bộ phận CSKH TitanFit,\n\nTôi muốn yêu cầu hủy đơn hàng #${cancelModalOrder.code}.\nLý do: \n\nXin cảm ơn!`
                )}`}
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary text-foreground flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Gửi Email Yêu Cầu
                    </span>
                    <span className="text-xs text-muted-foreground">cskh@titanfit.vn</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  Gửi thư &rarr;
                </span>
              </a>
            </div>

            {/* Close Action */}
            <button
              type="button"
              onClick={() => setCancelModalOrder(null)}
              className="w-full py-2.5 rounded-xl bg-secondary hover:bg-muted text-xs font-bold text-foreground transition-colors cursor-pointer"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalState.isOpen}
        onClose={() => setReviewModalState((prev) => ({ ...prev, isOpen: false }))}
        productId={reviewModalState.productId}
        productName={reviewModalState.productName}
        variantName={reviewModalState.variantName}
        onSuccess={handleReviewSuccess}
      />
    </div>
  );
}
