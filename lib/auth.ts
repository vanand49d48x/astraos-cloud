import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

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
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      } catch {
        return null;
      }
    },
  }),
];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: hasDatabase ? PrismaAdapter(prisma) : undefined,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }: any) {
      if (user) token.id = user.id;

      // Fetch/create team on first sign-in (Node.js only — Prisma available)
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
                  create: { userId: token.id as string, role: "owner" },
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
  },
});
