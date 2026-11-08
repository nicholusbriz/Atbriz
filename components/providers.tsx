'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { SessionProvider } from '@/lib/auth-client';

/** When the server invalidates a session (role change / global logout),
 *  the session flips to unauthenticated — clear the stale cookie too. */
function SessionWatcher({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const prev = useRef(status);

  useEffect(() => {
    if (prev.current === 'authenticated' && status === 'unauthenticated') {
      signOut({ redirect: false });
    }
    prev.current = status;
  }, [status]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionWatcher>{children}</SessionWatcher>
    </SessionProvider>
  );
}
