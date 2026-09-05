import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicAuth = path === "/sign-in" || path === "/sign-up" || path === "/verify-email";
  const isProtected = path.startsWith("/dashboard") || path.startsWith("/admin");
  const hasSession = Boolean(request.cookies.get("accessToken")?.value);

  if (isPublicAuth && hasSession) return NextResponse.redirect(new URL("/dashboard", request.url));
  if (isProtected && !hasSession) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("reason", "authentication-required");
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)"] };
