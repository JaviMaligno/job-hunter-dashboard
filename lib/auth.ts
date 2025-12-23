import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import LinkedIn from "next-auth/providers/linkedin"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Helper to decode JWT and extract user ID
function extractUserIdFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())
    return decoded.sub || null
  } catch {
    return null
  }
}

// Gmail scopes to request when signing in with Google
const GMAIL_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
]

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          scope: GMAIL_SCOPES.join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    LinkedIn({
      clientId: process.env.AUTH_LINKEDIN_ID!,
      clientSecret: process.env.AUTH_LINKEDIN_SECRET!,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            return null
          }

          const data = await response.json()

          // Extract user ID from the JWT token
          const userId = extractUserIdFromToken(data.access_token)

          return {
            id: userId || credentials.email as string,
            email: credentials.email as string,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // For Google OAuth, also set up Gmail access with the same tokens
        if (account.provider === "google" && account.access_token) {
          try {
            // Register user and store Gmail tokens in the backend
            const response = await fetch(`${API_URL}/api/auth/google-login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                image: user.image,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                scope: account.scope,
              }),
            })

            if (response.ok) {
              const data = await response.json()
              return {
                ...token,
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                provider: account.provider,
                user: {
                  id: data.user_id,
                  email: user.email,
                  name: user.name,
                  image: user.image,
                },
              }
            }
          } catch (error) {
            console.error("Google login backend error:", error)
          }

          // Fallback if backend call fails
          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            provider: account.provider,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            },
          }
        }

        // For other OAuth providers
        if (account.provider !== "credentials") {
          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            provider: account.provider,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            },
          }
        }

        // For credentials, we already have our tokens
        return {
          ...token,
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          provider: "credentials",
          user: {
            id: user.id,
            email: user.email,
          },
        }
      }

      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken,
        user: {
          ...session.user,
          id: (token.user as any)?.id,
        },
      }
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
})

// Type augmentation for session
declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      id?: string
      email?: string | null
      name?: string | null
      image?: string | null
    }
  }
}
