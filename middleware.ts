import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/checkout", "/order-success", "/order-tracking"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Check if current route is protected
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
    "/checkout/:path*",
    "/order-success/:path*",
    "/order-tracking/:path*",
  ],
};
