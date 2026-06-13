import type { NextAuthConfig } from "next-auth";

const isProduction = process.env.NODE_ENV === "production";
const useSecureCookies = isProduction;
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const cookieDomain = isProduction ? ".astraos.cloud" : undefined;

/**
 * Edge-safe auth config — no Prisma imports, used by middleware.
 * The full auth.ts extends this with providers + PrismaAdapter.
 */
export const authConfig = {
  providers: [],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  trustHost: true,
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: useSecureCookies,
        domain: cookieDomain,
        maxAge: 30 * 24 * 60 * 60,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "none" as const,
        path: "/",
        secure: useSecureCookies,
        domain: cookieDomain,
      },
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: useSecureCookies,
        domain: cookieDomain,
      },
    },
    nonce: {
      name: `${cookiePrefix}next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: "none" as const,
        path: "/",
        secure: useSecureCookies,
        domain: cookieDomain,
      },
    },
  },
  callbacks: {
    jwt({ token, user }: any) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }: any) {
      if (token.id) session.user.id = token.id as string;
      if (token.teamId) (session as any).teamId = token.teamId as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
