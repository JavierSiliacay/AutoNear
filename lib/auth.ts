import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      try {
        const userEmail = user.email.toLowerCase().trim()
        const userName = user.name || "TaraFix User"
        const avatarUrl = user.image || null

        // Sync or ensure user profile exists in Supabase
        const { data: existingUser } = await supabase
          .from("users")
          .select("id, email")
          .eq("email", userEmail)
          .single()

        if (!existingUser) {
          await supabase.from("users").insert([
            {
              email: userEmail,
              full_name: userName,
              avatar_url: avatarUrl,
              created_at: new Date().toISOString(),
            },
          ])
        } else if (avatarUrl) {
          await supabase
            .from("users")
            .update({ avatar_url: avatarUrl, full_name: userName })
            .eq("email", userEmail)
        }
      } catch (err) {
        console.error("NextAuth Supabase Sync Error:", err)
      }

      return true
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
      }
      return token
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "tarafix-secure-nextauth-secret-key-2026",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
