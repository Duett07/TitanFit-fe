"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useAuthStore } from "@/stores/useAuthStore";
import authApiRequest from "@/apiRequest/auth";
import { getSafeRedirect } from "@/lib/security";

// Zod Validation Schema
const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Họ và tên phải có ít nhất 2 ký tự")
      .max(100, "Họ và tên không được vượt quá 100 ký tự"),
    email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập địa chỉ email")
      .email("Địa chỉ email không đúng định dạng (VD: hoang@titanfit.vn)"),
    phone: z
      .string()
      .trim()
      .regex(
        /^(0|\+84)[0-9]{9,10}$/,
        "Số điện thoại không hợp lệ (VD: 0987654321 hoặc +84987654321)"
      ),
    password: z
      .string()
      .min(6, "Mật khẩu phải có tối thiểu 6 ký tự"),
    confirmPassword: z
      .string()
      .min(1, "Vui lòng nhập lại mật khẩu xác nhận"),
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, "Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không trùng khớp với mật khẩu đã nhập",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || searchParams.get("from");
  const redirectTarget = getSafeRedirect(rawRedirect);
  const setUser = useAuthStore((state) => state.setUser);

  const [formValues, setFormValues] = useState<RegisterFormValues>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "info" | "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "info" | "success" | "error" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleChange = (
    field: keyof RegisterFormValues,
    value: string | boolean
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    // Clear inline error on typing
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Zod Validation
    const validationResult = registerSchema.safeParse(formValues);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const fieldName = issue.path[0] as string;
        if (fieldName && !fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      // 2. Call Register API
      const registerRes = await authApiRequest.register({
        fullName: formValues.fullName.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
        phoneNumber: formValues.phone.trim(),
        password: formValues.password,
      });

      let userData = registerRes.data?.data;

      // 3. Auto-Login: If register API didn't return user session, attempt login
      if (!userData) {
        try {
          const loginRes = await authApiRequest.login({
            email: formValues.email.trim(),
            password: formValues.password,
          });
          userData = loginRes.data?.data;
        } catch {
          // If login API call fails, construct user object from registration payload
          userData = {
            id: "usr_" + Date.now(),
            fullName: formValues.fullName.trim(),
            email: formValues.email.trim(),
            phone: formValues.phone.trim(),
            phoneNumber: formValues.phone.trim(),
            role: "ROLE_USER",
            tier: "Hội Viên Vàng (Gold)",
          };
        }
      }

      // Store in auth store
      if (userData) {
        setUser(userData);
      }

      showToast("Đăng ký thành công! Đã tặng voucher 50.000₫ vào tài khoản", "success");

      // Navigate after storing session
      setTimeout(() => {
        router.push(redirectTarget);
      }, 500);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        axiosErr.response?.data?.message ||
        "Đăng ký không thành công. Email hoặc số điện thoại có thể đã được sử dụng.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 px-4 sm:py-14">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-950 text-emerald-100 border-emerald-800"
              : toastMessage.type === "error"
              ? "bg-rose-950 text-rose-100 border-rose-800"
              : "bg-zinc-900 text-zinc-100 border-zinc-700"
          }`}
        >
          {toastMessage.type === "success" && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="w-full max-w-[480px] bg-card border border-border rounded-2xl p-7 sm:p-9 shadow-xl backdrop-blur-md">
        {/* Card Brand Header */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-3 border border-emerald-500/20">
            🎁 TẶNG VOUCHER 50.000₫ KHI ĐĂNG KÝ
          </span>
          <h1 className="text-2xl font-extrabold text-foreground font-heading mb-1.5 text-center tracking-tight">
            Tạo Tài Khoản Mới
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground text-center leading-relaxed">
            Trở thành hội viên TITANFIT để nhận ưu đãi thành viên, giáo án tập luyện và tích điểm đơn hàng.
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            className="mb-5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200"
            role="alert"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleRegisterSubmit} noValidate>
          {/* 1. Full Name */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="regFullName">
              Họ và Tên <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="regFullName"
                type="text"
                className={`w-full h-10.5 pl-10 pr-3.5 rounded-xl bg-secondary border text-foreground text-xs font-sans placeholder:text-muted-foreground focus:outline-none focus:bg-background transition-all ${
                  errors.fullName ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                }`}
                placeholder="VD: Nguyễn Văn Hoàng"
                value={formValues.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                disabled={isLoading}
              />
            </div>
            {errors.fullName && (
              <p className="text-[11px] text-destructive font-medium mt-1.5 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errors.fullName}</span>
              </p>
            )}
          </div>

          {/* 2. Email Address */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="regEmail">
              Địa Chỉ Email <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                id="regEmail"
                type="email"
                className={`w-full h-10.5 pl-10 pr-3.5 rounded-xl bg-secondary border text-foreground text-xs font-sans placeholder:text-muted-foreground focus:outline-none focus:bg-background transition-all ${
                  errors.email ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                }`}
                placeholder="hoang.nguyen@example.com"
                value={formValues.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-destructive font-medium mt-1.5 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* 3. Phone Number */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="regPhone">
              Số Điện Thoại <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <input
                id="regPhone"
                type="tel"
                className={`w-full h-10.5 pl-10 pr-3.5 rounded-xl bg-secondary border text-foreground text-xs font-sans placeholder:text-muted-foreground focus:outline-none focus:bg-background transition-all ${
                  errors.phone ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                }`}
                placeholder="VD: 0987 654 321"
                value={formValues.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={isLoading}
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-destructive font-medium mt-1.5 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errors.phone}</span>
              </p>
            )}
          </div>

          {/* 4. Password */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="regPassword">
              Mật Khẩu <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="regPassword"
                type={showPassword ? "text" : "password"}
                className={`w-full h-10.5 pl-10 pr-10 rounded-xl bg-secondary border text-foreground text-xs font-sans placeholder:text-muted-foreground focus:outline-none focus:bg-background transition-all ${
                  errors.password ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                }`}
                placeholder="Tối thiểu 6 ký tự..."
                value={formValues.password}
                onChange={(e) => handleChange("password", e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m2 2 20 20" />
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-destructive font-medium mt-1.5 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          {/* 5. Confirm Password */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="regConfirmPassword">
              Nhập Lại Mật Khẩu <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
              <input
                id="regConfirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className={`w-full h-10.5 pl-10 pr-10 rounded-xl bg-secondary border text-foreground text-xs font-sans placeholder:text-muted-foreground focus:outline-none focus:bg-background transition-all ${
                  errors.confirmPassword
                    ? "border-destructive focus:border-destructive"
                    : "border-border focus:border-primary"
                }`}
                placeholder="Nhập lại mật khẩu vừa tạo..."
                value={formValues.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m2 2 20 20" />
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-destructive font-medium mt-1.5 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errors.confirmPassword}</span>
              </p>
            )}
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="mb-5">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground select-none leading-relaxed">
              <input
                type="checkbox"
                checked={formValues.termsAccepted}
                onChange={(e) => handleChange("termsAccepted", e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
              <span>
                Tôi đồng ý với{" "}
                <Link href="#" className="text-foreground hover:underline font-medium">
                  Điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link href="#" className="text-foreground hover:underline font-medium">
                  Chính sách bảo mật
                </Link>{" "}
                của TITANFIT Sports.
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="text-[11px] text-destructive font-medium mt-1.5 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errors.termsAccepted}</span>
              </p>
            )}
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary/90 transition-all shadow-md active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang Khởi Tạo Tài Khoản...</span>
              </>
            ) : (
              <span>Hoàn Tất Đăng Ký Tài Khoản</span>
            )}
          </button>
        </form>

        {/* Social Logins */}
        <div className="relative flex items-center justify-center my-6 before:content-[''] before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-border">
          <span className="relative z-10 px-3 bg-card text-[11px] text-muted-foreground font-medium">
            Hoặc đăng ký nhanh bằng
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 h-10 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold transition-all cursor-pointer"
            onClick={() => showToast("Tính năng đăng ký qua Google đang được kết nối", "info")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
              />
            </svg>
            <span>Google</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 h-10 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold transition-all cursor-pointer"
            onClick={() => showToast("Tính năng đăng ký qua Facebook đang được kết nối", "info")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook</span>
          </button>
        </div>

        {/* Switch to Login Link */}
        <div className="text-center mt-6 pt-4 border-t border-border/60 text-xs text-muted-foreground">
          Đã có tài khoản TITANFIT?{" "}
          <Link
            href={rawRedirect ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : "/login"}
            className="text-primary font-bold hover:underline ml-1"
          >
            Đăng nhập ngay &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-muted-foreground">Đang tải trang đăng ký...</p>
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
