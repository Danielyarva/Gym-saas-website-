import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { sendError } from '../utils/response';

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'RATE_LIMITED', 'Too many requests. Please try again later.');
  },
});

// Tighter limit for endpoints that touch credentials or send email, so this
// alone makes brute-forcing login/reset materially slower than the general API.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'RATE_LIMITED', 'Too many attempts. Please try again later.');
  },
});
