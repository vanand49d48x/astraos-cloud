import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

// Use Auth.js's own middleware wrapper so it validates the JWT and refreshes
// the session cookie with the correct Max-Age on every request.
// This is what actually makes the session persistent across browser closes.
const { auth } = NextAuth(authConfig);

export default auth((req: any) => {
  const pathname = req.nextUrl.pathname as string;
  const session = req.auth; // populated by Auth.js after JWT validation

  // Unauthenticated → login
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Authenticated but onboarding not done → /onboarding
  if (pathname.startsWith("/dashboard")) {
    const onboarded = req.cookies.get("astra_onboarded")?.value;
    if (!onboarded) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // Already onboarded → skip /onboarding
  if (pathname === "/onboarding") {
    const onboarded = req.cookies.get("astra_onboarded")?.value;
    if (onboarded) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/onboarding"],
};
