import type { Request } from 'express';
import type { Payment, SubscriptionPlan } from '@prisma/client';
import { subscriptionRepository } from '../repositories/subscription.repository';
import { paymentRepository } from '../repositories/payment.repository';
import { clientRepository } from '../repositories/client.repository';
import { coachRepository } from '../repositories/coach.repository';
import { paymentService } from '../payments';
import { notificationService } from './notification.service';
import { emailService } from './email.service';
import { auditService } from './audit.service';
import { AppError } from '../utils/app-error';
import { env } from '../config/env';
import { PLAN_LIMITS, PLAN_CURRENCY } from '../config/plan-limits';

const PERIOD_DAYS = 30;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function toPublicPlans() {
  return (Object.keys(PLAN_LIMITS) as SubscriptionPlan[]).map((plan) => ({
    plan,
    label: PLAN_LIMITS[plan].label,
    maxClients: PLAN_LIMITS[plan].maxClients,
    priceInPaise: PLAN_LIMITS[plan].priceInPaise,
  }));
}

/**
 * Every function below calls this first. No scheduled job exists yet
 * (Phase 7) to flip a lapsed paid plan back to Starter, so it's checked
 * lazily on every read instead: still correct, just computed on demand.
 */
async function ensureCurrent(coachId: string) {
  const subscription = await subscriptionRepository.findByCoachId(coachId);
  if (!subscription) throw new AppError('NOT_FOUND', 'Subscription not found');

  if (subscription.plan !== 'STARTER' && subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) {
    return subscriptionRepository.update(coachId, { plan: 'STARTER', status: 'CANCELED', currentPeriodEnd: null });
  }

  return subscription;
}

async function getStatus(coachId: string) {
  const [subscription, clientCount] = await Promise.all([ensureCurrent(coachId), clientRepository.countActive(coachId)]);
  return {
    plan: subscription.plan,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    usage: { used: clientCount, limit: PLAN_LIMITS[subscription.plan].maxClients },
    plans: toPublicPlans(),
  };
}

/** Called from clients.service.ts#create right before a new client is written. */
async function checkAndEnforceClientLimit(coachId: string): Promise<void> {
  const subscription = await ensureCurrent(coachId);
  const clientCount = await clientRepository.countActive(coachId);
  const limit = PLAN_LIMITS[subscription.plan].maxClients;

  if (clientCount >= limit) {
    throw new AppError(
      'CLIENT_LIMIT_REACHED',
      `You've reached your ${PLAN_LIMITS[subscription.plan].label} plan's ${limit}-client limit. Upgrade to add more clients.`,
    );
  }
}

async function createCheckoutOrder(coachId: string, plan: SubscriptionPlan) {
  if (plan === 'STARTER') {
    throw new AppError('VALIDATION_ERROR', 'Starter is free — there is nothing to check out');
  }

  const amountInPaise = PLAN_LIMITS[plan].priceInPaise;
  const order = await paymentService.createOrder({ amountInPaise, currency: PLAN_CURRENCY, receipt: `${coachId}-${Date.now()}` });

  await paymentRepository.create({ coachId, plan, amountInPaise, currency: PLAN_CURRENCY, status: 'CREATED', razorpayOrderId: order.orderId });
  await subscriptionRepository.update(coachId, { razorpayOrderId: order.orderId });

  return { orderId: order.orderId, amountInPaise: order.amountInPaise, currency: order.currency, keyId: env.RAZORPAY_KEY_ID };
}

/**
 * Shared by both confirmation paths — the client's post-checkout `/verify`
 * call (fast UI feedback) and the `/webhook` endpoint (the authoritative
 * fallback if the coach closes the tab mid-checkout). `claimForCapture` is
 * an atomic conditional update (CREATED/FAILED -> CAPTURED in one query),
 * so if both paths race for the same payment only one of them proceeds
 * past it — a plain read-then-write status check can't guarantee that.
 */
async function activatePayment(payment: Payment, razorpayPaymentId: string, req?: Request): Promise<void> {
  const claimed = await paymentRepository.claimForCapture(payment.id, razorpayPaymentId);
  if (!claimed) return;

  await subscriptionRepository.update(payment.coachId, { plan: payment.plan, status: 'ACTIVE', currentPeriodEnd: addDays(new Date(), PERIOD_DAYS) });

  await auditService.log({
    req,
    actorUserId: req?.user?.id,
    action: 'PAYMENT_SUCCEEDED',
    entityType: 'COACH',
    entityId: payment.coachId,
    metadata: { plan: payment.plan, razorpayPaymentId },
  });

  const coach = await coachRepository.findByIdWithUser(payment.coachId);
  if (coach) {
    await notificationService.notifySubscriptionActivated(coach.userId, PLAN_LIMITS[payment.plan].label);
    void emailService.sendPaymentReceiptEmail(coach.user.email, PLAN_LIMITS[payment.plan].label, payment.amountInPaise, payment.currency);
  }
}

async function verifyPayment(coachId: string, orderId: string, razorpayPaymentId: string, signature: string, req: Request) {
  const isValid = paymentService.verifyPaymentSignature(orderId, razorpayPaymentId, signature);
  if (!isValid) {
    throw new AppError('PAYMENT_VERIFICATION_FAILED', 'Payment verification failed');
  }

  const payment = await paymentRepository.findByRazorpayOrderId(orderId);
  if (!payment || payment.coachId !== coachId) {
    throw new AppError('NOT_FOUND', 'Payment not found');
  }

  await activatePayment(payment, razorpayPaymentId, req);
  return getStatus(coachId);
}

async function handleWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
  if (!paymentService.verifyWebhookSignature(rawBody, signature)) {
    throw new AppError('PAYMENT_VERIFICATION_FAILED', 'Webhook signature verification failed');
  }

  const event = JSON.parse(rawBody.toString('utf8')) as { event?: string; payload?: { payment?: { entity?: { id: string; order_id: string } } } };
  const paymentEntity = event.payload?.payment?.entity;
  if (!paymentEntity) return;

  const payment = await paymentRepository.findByRazorpayOrderId(paymentEntity.order_id);
  if (!payment) return;

  if (event.event === 'payment.captured') {
    await activatePayment(payment, paymentEntity.id);
  } else if (event.event === 'payment.failed' && payment.status !== 'CAPTURED') {
    await paymentRepository.updateStatus(payment.id, 'FAILED');
    await subscriptionRepository.update(payment.coachId, { status: 'PAST_DUE' });
  }
}

async function downgradeToStarter(coachId: string, req: Request) {
  const clientCount = await clientRepository.countActive(coachId);
  if (clientCount > PLAN_LIMITS.STARTER.maxClients) {
    throw new AppError(
      'CLIENT_LIMIT_REACHED',
      `You have ${clientCount} active clients — Starter allows up to ${PLAN_LIMITS.STARTER.maxClients}. Archive clients before downgrading.`,
    );
  }

  await subscriptionRepository.update(coachId, { plan: 'STARTER', status: 'ACTIVE', currentPeriodEnd: null });
  await auditService.log({ req, actorUserId: req.user?.id, action: 'SUBSCRIPTION_CHANGED', entityType: 'COACH', entityId: coachId, metadata: { plan: 'STARTER' } });

  return getStatus(coachId);
}

async function listPayments(coachId: string, page: number, pageSize: number) {
  const [payments, total] = await paymentRepository.listForCoach(coachId, page, pageSize);
  return { payments, total, page, pageSize };
}

export const subscriptionService = {
  getStatus,
  checkAndEnforceClientLimit,
  createCheckoutOrder,
  verifyPayment,
  handleWebhookEvent,
  downgradeToStarter,
  listPayments,
};
