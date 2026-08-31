import { NextResponse, type NextRequest } from "next/server";

// Optimistic redirect only — real auth checks happen server-side in each page.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("session");
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/cart",
    "/checkout/:path*",
    "/orders/:path*",
    "/custom-cakes",
  ],
};
