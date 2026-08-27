import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/require-role';

const router = Router();

router.get('/', authenticate, requireRole('COACH'), dashboardController.getDashboard);

export default router;
