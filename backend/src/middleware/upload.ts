import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, ALLOWED_MIME_TYPES.has(file.mimetype));
  },
});

/** Wraps multer's single-file handler so a rejected/oversized upload becomes a normal AppError (VALIDATION_ERROR) instead of an unhandled MulterError. */
export function uploadSingleImage(fieldName: string) {
  const handler = upload.single(fieldName);

  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        next(new AppError('VALIDATION_ERROR', err.code === 'LIMIT_FILE_SIZE' ? `File too large — max ${env.MAX_UPLOAD_SIZE_MB}MB` : err.message));
        return;
      }
      if (err) {
        next(err);
        return;
      }
      if (!req.file) {
        next(new AppError('VALIDATION_ERROR', 'A JPEG, PNG, or WebP image is required'));
        return;
      }
      next();
    });
  };
}
