import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const customerProtectedRoutes = ["/checkout", "/order-success", "/order-tracking", "/profile"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;

  // 1. Strict optimistic check for Admin Portal (/admin)
  // Ensures unauthenticated traffic is blocked before rendering.
  // Full cryptographic & role verification is executed by Server Component in app/admin/layout.tsx
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!accessToken) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete("accessToken");
      response.cookies.set("titanfit_clear_session", "1", {
        path: "/",
        maxAge: 30,
        httpOnly: false,
        sameSite: "lax",
      });
      return response;
    }
    return NextResponse.next();
  }

  // 2. Check general customer protected routes
  const isProtected = customerProtectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected) {
    if (!accessToken) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete("accessToken");
      response.cookies.set("titanfit_clear_session", "1", {
        path: "/",
        maxAge: 30,
        httpOnly: false,
        sameSite: "lax",
      });
      return response;
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
    "/profile/:path*",
  ],
};
