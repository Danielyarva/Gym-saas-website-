import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { corsOptions } from './config/cors';
import { env } from './config/env';
import { logger } from './config/logger';
import { requestContext } from './middleware/request-context';
import { apiRateLimiter } from './middleware/rate-limit';
import { notFoundHandler } from './middleware/not-found';
import { errorHandler } from './middleware/error-handler';
import routes from './routes';

export function createApp(): Express {
  const app = express();

  if (env.TRUST_PROXY_HOPS > 0) {
    app.set('trust proxy', env.TRUST_PROXY_HOPS);
  }

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestContext);
  app.use(pinoHttp({ logger, genReqId: (req) => req.requestId as string }));
  app.use(apiRateLimiter);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
