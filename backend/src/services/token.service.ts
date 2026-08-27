import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env, isProduction } from '../config/env';
import { refreshTokenRepository } from '../repositories/refresh-token.repository';
import { generateRawToken, hashToken } from '../utils/crypto';
import { AppError } from '../utils/app-error';
import { ACCESS_TOKEN_COOKIE_NAME } from '../middleware/authenticate';
import { CSRF_COOKIE_NAME } from '../middleware/csrf';

export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';
export const REFRESH_TOKEN_COOKIE_PATH = '/api/auth/refresh';

interface TokenSubject {
  id: string;
  role: Role;
  email: string;
}

function accessTokenTtlMs() {
  return env.ACCESS_TOKEN_TTL_MINUTES * 60 * 1000;
}

function refreshTokenTtlMs() {
  return env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
}

function signAccessToken(user: TokenSubject): string {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.JWT_ACCESS_SECRET, {
    expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`,
  });
}

async function issueRefreshToken(userId: string, userAgent?: string, ipAddress?: string) {
  const rawToken = generateRawToken();
  const expiresAt = new Date(Date.now() + refreshTokenTtlMs());

  await refreshTokenRepository.create({ userId, tokenHash: hashToken(rawToken), expiresAt, userAgent, ipAddress });

  return { rawToken, expiresAt };
}

/**
 * Verifies and rotates a refresh token. If the presented token was already
 * revoked (i.e. it's a replay of a token that was already rotated away),
 * every refresh token for that user is revoked and SESSION_REVOKED is
 * thrown — this is the theft-detection signal that forces a full re-login.
 */
async function rotateRefreshToken(rawToken: string, userAgent?: string, ipAddress?: string) {
  const tokenHash = hashToken(rawToken);
  const existing = await refreshTokenRepository.findByTokenHash(tokenHash);

  if (!existing) {
    throw new AppError('TOKEN_INVALID', 'Invalid refresh token');
  }

  if (existing.revokedAt || existing.expiresAt < new Date()) {
    if (existing.revokedAt) {
      await refreshTokenRepository.revokeAllForUser(existing.userId);
    }
    throw new AppError('SESSION_REVOKED', 'Session expired or revoked. Please log in again.');
  }

  const newRawToken = generateRawToken();
  const newExpiresAt = new Date(Date.now() + refreshTokenTtlMs());

  await refreshTokenRepository.rotate(tokenHash, hashToken(newRawToken), newExpiresAt, existing.userId, userAgent, ipAddress);

  return { userId: existing.userId, rawToken: newRawToken, expiresAt: newExpiresAt };
}

function cookieBaseOptions() {
  return { httpOnly: true, secure: isProduction, path: '/' } as const;
}

function setAuthCookies(res: Response, params: { accessToken: string; refreshToken: string; refreshExpiresAt: Date; csrfToken: string }) {
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, params.accessToken, {
    ...cookieBaseOptions(),
    sameSite: 'lax',
    maxAge: accessTokenTtlMs(),
  });

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, params.refreshToken, {
    ...cookieBaseOptions(),
    sameSite: 'strict',
    path: REFRESH_TOKEN_COOKIE_PATH,
    expires: params.refreshExpiresAt,
  });

  // Deliberately NOT httpOnly — the frontend reads this to echo it back as
  // the X-CSRF-Token header (double-submit pattern, see middleware/csrf.ts).
  res.cookie(CSRF_COOKIE_NAME, params.csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: refreshTokenTtlMs(),
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, { path: '/' });
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: REFRESH_TOKEN_COOKIE_PATH });
  res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
}

export const tokenService = {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  generateCsrfToken: generateRawToken,
};
