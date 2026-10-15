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

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  createdAt?: string;
  tier?: string;
}
