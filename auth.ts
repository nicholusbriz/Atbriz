import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';
import Role from '@/models/Role';
import Setting from '@/models/Setting';
import { logActivity } from '@/lib/activity-log';
import { getBlockStatus, recordFail, clearFails } from '@/lib/login-throttle';

// Cache the global session cutoff for 30s — it changes rarely.
let cutoffCache: { value: number; expires: number } | null = null;
async function getSessionsValidAfter(): Promise<number> {
  if (cutoffCache && cutoffCache.expires > Date.now()) return cutoffCache.value;
  await connectDB();
  const doc = await Setting.findOne({ key: 'sessionsValidAfter' }).select('value').lean();
  const value = doc?.value instanceof Date ? doc.value.getTime() : 0;
  cutoffCache = { value, expires: Date.now() + 30_000 };
  return value;
}

/** Call after updating sessionsValidAfter so the change applies immediately. */
export function bustSessionsCache() {
  cutoffCache = null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/#login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Username or email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = String(credentials?.identifier ?? '').trim().toLowerCase();
        const password = String(credentials?.password ?? '');
        if (!identifier || !password) return null;

        await connectDB();

        // Blocked after too many failed attempts (12h)
        const block = await getBlockStatus(identifier);
        if (block.blocked) {
          logActivity({ type: 'auth.login_failed', action: `Blocked login attempt: ${identifier}`, actorName: identifier });
          return null;
        }

        // '@' → email lookup; otherwise username (usernames can't contain '@')
        const user = await (identifier.includes('@')
          ? User.findOne({ email: identifier })
          : User.findOne({ username: identifier })
        ).select('+passwordHash');
        if (!user) {
          await recordFail(identifier);
          logActivity({ type: 'auth.login_failed', action: `Failed login: ${identifier}`, actorName: identifier });
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await recordFail(identifier);
          logActivity({ type: 'auth.login_failed', action: `Failed login: ${identifier}`, actorName: identifier });
          return null;
        }

        await clearFails(identifier);

        const role = await Role.findById(user.role).select('name').lean();

        logActivity({
          type: 'auth.login',
          action: `User "${user.username}" signed in`,
          actorId: user._id,
          actorName: user.username,
        });

        return {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: role?.name ?? 'user',
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.username = user.username ?? undefined;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user || !token.userId) return session;

      // Reject stale tokens: issued before the user's last role change,
      // or before the global "log out all users" timestamp.
      // 'dev' is exempt — it can never be logged out.
      try {
        await connectDB();
        const iatMs = (token.iat ?? 0) * 1000;
        const dbUser = await User.findById(token.userId).select('roleChangedAt').lean();
        const invalidBefore = await getSessionsValidAfter();

        const stale =
          !dbUser ||
          (token.role !== 'dev' &&
            ((dbUser.roleChangedAt && dbUser.roleChangedAt.getTime() > iatMs) ||
              invalidBefore > iatMs));
        if (stale) return {} as typeof session;
      } catch {
        return {} as typeof session; // fail closed on DB errors
      }

      session.user.id = token.userId as string;
      session.user.username = token.username as string | undefined;
      session.user.role = (token.role as string) ?? 'user';
      session.user.iat = token.iat;
      return session;
    },
  },
});

export type SessionUser = {
  id: string;
  username?: string;
  email?: string;
  role: string;
};

/**
 * Server-side: returns the current session user or null.
 * - Verifies the JWT on every call.
 * - Resolves the role live from Mongo (role changes apply instantly).
 * - Rejects tokens issued before the user's last role change
 *   (roleChangedAt) → forces re-login with the new role.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;

  try {
    await connectDB();
    const dbUser = await User.findById(user.id).select('role roleChangedAt').lean();
    if (!dbUser) return null;

    const iat = user.iat ? user.iat * 1000 : 0;
    if (dbUser.roleChangedAt && iat && dbUser.roleChangedAt.getTime() > iat) {
      return null; // role changed after this token was issued → force re-login
    }

    const role = await Role.findById(dbUser.role).select('name').lean();
    return {
      id: user.id,
      username: user.username,
      email: user.email ?? undefined,
      role: role?.name ?? 'user',
    };
  } catch {
    return null;
  }
}

export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}
