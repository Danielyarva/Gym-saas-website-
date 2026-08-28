'use client';

import { CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { usePayments } from '@/hooks/use-subscription';
import { formatDate } from '@/lib/format';
import type { PaymentStatus } from '@/types';

const STATUS_CONFIG: Record<PaymentStatus, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  CAPTURED: { label: 'Paid', variant: 'success' },
  CREATED: { label: 'Pending', variant: 'warning' },
  FAILED: { label: 'Failed', variant: 'destructive' },
};

export function BillingHistory() {
  const { data, isPending } = usePayments();

  if (isPending) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!data || data.payments.length === 0) {
    return <EmptyState icon={CreditCard} title="No payments yet" description="Payments you make will show up here." />;
  }

  return (
    <div className="space-y-3">
      {data.payments.map((payment) => (
        <Card key={payment.id}>
          <CardContent className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{payment.plan} plan</p>
              <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground">₹{(payment.amountInPaise / 100).toLocaleString('en-IN')}</span>
              <Badge variant={STATUS_CONFIG[payment.status].variant}>{STATUS_CONFIG[payment.status].label}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
