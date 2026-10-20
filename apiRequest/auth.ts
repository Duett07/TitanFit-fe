import http from "@/lib/http";
import { ApiResponse } from "@/types/api.type";
import {
  LoginRequest,
  RegisterRequest,
  UserResponse,
  AuthResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserAddress,
  CreateAddressRequest,
  UpdateAddressRequest,
} from "@/types/auth.type";

export const authApiRequest = {
  login: (body: LoginRequest) => http.post<ApiResponse<AuthResponse>>("/api/auth/login", body),
  register: (body: RegisterRequest) =>
    http.post<ApiResponse<UserResponse>>("/api/auth/register", body),
  refreshToken: () => http.post<ApiResponse<AuthResponse>>("/api/auth/refresh"),
  logout: () => http.post<ApiResponse<void>>("/api/auth/logout"),
  updateProfile: (body: UpdateProfileRequest) =>
    http.put<ApiResponse<UserResponse>>("/api/auth/profile", body),
  changePassword: (body: ChangePasswordRequest) =>
    http.post<ApiResponse<void>>("/api/auth/change-password", body),
  getAddresses: () => http.get<ApiResponse<UserAddress[]>>("/api/users/addresses"),
  createAddress: (body: CreateAddressRequest) =>
    http.post<ApiResponse<UserAddress>>("/api/users/addresses", body),
  updateAddress: (id: string, body: UpdateAddressRequest) =>
    http.put<ApiResponse<UserAddress>>(`/api/users/addresses/${id}`, body),
  deleteAddress: (id: string) => http.delete<ApiResponse<void>>(`/api/users/addresses/${id}`),
  setDefaultAddress: (id: string) =>
    http.patch<ApiResponse<UserAddress>>(`/api/users/addresses/${id}/default`),
};

export default authApiRequest;
