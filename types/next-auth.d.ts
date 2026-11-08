import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username?: string;
      role: string;
      iat?: number;
    } & DefaultSession['user'];
  }

  interface User {
    username?: string;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    username?: string;
    role?: string;
  }
}
