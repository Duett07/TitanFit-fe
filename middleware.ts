import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/checkout", "/order-success", "/order-tracking"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Strict Check for Admin Portal (/admin)
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const isAuth = request.cookies.get("is_authenticated")?.value === "true";
    const userRole = request.cookies.get("user_role")?.value;

    if (!isAuth) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(redirectUrl);
    }

    if (userRole && userRole !== "ROLE_ADMIN") {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("error", "Không có quyền truy cập");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. Check general customer protected routes
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected) {
    const isAuth = request.cookies.get("is_authenticated")?.value === "true";

    if (!isAuth) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/checkout/:path*",
    "/order-success/:path*",
    "/order-tracking/:path*",
  ],
};

