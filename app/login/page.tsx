"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import authApiRequest from "@/apiRequest/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { getSafeRedirect } from "@/lib/security";
import { Button, Toast } from "@/components/ui";

function LoginFormContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || searchParams.get("from");
  const redirectTarget = getSafeRedirect(rawRedirect);
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLoginSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Vui lòng nhập địa chỉ email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Địa chỉ email không đúng định dạng (ví dụ: name@example.com).");
      return;
    }

    if (!password) {
      setErrorMessage("Vui lòng nhập mật khẩu.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await authApiRequest.login({
        email: trimmedEmail,
        password: password,
      });

      if (res.data?.data) {
        const userData = res.data.data;
        queryClient.setQueryData(queryKeys.auth.session(), userData);
        setUser(userData);
        showToast(`Đăng nhập thành công! Xin chào ${userData.fullName}`, "success");

        // Navigate after storing session
        setTimeout(() => {
          if (userData.role === "ROLE_ADMIN") {
            router.push(redirectTarget.startsWith("/admin") ? redirectTarget : "/admin");
          } else {
            router.push(redirectTarget);
          }
        }, 350);
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        axiosErr.response?.data?.message ||
        "Email hoặc mật khẩu không chính xác. Vui lòng thử lại.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLoginSubmit();
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 px-4 sm:py-16">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          text={toastMessage.text}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="w-full max-w-[440px] bg-card border border-border rounded-2xl p-7 sm:p-9 shadow-xl backdrop-blur-md">
        {/* Card Brand Header */}
        <div className="text-center mb-5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-primary/10 text-primary mb-3">
            TITANFIT ATHLETE CLUB
          </span>
          <h1 className="text-2xl font-extrabold text-foreground font-heading mb-1.5 text-center tracking-tight">
            Đăng Nhập Tài Khoản
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground text-center mb-6 leading-relaxed">
            Theo dõi đơn hàng, tích lũy điểm thưởng và nhận thông báo ưu đãi độc quyền.
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Standard Login Form */}
        <form onSubmit={handleFormSubmit}>
          {/* Email */}
          <div className="mb-4">
            <label
              className="block text-xs font-semibold text-foreground mb-1.5"
              htmlFor="loginEmail"
            >
              Email
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-muted-foreground flex items-center pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                id="loginEmail"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-secondary border border-border text-foreground text-sm font-sans focus:outline-none focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1.5">
              <label
                className="block text-xs font-semibold text-foreground mb-0"
                htmlFor="loginPassword"
              >
                Mật khẩu
              </label>
              <button
                type="button"
                onClick={() =>
                  showToast("Tính năng khôi phục mật khẩu qua SMS OTP đang được hoàn thiện", "info")
                }
                className="text-xs text-primary font-medium hover:underline bg-transparent border-none cursor-pointer p-0"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-muted-foreground flex items-center pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                id="loginPassword"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-secondary border border-border text-foreground text-sm font-sans focus:outline-none focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer flex items-center p-1 transition-colors"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit CTA */}
          <Button
            type="submit"
            id="btnLoginSubmit"
            isLoading={isLoading}
            variant="primary"
            className="w-full h-11 text-sm shadow-md"
          >
            Đăng Nhập Vào TITANFIT
          </Button>
        </form>

        {/* Social Logins */}
        <div className="relative flex items-center justify-center my-6 before:content-[''] before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-border">
          <span className="relative z-10 px-3 bg-card text-[11px] text-muted-foreground font-medium">
            Hoặc tiếp tục với
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 h-10 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold transition-all cursor-pointer"
            onClick={() => showToast("Tính năng đăng nhập qua Google đang được tích hợp", "info")}
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
            onClick={() => showToast("Tính năng đăng nhập qua Facebook đang được tích hợp", "info")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook</span>
          </button>
        </div>

        {/* Switch to Register Link */}
        <div className="text-center mt-6 pt-4 border-t border-border/60 text-xs text-muted-foreground">
          Chưa có tài khoản TITANFIT?{" "}
          <Link
            href={
              rawRedirect ? `/register?redirect=${encodeURIComponent(redirectTarget)}` : "/register"
            }
            className="text-primary font-bold hover:underline ml-1"
          >
            Đăng ký ngay &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4">
          <div className="w-10 h-10 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-muted-foreground">Đang tải trang đăng nhập...</p>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
