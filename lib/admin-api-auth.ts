import { timingSafeEqual } from 'crypto';

export function hasAdminApiAccess(request: Request): boolean {
  const expectedKey = process.env.ADMIN_API_KEY;
  const authorization = request.headers.get('authorization');
  const suppliedKey = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!expectedKey || !suppliedKey) return false;

  const expected = Buffer.from(expectedKey);
  const supplied = Buffer.from(suppliedKey);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
