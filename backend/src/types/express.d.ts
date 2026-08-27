import type { AuthenticatedUser, OwnedCoachClient } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      coachClient?: OwnedCoachClient;
      requestId?: string;
    }
  }
}

export {};
