import { Router } from 'express';
import * as onboardingController from '../controllers/onboarding.controller';
import { requireRole } from '../middleware/require-role';
import { requireClientOwnershipOrSelf, requireSelf } from '../middleware/require-client-ownership';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { uuidParamSchema } from '../schemas/common.schema';
import { stepNumberParamSchema } from '../schemas/onboarding.schema';

// mergeParams: true — this router is mounted at '/:id/onboarding' inside
// clients.routes.ts, so req.params.id (the client id) comes from the parent.
const router = Router({ mergeParams: true });

router.get('/', validate(uuidParamSchema, 'params'), requireClientOwnershipOrSelf(), onboardingController.getOnboarding);

router.patch(
  '/step/:stepNumber',
  requireRole('CLIENT'),
  csrfProtection,
  validate(stepNumberParamSchema, 'params'),
  requireSelf('id'),
  onboardingController.saveStep,
);

router.post('/complete', requireRole('CLIENT'), csrfProtection, validate(uuidParamSchema, 'params'), requireSelf('id'), onboardingController.complete);

export default router;
