'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { NotConfiguredState } from '@/components/ui/not-configured-state';
import { useCheckout, useVerifyPayment } from '@/hooks/use-subscription';
import { ApiError } from '@/services/api-client';
import type { SubscriptionPlan } from '@/types';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const CHECKOUT_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load the checkout widget'));
    document.body.appendChild(script);
  });
}

/**
 * Never loads Razorpay's third-party script speculatively — /checkout is
 * called first, and only a configured backend (real keys) ever gets far
 * enough to need the widget at all. In this sandbox it always renders the
 * clean not-configured state instead.
 */
export function UpgradeButton({ plan, label }: { plan: SubscriptionPlan; label: string }) {
  const checkout = useCheckout();
  const verifyPayment = useVerifyPayment();
  const [notConfigured, setNotConfigured] = useState(false);
  const [opening, setOpening] = useState(false);

  if (notConfigured) {
    return <NotConfiguredState feature="upgrading your plan" title="Billing isn't configured yet" />;
  }

  const handleClick = () => {
    setOpening(true);
    checkout.mutate(plan, {
      onSuccess: async (order) => {
        try {
          await loadRazorpayScript();
          const razorpay = new window.Razorpay({
            key: order.keyId,
            order_id: order.orderId,
            amount: order.amountInPaise,
            currency: order.currency,
            name: 'AI Coach OS',
            description: `Upgrade to ${plan}`,
            handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
              verifyPayment.mutate(
                { orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature },
                {
                  onSuccess: () => toast.success(`Upgraded to ${plan}`),
                  onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Payment verification failed'),
                },
              );
            },
            modal: { ondismiss: () => setOpening(false) },
          });
          razorpay.open();
        } catch {
          toast.error("Couldn't load the checkout — try again");
        } finally {
          setOpening(false);
        }
      },
      onError: (error) => {
        setOpening(false);
        if (error instanceof ApiError && error.code === 'BILLING_NOT_CONFIGURED') {
          setNotConfigured(true);
          return;
        }
        toast.error(error instanceof ApiError ? error.message : 'Something went wrong');
      },
    });
  };

  return (
    <Button className="w-full" onClick={handleClick} disabled={checkout.isPending || opening}>
      {checkout.isPending || opening ? 'Loading…' : label}
    </Button>
  );
}
