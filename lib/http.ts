import axios from "axios";
import envConfig from "@/config";
import { clearSession } from "@/lib/session";

export type EntityErrorPayload = {
  message: string;
  errors: { field: string; message: string }[];
};

export class HttpError extends Error {
  status: number;
  payload: {
    message: string;
    [key: string]: unknown;
  };

  constructor({ status, payload }: { status: number; payload: unknown }) {
    super("HTTP Error");
    this.status = status;
    this.payload = payload as { message: string; [key: string]: unknown };
  }
}

export class EntityError extends HttpError {
  status: 422;
  override payload: EntityErrorPayload;

  constructor({
    status,
    payload,
  }: {
    status: 422;
    payload: EntityErrorPayload;
  }) {
    super({ status, payload });
    this.status = status;
    this.payload = payload;
  }
}

const http = axios.create({
  baseURL: envConfig.NEXT_PUBLIC_API_ENDPOINT,
  timeout: 20000,
  withCredentials: true,
});

// ===== REQUEST INTERCEPTOR =====
http.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

// ===== RESPONSE INTERCEPTOR =====
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("🔥 [AXIOS DEBUG] Lỗi nhận được:", {
        status: error?.response?.status,
        message: error?.message,
        url: error?.config?.url,
      });
    }

    // If error is 401 (Unauthorized)
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";

      // 1. Skip global session wipe & redirect for auth attempt endpoints (e.g. wrong login credentials)
      const isAuthEndpoint =
        requestUrl.includes("/api/auth/login") ||
        requestUrl.includes("/api/auth/register");

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

        if (
          shouldRedirect &&
          !pathname.startsWith("/login") &&
          !pathname.startsWith("/register")
        ) {
          window.location.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
      }

      return Promise.reject(error);
    }

    // Throw out EntityError if it's 422
    if (error.response?.status === 422) {
      return Promise.reject(
        new EntityError({
          status: 422,
          payload: error.response.data as EntityErrorPayload,
        }),
      );
    }

    return Promise.reject(error);
  },
);

export default http;

export const isClient = () => typeof window !== "undefined";
