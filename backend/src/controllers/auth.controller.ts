import type { Request, Response } from 'express';
import type { Client, Coach, RefreshToken, User } from '@prisma/client';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';
import { tokenService, REFRESH_TOKEN_COOKIE_NAME } from '../services/token.service';

function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}

function toPublicCoach(coach: Coach | null) {
  if (!coach) return null;
  return {
    id: coach.id,
    fullName: coach.fullName,
    businessName: coach.businessName,
    avatarUrl: coach.avatarUrl,
  };
}

function toPublicClient(client: Client | null) {
  if (!client) return null;
  return {
    id: client.id,
    fullName: client.fullName,
    email: client.email,
  };
}

function toPublicSession(session: RefreshToken) {
  return {
    id: session.id,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, coach, accessToken, refreshToken, refreshExpiresAt, csrfToken } = await authService.register(req.body, req);
  tokenService.setAuthCookies(res, { accessToken, refreshToken, refreshExpiresAt, csrfToken });
  sendSuccess(res, { user: toPublicUser(user), coach: toPublicCoach(coach) }, 'Account created. Check your email to verify your address.', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, coach, accessToken, refreshToken, refreshExpiresAt, csrfToken } = await authService.login(req.body, req);
  tokenService.setAuthCookies(res, { accessToken, refreshToken, refreshExpiresAt, csrfToken });
  sendSuccess(res, { user: toPublicUser(user), coach: toPublicCoach(coach) });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
  if (!rawRefreshToken) {
    throw new AppError('UNAUTHORIZED', 'No active session');
  }

  const { accessToken, refreshToken, refreshExpiresAt, csrfToken } = await authService.refreshSession(rawRefreshToken, req);
  tokenService.setAuthCookies(res, { accessToken, refreshToken, refreshExpiresAt, csrfToken });
  sendSuccess(res, null, 'Session refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
  await authService.logout(rawRefreshToken, req.user?.id, req);
  tokenService.clearAuthCookies(res);
  sendSuccess(res, null, 'Logged out');
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  await authService.logoutAll(req.user!.id, req);
  tokenService.clearAuthCookies(res);
  sendSuccess(res, null, 'Logged out of all devices');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const { user, coach, client } = await authService.getMe(req.user!.id);
  sendSuccess(res, { user: toPublicUser(user), coach: toPublicCoach(coach), client: toPublicClient(client) });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.body.token);
  sendSuccess(res, null, 'Email verified');
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  await authService.resendVerification(req.user!.id);
  sendSuccess(res, null, 'If your email is not yet verified, a new verification link has been sent.');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email, req);
  sendSuccess(res, null, 'If an account exists for that email, a reset link has been sent.');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.newPassword, req);
  sendSuccess(res, null, 'Password reset. Please log in with your new password.');
});

export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await authService.listSessions(req.user!.id);
  sendSuccess(res, sessions.map(toPublicSession));
});

export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
  await authService.revokeSession(req.user!.id, req.params.sessionId!);
  sendSuccess(res, null, 'Session revoked');
});

export const getInvite = asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.getInvitePreview(req.params.token!);
  sendSuccess(res, data);
});

export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const { user, client, accessToken, refreshToken, refreshExpiresAt, csrfToken } = await authService.acceptInvite(
    req.params.token!,
    req.body.password,
    req,
  );
  tokenService.setAuthCookies(res, { accessToken, refreshToken, refreshExpiresAt, csrfToken });
  sendSuccess(res, { user: toPublicUser(user), client: toPublicClient(client) }, 'Account created', 201);
});
