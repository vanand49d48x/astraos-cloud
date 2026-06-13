import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken =
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value;

  // Unauthenticated → login
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Authenticated but onboarding not done → /onboarding
  // All dashboard routes require the astra_onboarded cookie.
  if (pathname.startsWith("/dashboard")) {
    const onboarded = request.cookies.get("astra_onboarded")?.value;
    if (!onboarded) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // Already onboarded → skip /onboarding
  if (pathname === "/onboarding") {
    const onboarded = request.cookies.get("astra_onboarded")?.value;
    if (onboarded) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/onboarding"],
};
