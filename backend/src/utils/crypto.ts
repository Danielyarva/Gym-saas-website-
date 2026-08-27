import { createHash, randomBytes } from 'node:crypto';

/** Generates the raw, URL-safe token to email/cookie to the client. Only its hash is ever stored. */
export function generateRawToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
