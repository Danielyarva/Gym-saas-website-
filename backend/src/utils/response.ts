import type { Response } from 'express';
import type { ErrorCode } from './app-error';

export function sendSuccess<T>(res: Response, data: T, message = 'Success', statusCode = 200): void {
  res.status(statusCode).json({ success: true, data, message });
}

export function sendError(res: Response, statusCode: number, code: ErrorCode, message: string, details?: unknown): void {
  res.status(statusCode).json({
    success: false,
    error: details === undefined ? { code, message } : { code, message, details },
  });
}
