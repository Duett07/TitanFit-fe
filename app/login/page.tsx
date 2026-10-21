"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import authApiRequest from "@/apiRequest/auth";
import { useAuthStore, clearSession } from "@/stores/useAuthStore";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { getSafeRedirect } from "@/lib/security";
import { getErrorMessage } from "@/lib/error";
import { Button, Toast } from "@/components/ui";

function LoginFormContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || searchParams.get("from");
  const redirectTarget = getSafeRedirect(rawRedirect);
  const setUser = useAuthStore((state) => state.setUser);

  // If arriving at login with a redirect target (meaning server rejected session),
  // or if local storage still has old credentials while on login page,
  // clear the stale session immediately to keep Navbar and storage in sync with server state.
  useEffect(() => {
    if (rawRedirect || useAuthStore.getState().isAuthenticated) {
      clearSession();
    }
  }, [rawRedirect]);

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
      const message = getErrorMessage(
        err,
        "Email hoặc mật khẩu không chính xác. Vui lòng thử lại."
      );
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
