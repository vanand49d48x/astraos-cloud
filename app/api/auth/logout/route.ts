import { NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";
const cookiePrefix = isProduction ? "__Secure-" : "";
const cookieDomain = isProduction ? ".astraos.cloud" : undefined;

// Custom logout route that hard-deletes the session cookie with the exact
// same name/domain/secure attributes that Auth.js used when setting it.
// The client-side signOut and server-action signOut both fail in some
// versions of next-auth beta when a custom cookie domain is configured.
export function GET(request: Request) {
  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url);

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: isProduction,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    maxAge: 0,
    expires: new Date(0),
  };

  // Delete all Auth.js cookies that could hold a session
  response.cookies.set(`${cookiePrefix}authjs.session-token`, "", cookieOptions);
  response.cookies.set(`${cookiePrefix}authjs.callback-url`, "", cookieOptions);
  response.cookies.set(`${cookiePrefix}authjs.csrf-token`, "", cookieOptions);
  // Also clear without prefix in case of mismatch
  response.cookies.set("authjs.session-token", "", { ...cookieOptions, secure: false });

  return response;
}
