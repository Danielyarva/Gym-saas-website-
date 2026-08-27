import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';
import { AppError } from '../utils/app-error';
import { sendError } from '../utils/response';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId: req.requestId }, err.message);
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  logger.error({ err, requestId: req.requestId }, 'Unhandled error');
  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
}
