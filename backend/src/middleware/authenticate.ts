import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { coachRepository } from '../repositories/coach.repository';
import { clientRepository } from '../repositories/client.repository';
import { AppError } from '../utils/app-error';
import type { AuthenticatedUser } from '../types';

interface AccessTokenPayload {
  sub: string;
  role: 'COACH' | 'CLIENT' | 'ADMIN';
  email: string;
}

export const ACCESS_TOKEN_COOKIE_NAME = 'access_token';

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);

  return null;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    next(new AppError('UNAUTHORIZED', 'Authentication required'));
    return;
  }

  let payload: AccessTokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new AppError('TOKEN_EXPIRED', 'Access token expired'));
    } else {
      next(new AppError('TOKEN_INVALID', 'Invalid access token'));
    }
    return;
  }

  const user: AuthenticatedUser = { id: payload.sub, role: payload.role, email: payload.email };

  if (payload.role === 'COACH') {
    const coach = await coachRepository.findByUserId(payload.sub);
    if (coach) user.coachId = coach.id;
  } else if (payload.role === 'CLIENT') {
    const client = await clientRepository.findByUserId(payload.sub);
    if (client) user.clientId = client.id;
  }

  req.user = user;
  next();
}
