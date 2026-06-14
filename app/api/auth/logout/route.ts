import { NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";
const cookiePrefix = isProduction ? "__Secure-" : "";
const cookieDomain = isProduction ? ".astraos.cloud" : undefined;

// Vercel's CDN strips Set-Cookie headers from 3xx redirect responses before
// they reach the browser, so cookie deletions on redirects are silently dropped.
// We return a 200 HTML page instead and navigate via JS — browsers process
// Set-Cookie on 200 responses reliably, so the cookie is gone before the
// window.location.replace fires and the middleware sees no session on /login.
export function GET() {
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  const securePart = isProduction ? "; Secure" : "";
  const domainPart = cookieDomain ? `; Domain=${cookieDomain}` : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>window.location.replace('/login');</script><noscript><meta http-equiv="refresh" content="0;url=/login"></noscript></body></html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

  const baseNames = [
    "authjs.session-token",
    "authjs.callback-url",
    "authjs.csrf-token",
  ];

  for (const base of baseNames) {
    const names = cookiePrefix ? [`${cookiePrefix}${base}`, base] : [base];

    for (const name of names) {
      // Delete with domain (how Auth.js set it in production)
      response.headers.append(
        "Set-Cookie",
        `${name}=; Path=/; Expires=${expires}; HttpOnly${securePart}; SameSite=Lax${domainPart}`
      );
      // Also delete without domain in case of any mismatch
      if (cookieDomain) {
        response.headers.append(
          "Set-Cookie",
          `${name}=; Path=/; Expires=${expires}; HttpOnly${securePart}; SameSite=Lax`
        );
      }
    }
  }

  return response;
}
