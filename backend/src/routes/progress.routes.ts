import { Router } from 'express';
import * as progressController from '../controllers/progress.controller';
import { requireClientOwnershipOrSelf } from '../middleware/require-client-ownership';
import { validate } from '../middleware/validate';
import { uuidParamSchema } from '../schemas/common.schema';
import { chartsQuerySchema } from '../schemas/progress.schema';

// mergeParams: true — mounted at '/:id/progress' inside clients.routes.ts.
const router = Router({ mergeParams: true });

router.get('/charts', validate(uuidParamSchema, 'params'), requireClientOwnershipOrSelf(), validate(chartsQuerySchema, 'query'), progressController.getCharts);

export default router;
