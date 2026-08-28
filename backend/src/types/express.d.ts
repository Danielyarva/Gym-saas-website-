import type { AuthenticatedUser, OwnedCoachClient } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      coachClient?: OwnedCoachClient;
      requestId?: string;
      /** The exact raw request body bytes, captured by express.json()'s verify hook — needed to check Razorpay's webhook signature, which is computed over the raw payload, not the reparsed JSON. */
      rawBody?: Buffer;
    }
  }
}

export {};
