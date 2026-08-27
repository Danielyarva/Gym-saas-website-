export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'SESSION_REVOKED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  INVALID_CREDENTIALS: 401,
  TOKEN_INVALID: 401,
  TOKEN_EXPIRED: 401,
  SESSION_REVOKED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  EMAIL_ALREADY_EXISTS: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = STATUS_BY_CODE[code];
    this.details = details;
  }
}
