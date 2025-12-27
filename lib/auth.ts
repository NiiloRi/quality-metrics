import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser, updateUserSubscription, getUserByUsername } from './db';
import { notifyNewUser } from './notifications';

// Extend the session type to include subscription info
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      subscriptionTier: 'free' | 'trial' | 'premium';
      trialEndsAt: string | null;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = credentials.username as string;
        const password = credentials.password as string;

        try {
          const user = await getUserByUsername(username);
          if (!user || !user.password_hash) {
            return null;
          }

          const isValid = await bcrypt.compare(password, user.password_hash);
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.username,
          };
        } catch (error) {
          console.error('Credentials auth error:', error);
          return null;
        }
      }
    }),
    // Google OAuth disabled temporarily - will be re-enabled later
    // Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Credentials users already exist in DB, just allow sign in
      if (account?.provider === 'credentials') {
        return true;
      }

      // Google OAuth flow (disabled for now, but keeping the logic)
      try {
        const existingUser = await getUserByEmail(user.email);

        if (!existingUser) {
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + 14);

          await createUser({
            id: crypto.randomUUID(),
            email: user.email,
            name: user.name || null,
            image: user.image || null,
            subscriptionTier: 'trial',
            trialEndsAt: trialEndsAt.toISOString(),
          });

          notifyNewUser({
            email: user.email,
            name: user.name || null,
            subscriptionTier: 'trial',
            trialEndsAt: trialEndsAt.toISOString(),
          }).catch(console.error);
        }

        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return true;
      }
    },

    async session({ session, token }) {
      if (session.user?.email) {
        try {
          const dbUser = await getUserByEmail(session.user.email);

          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.trialEndsAt = dbUser.trial_ends_at;

            // Check if trial has expired
            if (dbUser.subscription_tier === 'trial' && dbUser.trial_ends_at) {
              const trialEnd = new Date(dbUser.trial_ends_at);
              if (trialEnd < new Date()) {
                session.user.subscriptionTier = 'free';
                // Update in DB
                await updateUserSubscription(dbUser.id, 'free');
              } else {
                session.user.subscriptionTier = 'trial';
              }
            } else {
              session.user.subscriptionTier = dbUser.subscription_tier as 'free' | 'trial' | 'premium';
            }
          } else {
            session.user.subscriptionTier = 'free';
            session.user.trialEndsAt = null;
          }
        } catch (error) {
          console.error('Session error:', error);
          session.user.subscriptionTier = 'free';
          session.user.trialEndsAt = null;
        }
      }

      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});

// Helper to check if user has premium access
export function hasPremiumAccess(subscriptionTier: string): boolean {
  return subscriptionTier === 'trial' || subscriptionTier === 'premium';
}
