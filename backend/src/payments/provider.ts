export interface CreateOrderInput {
  amountInPaise: number;
  currency: string;
  receipt: string;
}

export interface CreateOrderResult {
  orderId: string;
  amountInPaise: number;
  currency: string;
}

/**
 * Provider-agnostic payment abstraction (PRD §24: "Design payment
 * abstraction so Stripe can be added later") — nothing outside payments/
 * ever imports the Razorpay SDK directly.
 */
export interface PaymentProvider {
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean;
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
}
