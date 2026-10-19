import axios from "axios";
import envConfig from "@/config";
import { clearSession } from "@/lib/session";

const http = axios.create({
  baseURL: envConfig.NEXT_PUBLIC_API_ENDPOINT,
  timeout: 20000,
  withCredentials: true,
});

// ===== RESPONSE INTERCEPTOR =====
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If error is 401 (Unauthorized)
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";

      // 1. Skip global session wipe & redirect for auth attempt endpoints (e.g. wrong login credentials)
      const isAuthEndpoint =
        requestUrl.includes("/api/auth/login") || requestUrl.includes("/api/auth/register");

      if (!isAuthEndpoint && typeof window !== "undefined") {
        const pathname = window.location.pathname;
        const currentPath = `${pathname}${window.location.search}`;

        // Clear Zustand store, localStorage, and legacy cookies
        clearSession();

        // 2. Redirect to login for protected pages or explicit authenticated actions:
        // - If request was /api/auth/me, only redirect if currently on a protected route (avoid disrupting guests on public pages)
        // - For other protected API requests (e.g. /api/admin/*, /api/orders/*), always redirect
        const isMeEndpoint = requestUrl.includes("/api/auth/me");
        const isProtectedPage =
          pathname.startsWith("/admin") ||
          pathname.startsWith("/checkout") ||
          pathname.startsWith("/order-tracking") ||
          pathname.startsWith("/order-success");

        const shouldRedirect = !isMeEndpoint || isProtectedPage;

        if (shouldRedirect && !pathname.startsWith("/login") && !pathname.startsWith("/register")) {
          window.location.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
      }

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default http;
