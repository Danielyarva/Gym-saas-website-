import { config } from '@/lib/config';
import type { ApiErrorBody, ApiSuccessBody } from '@/types';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);

  const isFormData = options.body instanceof FormData;

  // FormData bodies (progress photo uploads) must NOT get a JSON
  // Content-Type — fetch sets the correct multipart boundary itself only
  // when the header is left unset.
  if (options.body !== undefined && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  if (MUTATING_METHODS.has(method)) {
    const csrfToken = readCookie('csrf_token');
    if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
  }

  const res = await fetch(`${config.apiUrl}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
    body: options.body === undefined ? undefined : isFormData ? (options.body as FormData) : JSON.stringify(options.body),
  });

  const json = (await res.json().catch(() => null)) as ApiSuccessBody<T> | ApiErrorBody | null;

  if (!res.ok || !json || json.success === false) {
    const error = json && 'error' in json ? json.error : undefined;
    throw new ApiError(res.status, error?.code ?? 'INTERNAL_ERROR', error?.message ?? 'Something went wrong', error?.details);
  }

  return json.data;
}

let refreshPromise: Promise<void> | null = null;

function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = rawRequest<null>('/api/auth/refresh', { method: 'POST' })
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * All frontend data access goes through this function — never raw `fetch`.
 * It centralizes credentials, CSRF header injection, envelope unwrapping,
 * and a one-shot silent refresh-and-retry on a 401 (except for the
 * auth endpoints themselves, where a 401 is a real answer, not a stale
 * session).
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isAuthEndpoint = path.startsWith('/api/auth/');

  try {
    return await rawRequest<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !isAuthEndpoint) {
      await refreshSession();
      return rawRequest<T>(path, options);
    }
    throw err;
  }
}
