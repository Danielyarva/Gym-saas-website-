import type { Request, Response } from 'express';
import { pushService } from '../push';
import { pushSubscriptionService } from '../services/push-subscription.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const getVapidPublicKey = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, { publicKey: pushService.getPublicKey() });
});

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const { endpoint, keys } = req.body as { endpoint: string; keys: { p256dh: string; auth: string } };
  await pushSubscriptionService.subscribe(req.user!.id, endpoint, keys.p256dh, keys.auth);
  sendSuccess(res, null, 'Subscribed', 201);
});

export const unsubscribe = asyncHandler(async (req: Request, res: Response) => {
  const { endpoint } = req.body as { endpoint: string };
  await pushSubscriptionService.unsubscribe(req.user!.id, endpoint);
  sendSuccess(res, null);
});
