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
  | 'INTERNAL_ERROR'
  | 'INVITE_INVALID'
  | 'INVITE_EXPIRED'
  | 'CLIENT_ALREADY_LINKED'
  | 'PLAN_NOT_ACTIVE'
  | 'AI_NOT_CONFIGURED'
  | 'CLIENT_LIMIT_REACHED'
  | 'BILLING_NOT_CONFIGURED'
  | 'PAYMENT_VERIFICATION_FAILED';

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
  INVITE_INVALID: 404,
  INVITE_EXPIRED: 410,
  CLIENT_ALREADY_LINKED: 409,
  PLAN_NOT_ACTIVE: 404,
  AI_NOT_CONFIGURED: 503,
  CLIENT_LIMIT_REACHED: 402,
  BILLING_NOT_CONFIGURED: 503,
  PAYMENT_VERIFICATION_FAILED: 400,
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
