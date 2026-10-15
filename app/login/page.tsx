"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import authApiRequest from "@/apiRequest/auth";
import { useAuthStore } from "@/stores/useAuthStore";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || searchParams.get("from");
  const setUser = useAuthStore((state) => state.setUser);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
    if (!identifier.trim()) {
      setErrorMessage("Vui lòng nhập email hoặc số điện thoại.");
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
        email: identifier.trim(),
        password: password,
      });

      if (res.data?.data) {
        const userData = res.data.data;
        setUser(userData);
        showToast(`Đăng nhập thành công! Xin chào ${userData.fullName}`, "success");

        // Navigate after storing session
        setTimeout(() => {
          if (userData.role === "ROLE_ADMIN") {
            router.push("/admin");
          } else if (redirectParam) {
            router.push(redirectParam);
          } else {
            router.push("/");
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
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200 ${toastMessage.type === "success"
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

        {/* Standard Login Form */}
        <form onSubmit={handleFormSubmit}>
          {/* Email / Identifier */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="loginIdentifier">
              Email
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-muted-foreground flex items-center pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                type="text"
                id="loginIdentifier"
                name="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@example.com hoặc 0987..."
                className="w-full h-11 pl-10 pr-3 rounded-lg bg-secondary border border-border text-foreground text-sm font-sans focus:outline-none focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-foreground mb-0" htmlFor="loginPassword">
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                id="loginPassword"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full h-11 pl-10 pr-10 rounded-lg bg-secondary border border-border text-foreground text-sm font-sans focus:outline-none focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
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
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2.5 mt-2 mb-6">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer shrink-0"
            />
            <label htmlFor="rememberMe" className="text-xs text-foreground cursor-pointer select-none">
              Ghi nhớ đăng nhập trên trình duyệt này
            </label>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            id="btnLoginSubmit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary/90 transition-all shadow-md active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang Xác Thực...</span>
              </>
            ) : (
              <span>Đăng Nhập Vào TITANFIT</span>
            )}
          </button>
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
            href="/register"
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
