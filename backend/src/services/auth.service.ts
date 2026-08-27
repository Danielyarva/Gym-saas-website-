import type { Request } from 'express';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { coachRepository } from '../repositories/coach.repository';
import { refreshTokenRepository } from '../repositories/refresh-token.repository';
import { emailVerificationTokenRepository, passwordResetTokenRepository } from '../repositories/verification-token.repository';
import { passwordService } from './password.service';
import { tokenService } from './token.service';
import { emailService } from './email.service';
import { auditService } from './audit.service';
import { generateRawToken, hashToken } from '../utils/crypto';
import { AppError } from '../utils/app-error';

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

async function issueSessionTokens(userId: string, role: 'COACH' | 'CLIENT' | 'ADMIN', email: string, req: Request) {
  const accessToken = tokenService.signAccessToken({ id: userId, role, email });
  const { rawToken: refreshToken, expiresAt: refreshExpiresAt } = await tokenService.issueRefreshToken(
    userId,
    req.headers['user-agent'],
    req.ip,
  );
  const csrfToken = tokenService.generateCsrfToken();
  return { accessToken, refreshToken, refreshExpiresAt, csrfToken };
}

async function register(input: RegisterInput, req: Request) {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) {
    throw new AppError('EMAIL_ALREADY_EXISTS', 'An account with this email already exists');
  }

  const passwordHash = await passwordService.hash(input.password);
  const user = await userRepository.create({ email: input.email, passwordHash, role: 'COACH' });
  const coach = await coachRepository.create({ userId: user.id, fullName: input.fullName });

  const rawVerificationToken = generateRawToken();
  await emailVerificationTokenRepository.create({
    userId: user.id,
    tokenHash: hashToken(rawVerificationToken),
    expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000),
  });
  void emailService.sendVerificationEmail(user.email, rawVerificationToken);

  await auditService.log({ req, actorUserId: user.id, action: 'USER_REGISTERED' });

  const tokens = await issueSessionTokens(user.id, user.role, user.email, req);
  return { user, coach, ...tokens };
}

async function login(input: LoginInput, req: Request) {
  const user = await userRepository.findByEmail(input.email);
  if (!user || !user.isActive) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const passwordMatches = await passwordService.verify(user.passwordHash, input.password);
  if (!passwordMatches) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  await userRepository.touchLastLogin(user.id);
  await auditService.log({ req, actorUserId: user.id, action: 'USER_LOGIN' });

  const coach = user.role === 'COACH' ? await coachRepository.findByUserId(user.id) : null;
  const tokens = await issueSessionTokens(user.id, user.role, user.email, req);
  return { user, coach, ...tokens };
}

async function refreshSession(rawRefreshToken: string, req: Request) {
  const rotated = await tokenService.rotateRefreshToken(rawRefreshToken, req.headers['user-agent'], req.ip);
  const user = await userRepository.findById(rotated.userId);
  if (!user) {
    throw new AppError('TOKEN_INVALID', 'Invalid refresh token');
  }

  const accessToken = tokenService.signAccessToken({ id: user.id, role: user.role, email: user.email });
  const csrfToken = tokenService.generateCsrfToken();
  return { accessToken, refreshToken: rotated.rawToken, refreshExpiresAt: rotated.expiresAt, csrfToken };
}

async function logout(rawRefreshToken: string | undefined, userId: string | undefined, req: Request) {
  if (rawRefreshToken) {
    await refreshTokenRepository.revokeByTokenHash(hashToken(rawRefreshToken));
  }
  if (userId) {
    await auditService.log({ req, actorUserId: userId, action: 'USER_LOGOUT' });
  }
}

async function logoutAll(userId: string, req: Request) {
  await refreshTokenRepository.revokeAllForUser(userId);
  await auditService.log({ req, actorUserId: userId, action: 'USER_LOGOUT_ALL' });
}

async function getMe(userId: string) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('UNAUTHORIZED', 'Authentication required');

  const coach = user.role === 'COACH' ? await coachRepository.findByUserId(user.id) : null;
  return { user, coach };
}

async function verifyEmail(rawToken: string) {
  const record = await emailVerificationTokenRepository.findValidByTokenHash(hashToken(rawToken));
  if (!record) {
    throw new AppError('TOKEN_INVALID', 'This verification link is invalid or has expired');
  }

  await userRepository.markEmailVerified(record.userId);
  await emailVerificationTokenRepository.markUsed(record.id);
  await auditService.log({ actorUserId: record.userId, action: 'EMAIL_VERIFIED' });
}

async function resendVerification(userId: string) {
  const user = await userRepository.findById(userId);
  if (!user || user.emailVerified) return;

  const rawToken = generateRawToken();
  await emailVerificationTokenRepository.create({
    userId: user.id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000),
  });
  void emailService.sendVerificationEmail(user.email, rawToken);
}

async function forgotPassword(email: string, req: Request) {
  const user = await userRepository.findByEmail(email);
  if (!user) return; // Always resolve silently — no user enumeration.

  const rawToken = generateRawToken();
  await passwordResetTokenRepository.create({
    userId: user.id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + env.PASSWORD_RESET_TTL_HOURS * 60 * 60 * 1000),
  });
  void emailService.sendPasswordResetEmail(user.email, rawToken);
  await auditService.log({ req, actorUserId: user.id, action: 'PASSWORD_RESET_REQUESTED' });
}

async function resetPassword(rawToken: string, newPassword: string, req: Request) {
  const record = await passwordResetTokenRepository.findValidByTokenHash(hashToken(rawToken));
  if (!record) {
    throw new AppError('TOKEN_INVALID', 'This reset link is invalid or has expired');
  }

  const passwordHash = await passwordService.hash(newPassword);
  await userRepository.updatePasswordHash(record.userId, passwordHash);
  await passwordResetTokenRepository.markUsed(record.id);
  // Force re-login everywhere — a leaked password could have been used to open other sessions.
  await refreshTokenRepository.revokeAllForUser(record.userId);
  await auditService.log({ req, actorUserId: record.userId, action: 'PASSWORD_RESET_COMPLETED' });
}

function listSessions(userId: string) {
  return refreshTokenRepository.listActiveForUser(userId);
}

async function revokeSession(userId: string, sessionId: string) {
  const session = await refreshTokenRepository.findActiveByIdForUser(sessionId, userId);
  if (!session) {
    throw new AppError('NOT_FOUND', 'Session not found');
  }
  await refreshTokenRepository.revokeByTokenHash(session.tokenHash);
}

export const authService = {
  register,
  login,
  refreshSession,
  logout,
  logoutAll,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  listSessions,
  revokeSession,
};
