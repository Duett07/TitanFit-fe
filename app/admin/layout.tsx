import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import authApiRequest from "@/apiRequest/auth";
import AdminClientShell from "./AdminClientShell";
import { UserResponse } from "@/types/auth.type";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const instant = false;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  // 1. If accessToken is missing, redirect to login
  if (!accessToken) {
    redirect("/login?redirect=/admin");
  }

  // 2. Verify real session & ROLE_ADMIN with backend
  let user: UserResponse | null = null;
  try {
    const res = await authApiRequest.me(cookieStore.toString());
    user = res.data?.data || null;
  } catch {
    // If backend returns 401 or network error, session is invalid
    user = null;
  }

  // If session is invalid or user not found, redirect to login
  if (!user) {
    redirect("/login?redirect=/admin");
  }

  // If user is not ROLE_ADMIN, redirect to home with error
  if (user.role !== "ROLE_ADMIN") {
    redirect("/?error=" + encodeURIComponent("Không có quyền truy cập"));
  }

  // 3. User is verified ROLE_ADMIN on the server
  return <AdminClientShell initialUser={user}>{children}</AdminClientShell>;
}
