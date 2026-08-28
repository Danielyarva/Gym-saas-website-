import { Router } from 'express';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import clientsRoutes from './clients.routes';
import exercisesRoutes from './exercises.routes';
import reportsRoutes from './reports.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/clients', clientsRoutes);
router.use('/exercises', exercisesRoutes);
router.use('/reports', reportsRoutes);

export default router;
