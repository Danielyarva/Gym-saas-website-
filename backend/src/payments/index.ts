import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import { RazorpayProvider } from './razorpay-provider';
import type { PaymentProvider, CreateOrderInput, CreateOrderResult } from './provider';

let provider: PaymentProvider | null = null;

function getProvider(): PaymentProvider {
  provider ??= new RazorpayProvider(env.RAZORPAY_KEY_ID, env.RAZORPAY_KEY_SECRET, env.RAZORPAY_WEBHOOK_SECRET);
  return provider;
}

function isConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

function notConfiguredError(): AppError {
  return new AppError('BILLING_NOT_CONFIGURED', "Billing isn't configured yet");
}

/**
 * Every real payment call in the app goes through this wrapper, never the
 * provider directly — the one place the "not configured" check happens, so
 * it can't be forgotten by a new call site. Every `Payment` row already
 * records the outcome of each attempt (CREATED/CAPTURED/FAILED), so unlike
 * ai/index.ts there's no separate usage-log table to also write here.
 */
async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (!isConfigured()) throw notConfiguredError();
  return getProvider().createOrder(input);
}

function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!isConfigured()) throw notConfiguredError();
  return getProvider().verifyPaymentSignature(orderId, paymentId, signature);
}

function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  if (!isConfigured()) throw notConfiguredError();
  return getProvider().verifyWebhookSignature(rawBody, signature);
}

export const paymentService = {
  isConfigured,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
