import Razorpay from 'razorpay';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentProvider, CreateOrderInput, CreateOrderResult } from './provider';

function hmacHex(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function safeEqual(expected: string, actual: string): boolean {
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(actual);
  return expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf);
}

export class RazorpayProvider implements PaymentProvider {
  private readonly client: Razorpay;

  constructor(
    keyId: string,
    private readonly keySecret: string,
    private readonly webhookSecret: string,
  ) {
    this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  async createOrder({ amountInPaise, currency, receipt }: CreateOrderInput): Promise<CreateOrderResult> {
    const order = await this.client.orders.create({ amount: amountInPaise, currency, receipt });
    return { orderId: order.id, amountInPaise: Number(order.amount), currency: order.currency };
  }

  /** Razorpay's documented checkout scheme: HMAC-SHA256 of `orderId|paymentId`, keyed by the account's key secret. */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    return safeEqual(hmacHex(this.keySecret, `${orderId}|${paymentId}`), signature);
  }

  /** Razorpay's documented webhook scheme: HMAC-SHA256 of the exact raw request body, keyed by the separate webhook secret. */
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    return safeEqual(hmacHex(this.webhookSecret, rawBody.toString('utf8')), signature);
  }
}
