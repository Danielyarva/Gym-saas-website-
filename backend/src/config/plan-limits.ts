import type { SubscriptionPlan } from '@prisma/client';

interface PlanLimit {
  label: string;
  maxClients: number;
  /** 0 for Starter — a real price for Pro/Business, in the smallest currency unit (paise), matching Razorpay's own convention. */
  priceInPaise: number;
}

/**
 * The one place a plan's client cap or price is ever defined (PRD §24:
 * "Do not hardcode limits throughout the application"). Every limit check
 * and every price shown to a coach reads from here — never a literal
 * 5/25/75 anywhere else in the app.
 */
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimit> = {
  STARTER: { label: 'Starter', maxClients: 5, priceInPaise: 0 },
  PRO: { label: 'Pro', maxClients: 25, priceInPaise: 299900 },
  BUSINESS: { label: 'Business', maxClients: 75, priceInPaise: 799900 },
};

export const PLAN_CURRENCY = 'INR';
