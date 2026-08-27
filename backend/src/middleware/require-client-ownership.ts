import type { NextFunction, Request, Response } from 'express';
import { coachClientRepository } from '../repositories/client.repository';
import { AppError } from '../utils/app-error';

/**
 * Loads the CoachClient row for (req.user.coachId, req.params.id). Returns
 * 404 — never 403 — when it doesn't exist, so a caller probing client IDs
 * cannot distinguish "not yours" from "doesn't exist." This is the primary
 * enforcement point for "a coach can only access their own clients"; every
 * client/profile/note repository method also requires coachId directly as a
 * backstop in case a route is ever wired without this middleware by mistake.
 */
export async function requireClientOwnership(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const coachId = req.user?.coachId;
  const clientId = req.params.id!;

  if (!coachId) {
    next(new AppError('FORBIDDEN', 'You do not have permission to perform this action'));
    return;
  }

  const coachClient = await coachClientRepository.findByCoachAndClient(coachId, clientId);

  if (!coachClient) {
    next(new AppError('NOT_FOUND', 'Client not found'));
    return;
  }

  req.coachClient = coachClient;
  next();
}

/** Parity middleware for the CLIENT role — not exercised by any Phase 1 route yet
 *  (Phase 1 has no client-facing app), built now so it isn't retrofitted later. */
export function requireSelf(paramName = 'id') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const clientId = req.user?.clientId;

    if (!clientId || clientId !== req.params[paramName]) {
      next(new AppError('FORBIDDEN', 'You do not have permission to perform this action'));
      return;
    }

    next();
  };
}
