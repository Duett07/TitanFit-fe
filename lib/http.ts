import axios from "axios";
import envConfig from "@/config";
import { clearSession } from "@/lib/session";

const http = axios.create({
  baseURL: envConfig.NEXT_PUBLIC_API_ENDPOINT,
  timeout: 20000,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

// ===== REQUEST INTERCEPTOR =====
// Credentials (HttpOnly cookies) are automatically attached by the browser
http.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// ===== RESPONSE INTERCEPTOR =====
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized with token refresh rotation
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const requestUrl = originalRequest.url || "";

      // Do not attempt refresh on auth endpoints
      if (
        requestUrl.includes("/api/auth/login") ||
        requestUrl.includes("/api/auth/register") ||
        requestUrl.includes("/api/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      // If a refresh is already in progress, enqueue this request
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => http(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        processQueue(null);
        return http(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr);

        if (typeof window !== "undefined") {
          clearSession();
          const pathname = window.location.pathname;
          if (!pathname.startsWith("/login") && !pathname.startsWith("/register")) {
            const currentPath = `${pathname}${window.location.search}`;
            window.location.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
          }
        }

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default http;
