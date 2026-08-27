import pino from 'pino';
import { env, isProduction } from './env';

const isTest = env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : isProduction ? 'info' : 'debug',
  transport: isProduction || isTest
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
});
