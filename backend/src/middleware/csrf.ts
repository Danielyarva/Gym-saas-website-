import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Double-submit CSRF check: the frontend reads the JS-readable csrf_token
 * cookie (set at login/register/refresh) and echoes it back as a header.
 * A cross-site request can trigger the cookie to be sent automatically but
 * cannot read it to set the matching header, so this fails closed for CSRF
 * while costing legitimate same-site requests nothing.
 */
export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new AppError('FORBIDDEN', 'CSRF token missing or invalid'));
    return;
  }

  next();
}
