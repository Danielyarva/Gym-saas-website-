import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rate-limit';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sessionParamSchema,
} from '../schemas/auth.schema';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authRateLimiter, authController.refresh);

router.post('/logout', authenticate, csrfProtection, authController.logout);
router.post('/logout-all', authenticate, csrfProtection, authController.logoutAll);
router.get('/me', authenticate, authController.me);

router.post('/verify-email', authRateLimiter, validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', authenticate, csrfProtection, authRateLimiter, authController.resendVerification);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

router.get('/sessions', authenticate, authController.listSessions);
router.delete('/sessions/:sessionId', authenticate, csrfProtection, validate(sessionParamSchema, 'params'), authController.revokeSession);

export default router;
