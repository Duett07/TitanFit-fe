import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import AdminClientShell from "./AdminClientShell";
import { UserResponse } from "@/types/auth.type";

interface AdminLayoutProps {
  children: React.ReactNode;
}

function decodeJwt(token: string): {
  sub?: string;
  role?: string;
  fullName?: string;
  userId?: string;
  phone?: string;
  exp?: number;
} | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(exp?: number): boolean {
  if (!exp) return false;
  return exp < Math.floor(Date.now() / 1000);
}

export const instant = false;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await connection();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  // 1. If accessToken is missing, redirect to login
  if (!accessToken) {
    redirect("/login?redirect=/admin");
  }

  // 2. Decode JWT and verify role & expiration
  const decoded = decodeJwt(accessToken);

  if (!decoded || isTokenExpired(decoded.exp)) {
    redirect("/login?redirect=/admin");
  }

  // If user is not ROLE_ADMIN, redirect to home with error
  if (decoded.role !== "ROLE_ADMIN") {
    redirect("/?error=" + encodeURIComponent("Không có quyền truy cập"));
  }

  const user: UserResponse = {
    id: decoded.userId || "",
    fullName: decoded.fullName || "Quản Trị Viên",
    email: decoded.sub || "admin@titanfit.vn",
    role: "ROLE_ADMIN",
    phone: decoded.phone || "",
  };

  // 3. User is verified ROLE_ADMIN on the server
  return <AdminClientShell initialUser={user}>{children}</AdminClientShell>;
}
