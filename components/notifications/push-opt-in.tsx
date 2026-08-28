'use client';

import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePushSubscriptionStatus, useEnablePush } from '@/hooks/use-push-subscription';

/** Hidden once already subscribed or if this browser lacks Push API support — never shown as a dead end. */
export function PushOptIn() {
  const { data, isPending } = usePushSubscriptionStatus();
  const enablePush = useEnablePush();

  if (isPending || !data?.supported || data.subscribed) return null;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <Bell className="size-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Enable push notifications</p>
            <p className="text-sm text-muted-foreground">Get notified on this device even when the tab isn&apos;t open.</p>
          </div>
        </div>
        <Button
          size="sm"
          disabled={enablePush.isPending}
          onClick={() =>
            enablePush.mutate(undefined, {
              onSuccess: () => toast.success('Push notifications enabled'),
              onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
            })
          }
        >
          Enable
        </Button>
      </CardContent>
    </Card>
  );
}
