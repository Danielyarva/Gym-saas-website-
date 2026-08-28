import { Router } from 'express';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import clientsRoutes from './clients.routes';
import exercisesRoutes from './exercises.routes';
import reportsRoutes from './reports.routes';
import conversationsRoutes from './conversations.routes';
import notificationsRoutes from './notifications.routes';
import subscriptionsRoutes from './subscriptions.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/clients', clientsRoutes);
router.use('/exercises', exercisesRoutes);
router.use('/reports', reportsRoutes);
router.use('/messages', conversationsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/subscriptions', subscriptionsRoutes);

export default router;
