import http from "@/lib/http";
import { ApiResponse } from "@/types/api.type";
import { LoginRequest, RegisterRequest, UserResponse } from "@/types/auth.type";

export const authApiRequest = {
  login: (body: LoginRequest) => http.post<ApiResponse<UserResponse>>("/api/auth/login", body),
  register: (body: RegisterRequest) =>
    http.post<ApiResponse<UserResponse>>("/api/auth/register", body),
  logout: () => http.post<ApiResponse<void>>("/api/auth/logout"),
  me: (cookieHeader?: string) =>
    http.get<ApiResponse<UserResponse>>(
      "/api/auth/me",
      cookieHeader ? { headers: { Cookie: cookieHeader } } : {}
    ),
};

export default authApiRequest;
