import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../utils/app-error';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      next(new AppError('VALIDATION_ERROR', 'Invalid request', result.error.flatten().fieldErrors));
      return;
    }

    req[target] = result.data;
    next();
  };
}
