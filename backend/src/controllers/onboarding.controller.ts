import type { Request, Response } from 'express';
import { onboardingService } from '../services/onboarding.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const getOnboarding = asyncHandler(async (req: Request, res: Response) => {
  const data = await onboardingService.getOnboarding(req.params.id!);
  sendSuccess(res, data);
});

export const saveStep = asyncHandler(async (req: Request, res: Response) => {
  const data = await onboardingService.saveStep(req.params.id!, Number(req.params.stepNumber), req.body);
  sendSuccess(res, data, 'Progress saved');
});

export const complete = asyncHandler(async (req: Request, res: Response) => {
  const data = await onboardingService.complete(req.params.id!, req);
  sendSuccess(res, data, 'Onboarding complete');
});
