export interface LoginRequest {
  email?: string;
  username?: string;
  password?: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  password?: string;
}

export type UserRole = "ROLE_ADMIN" | "ROLE_USER";

export interface UserAddress {
  id: string;
  recipientName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward?: string;
  detailedAddress: string;
  isDefault: boolean;
  label?: "Nhà Riêng" | "Văn Phòng" | "Khác";
}

export type CreateAddressRequest = Omit<UserAddress, "id">;
export type UpdateAddressRequest = Partial<Omit<UserAddress, "id">>;

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  createdAt?: string;
  tier?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  addresses?: UserAddress[];
  rewardPoints?: number;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface AuthResponse extends UserResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
}
