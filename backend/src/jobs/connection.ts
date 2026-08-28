import IORedis from 'ioredis';
import { env } from '../config/env';

// BullMQ requires maxRetriesPerRequest: null on the connection it's given —
// it manages its own retry/backoff for blocking commands.
export const redisConnection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
