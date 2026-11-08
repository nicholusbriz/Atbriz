'use client';

/**
 * Frontend auth — the single file client components use.
 *
 * Wrap your app once in <SessionProvider> (done in components/providers.tsx),
 * then anywhere:
 *
 *   const { user, isAuthenticated, isLoading } = useAuth();
 *
 *   <RequireAuth fallback={<SignInPrompt />}>
 *     <ProtectedSection />
 *   </RequireAuth>
 *
 *   await signIn('credentials', { identifier, password, redirect: false });
 *   await signOut();
 */
import {
  SessionProvider,
  useSession,
  signIn,
  signOut,
} from 'next-auth/react';
import { useEffect, useState, type ReactNode } from 'react';

export { SessionProvider, signIn, signOut };

export function useAuth() {
  const { data: session, status } = useSession();
  return {
    user: session?.user ?? null,
    status, // 'loading' | 'authenticated' | 'unauthenticated'
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}

export function RequireAuth({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <>{fallback}</>;
  return <>{children}</>;
}

interface AccessData {
  role: string;
  pages: string[];
  permissions: string[];
  email?: string | null;
  location?: Record<string, string | null>;
}

// Shared cache — one fetch per session, reused by every useAccess() instance
let accessCache: AccessData | null = null;
let accessPromise: Promise<AccessData | null> | null = null;

function fetchAccess(): Promise<AccessData | null> {
  if (accessCache) return Promise.resolve(accessCache);
  if (!accessPromise) {
    accessPromise = fetch('/api/me/pages', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          accessCache = {
            role: data.role ?? 'user',
            pages: data.pages ?? [],
            permissions: data.permissions ?? [],
            email: data.email ?? null,
            location: data.location,
          };
        }
        return accessCache;
      })
      .catch(() => null)
      .finally(() => { accessPromise = null; });
  }
  return accessPromise;
}

function clearAccessCache() {
  accessCache = null;
  accessPromise = null;
}

/**
 * Current user's access map — gated pages + permissions for their role.
 * dev implicitly gets everything (enforced server-side in /api/me/pages).
 * Fetched once per session and cached — navigation doesn't re-hit the API.
 */
export function useAccess() {
  const { status } = useSession();
  const [access, setAccess] = useState<AccessData | null>(accessCache);

  useEffect(() => {
    if (status !== 'authenticated') {
      clearAccessCache();
      setAccess(null);
      return;
    }
    if (accessCache) {
      setAccess(accessCache);
      return;
    }
    let active = true;
    fetchAccess().then((data) => {
      if (active && data) setAccess(data);
    });
    return () => { active = false; };
  }, [status]);

  const permissions = new Set(access?.permissions ?? []);
  return {
    role: access?.role ?? null,
    isLoading: status === 'loading' || (status === 'authenticated' && access === null),
    can: (permission: string) => permissions.has(permission),
  };
}

/** Admin-only variant of RequireAuth (role 'admin' or 'dev'). */
export function RequireAdmin({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || !['admin', 'dev'].includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
}
