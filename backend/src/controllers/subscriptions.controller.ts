import type { Request, Response } from 'express';
import type { SubscriptionPlan } from '@prisma/client';
import { subscriptionService } from '../services/subscription.service';
import { webhooksQueue } from '../jobs/queues';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = await subscriptionService.getStatus(req.user!.coachId!);
  sendSuccess(res, data);
});

export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const { plan } = req.body as { plan: SubscriptionPlan };
  const data = await subscriptionService.createCheckoutOrder(req.user!.coachId!, plan);
  sendSuccess(res, data, 'Checkout order created', 201);
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, paymentId, signature } = req.body as { orderId: string; paymentId: string; signature: string };
  const data = await subscriptionService.verifyPayment(req.user!.coachId!, orderId, paymentId, signature, req);
  sendSuccess(res, data, 'Payment verified');
});

export const downgrade = asyncHandler(async (req: Request, res: Response) => {
  const data = await subscriptionService.downgradeToStarter(req.user!.coachId!, req);
  sendSuccess(res, data, 'Downgraded to Starter');
});

export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
  const data = await subscriptionService.listPayments(req.user!.coachId!, page, pageSize);
  sendSuccess(res, data);
});

/**
 * Razorpay calls this directly — no session, no CSRF token. The signature
 * check is the authentication, and stays synchronous here (cheap, local
 * HMAC) so a bad signature is rejected before ACKing. Once valid, the event
 * itself is handed to `webhooksQueue` and this returns immediately — a
 * transient DB hiccup then gets BullMQ's retry/backoff instead of relying
 * on Razorpay's own retry semantics.
 */
export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'];
  if (!req.rawBody || typeof signature !== 'string') {
    throw new AppError('PAYMENT_VERIFICATION_FAILED', 'Missing webhook signature');
  }
  subscriptionService.verifyWebhookSignature(req.rawBody, signature);
  await webhooksQueue.add('process', { rawBody: req.rawBody.toString('base64') });
  sendSuccess(res, null);
});
