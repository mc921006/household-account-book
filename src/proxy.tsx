import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const isLogin = request.cookies.get("accountBookLogin")?.value;
  const { pathname } = request.nextUrl;

  if (!isLogin && pathname.startsWith("/main")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (isLogin && (pathname === "/auth/login" || pathname === "/auth/signup")) {
    return NextResponse.redirect(new URL("/main", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/main/:path*", "/auth/login", "/auth/signup"],
};
