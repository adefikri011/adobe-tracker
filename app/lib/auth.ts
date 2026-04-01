import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { prisma } from "./prisma"

// Log environment setup
if (typeof window === 'undefined') {
  console.log("NextAuth setup:")
  console.log("- NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "✓ Set" : "✗ Missing")
  console.log("- NEXTAUTH_URL:", process.env.NEXTAUTH_URL)
  console.log("- GitHub ID:", process.env.GITHUB_ID ? "✓ Set" : "✗ Missing")
  console.log("- Google ID:", process.env.GOOGLE_CLIENT_ID ? "✓ Set" : "✗ Missing")
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-key-change-in-production",
  basePath: "/api/auth",
  trustHost: true,
  providers: [
    ...(process.env.GITHUB_ID ? [GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET || "",
    })] : []),
    ...(process.env.GOOGLE_CLIENT_ID ? [Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    })] : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = "user"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        // @ts-ignore
        session.user.role = token.role
      }
      return session
    },
    async signIn({ user, account, profile }) {
      try {
        if (!user.email) return false
        
        // Sync or create user in database
        await prisma.profile.upsert({
          where: { email: user.email },
          update: {
            fullName: user.name || undefined,
          },
          create: {
            id: `user_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
            email: user.email,
            fullName: user.name,
            role: "user",
          }
        })
        return true
      } catch (error) {
        console.error("SignIn callback error:", error)
        return true
      }
    }
  }
})