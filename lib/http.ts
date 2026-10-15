import axios from "axios";
import envConfig from "@/config";

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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
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

    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || "";
      if (
        url.includes("/login") ||
        url.includes("/register") ||
        url.includes("/refresh")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return http(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await http.post(
          `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );

        processQueue(null);
        return http(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr);

        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
        }

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
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
