import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const protectedRoutes = ["/dashboard", "/groups", "/insights", "/settlements"];
const authRoutes = ["/login", "/register"];

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const decoded = token ? verifyToken(token) : null;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  if (isProtected && !decoded) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));
  if (isAuthRoute && decoded) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
