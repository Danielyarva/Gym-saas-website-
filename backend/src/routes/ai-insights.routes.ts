import { Router } from 'express';
import * as aiInsightsController from '../controllers/ai-insights.controller';
import { requireClientOwnershipOrSelf } from '../middleware/require-client-ownership';
import { validate } from '../middleware/validate';
import { uuidParamSchema } from '../schemas/common.schema';
import { listAiInsightsQuerySchema } from '../schemas/ai-insight.schema';

// mergeParams: true — mounted at '/:id/ai/insights' inside clients.routes.ts.
const router = Router({ mergeParams: true });

// No POST — insights are only ever produced as a side effect of check-in submission.
router.get('/', validate(uuidParamSchema, 'params'), requireClientOwnershipOrSelf(), validate(listAiInsightsQuerySchema, 'query'), aiInsightsController.list);

export default router;
