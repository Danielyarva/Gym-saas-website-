import type { SubscriptionPlan, PaymentStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface CreatePaymentInput {
  coachId: string;
  plan: SubscriptionPlan;
  amountInPaise: number;
  currency: string;
  status: PaymentStatus;
  razorpayOrderId: string;
}

export const paymentRepository = {
  create(input: CreatePaymentInput) {
    return prisma.payment.create({ data: input });
  },

  findByRazorpayOrderId(razorpayOrderId: string) {
    return prisma.payment.findFirst({ where: { razorpayOrderId }, orderBy: { createdAt: 'desc' } });
  },

  updateStatus(id: string, status: PaymentStatus, razorpayPaymentId?: string) {
    return prisma.payment.update({ where: { id }, data: { status, ...(razorpayPaymentId ? { razorpayPaymentId } : {}) } });
  },

  /**
   * Atomically claims a payment for activation: only the caller that
   * actually flips CREATED -> CAPTURED gets `claimed: true` back. Guards
   * against the client's /verify call and the /webhook racing each other
   * for the same payment — without this, both could pass a plain "is it
   * already CAPTURED?" read-then-write check and double-activate.
   */
  async claimForCapture(id: string, razorpayPaymentId: string): Promise<boolean> {
    const result = await prisma.payment.updateMany({
      where: { id, status: { not: 'CAPTURED' } },
      data: { status: 'CAPTURED', razorpayPaymentId },
    });
    return result.count === 1;
  },

  listForCoach(coachId: string, page: number, pageSize: number) {
    return Promise.all([
      prisma.payment.findMany({
        where: { coachId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payment.count({ where: { coachId } }),
    ]);
  },
};
