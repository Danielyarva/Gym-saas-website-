import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1),

  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  EMAIL_VERIFICATION_TTL_HOURS: z.coerce.number().int().positive().default(24),
  PASSWORD_RESET_TTL_HOURS: z.coerce.number().int().positive().default(1),

  ARGON2_MEMORY_COST_KIB: z.coerce.number().int().positive().default(19456),
  ARGON2_TIME_COST: z.coerce.number().int().positive().default(2),
  ARGON2_PARALLELISM: z.coerce.number().int().positive().default(1),

  EMAIL_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('AI Coach OS <no-reply@aicoachos.example>'),

  SEED_ADMIN_EMAIL: z.string().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),

  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(300),

  // Number of hops to trust for X-Forwarded-For (Express's `trust proxy`).
  // Leave at 0 unless actually deployed behind a reverse proxy/load balancer
  // (Render/Railway/nginx/ALB) — trusting it without one lets any client
  // spoof req.ip via the header, defeating both rate limiting and audit logs.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed — check backend/.env against .env.example');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
