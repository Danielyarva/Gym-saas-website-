import { Router } from 'express';
import * as nutritionPlansController from '../controllers/nutrition-plans.controller';
import { requireClientOwnershipOrSelf } from '../middleware/require-client-ownership';
import { validate } from '../middleware/validate';
import { uuidParamSchema } from '../schemas/common.schema';

// mergeParams: true — mounted at '/:id/nutrition-plan' inside clients.routes.ts
// (singular, distinct from the coach-only '/:id/nutrition-plans' CRUD router).
const router = Router({ mergeParams: true });

router.get('/active', validate(uuidParamSchema, 'params'), requireClientOwnershipOrSelf(), nutritionPlansController.getActive);

export default router;
