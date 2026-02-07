import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

const hasDatabase = !!process.env.DATABASE_URL;

const providers: any[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!hasDatabase) return null;
      if (!credentials?.email || !credentials?.password) return null;

      const email = credentials.email as string;
      const password = credentials.password as string;

      try {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      } catch {
        return null;
      }
    },
  }),
];

// Only add OAuth providers if credentials are configured
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ||
  process.env.AUTH_URL?.startsWith("https://");
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const hostName = new URL(
  process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000"
).hostname;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: hasDatabase ? PrismaAdapter(prisma) : undefined,
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  cookies: {
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: useSecureCookies,
      },
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    nonce: {
      name: `${cookiePrefix}next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }

      // On sign in, ensure user has a default team
      if (trigger === "signIn" && token.id && hasDatabase) {
        try {
          const teamMember = await prisma.teamMember.findFirst({
            where: { userId: token.id as string },
            include: { team: true },
          });

          if (!teamMember) {
            const team = await prisma.team.create({
              data: {
                name: "My Team",
                members: {
                  create: {
                    userId: token.id as string,
                    role: "owner",
                  },
                },
              },
            });
            token.teamId = team.id;
          } else {
            token.teamId = teamMember.teamId;
          }
        } catch {
          // DB not available — skip team setup
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      if (token.teamId) {
        (session as any).teamId = token.teamId as string;
      }
      return session;
    },
  },
});
