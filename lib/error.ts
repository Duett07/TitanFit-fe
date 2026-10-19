import axios from "axios";

export interface BackendErrorResponse {
  status?: number;
  message?: string;
  error?: string;
  data?: unknown;
  errors?: Record<string, string> | Array<{ field?: string; message?: string } | string>;
}

/**
 * Extracts a human-friendly error message from any error (AxiosError, Error, string, or unknown).
 *
 * @param error - The caught error object
 * @param fallback - Optional fallback message if no specific error string can be extracted
 * @returns Human-readable error message
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Đã có lỗi xảy ra. Vui lòng thử lại sau!"
): string {
  if (!error) return fallback;

  if (typeof error === "string") {
    return error.trim() || fallback;
  }

  if (axios.isAxiosError<BackendErrorResponse>(error)) {
    const data = error.response?.data;

    // 1. Direct message from backend payload
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message.trim();
    }

    // 2. data field as string message
    if (typeof data?.data === "string" && data.data.trim()) {
      return data.data.trim();
    }

    // 3. error field string
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error.trim();
    }

    // 4. HTTP status specific fallbacks
    if (error.response?.status === 401) {
      return "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.";
    }
    if (error.response?.status === 403) {
      return "Bạn không có quyền thực hiện thao tác này.";
    }
    if (error.response?.status === 404) {
      return "Dữ liệu yêu cầu không tồn tại.";
    }
    if (error.response?.status === 500) {
      return "Lỗi máy chủ nội bộ. Vui lòng thử lại sau ít phút.";
    }

    // 5. Network / timeout errors
    if (error.code === "ECONNABORTED" || error.message.toLowerCase().includes("timeout")) {
      return "Yêu cầu quá thời gian phản hồi (timeout). Vui lòng kiểm tra kết nối mạng!";
    }
    if (error.code === "ERR_NETWORK" || !error.response) {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng!";
    }

    if (error.message && typeof error.message === "string") {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/**
 * Extracts a map of field-specific validation errors from backend error payload (e.g. from GlobalExceptionHandler).
 *
 * @param error - The caught error object
 * @returns Map of field names to error messages, or null if no validation map is present
 */
export function getFieldErrors(error: unknown): Record<string, string> | null {
  if (!axios.isAxiosError<BackendErrorResponse>(error)) {
    return null;
  }

  const data = error.response?.data;
  if (!data) return null;

  // Case 1: data.data is an object with string values: { email: "...", password: "..." }
  if (
    data.data &&
    typeof data.data === "object" &&
    !Array.isArray(data.data) &&
    Object.keys(data.data).length > 0
  ) {
    const fieldMap: Record<string, string> = {};
    for (const [key, value] of Object.entries(data.data as Record<string, unknown>)) {
      if (typeof value === "string") {
        fieldMap[key] = value;
      }
    }
    if (Object.keys(fieldMap).length > 0) return fieldMap;
  }

  // Case 2: data.errors is an object: { email: "...", password: "..." }
  if (
    data.errors &&
    typeof data.errors === "object" &&
    !Array.isArray(data.errors) &&
    Object.keys(data.errors).length > 0
  ) {
    const fieldMap: Record<string, string> = {};
    for (const [key, value] of Object.entries(data.errors)) {
      if (typeof value === "string") {
        fieldMap[key] = value;
      }
    }
    if (Object.keys(fieldMap).length > 0) return fieldMap;
  }

  // Case 3: data.errors is an array of objects: [{ field: "email", message: "..." }]
  if (Array.isArray(data.errors)) {
    const fieldMap: Record<string, string> = {};
    for (const item of data.errors) {
      if (item && typeof item === "object" && "field" in item && "message" in item) {
        const field = (item as { field: string }).field;
        const msg = (item as { message: string }).message;
        if (typeof field === "string" && typeof msg === "string") {
          fieldMap[field] = msg;
        }
      }
    }
    if (Object.keys(fieldMap).length > 0) return fieldMap;
  }

  return null;
}
