'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/use-notifications';
import { formatRelativeTime } from '@/lib/format';
import type { Notification, MessageSenderRole } from '@/types';

/** Where clicking a notification goes — every trigger this phase sets entityId to a clientId; NEW_MESSAGE is the only type either role ever receives. */
function notificationHref(notification: Notification, viewerRole: MessageSenderRole): string | null {
  if (!notification.entityId) return null;
  if (notification.type === 'NEW_MESSAGE') {
    return viewerRole === 'COACH' ? `/clients/${notification.entityId}/messages` : '/inbox';
  }
  return viewerRole === 'COACH' ? `/clients/${notification.entityId}/overview` : null;
}

function NotificationCard({ notification, clickable }: { notification: Notification; clickable: boolean }) {
  return (
    <Card className={cn('transition-colors', !notification.readAt && 'border-primary/40 bg-primary/5', clickable && 'hover:bg-secondary/50')}>
      <CardContent className="flex items-start justify-between gap-4 py-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">{notification.title}</p>
          <p className="text-sm text-muted-foreground">{notification.body}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(notification.createdAt)}</span>
      </CardContent>
    </Card>
  );
}

export function NotificationsList({ viewerRole }: { viewerRole: MessageSenderRole }) {
  const { data, isPending } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.notifications.length === 0) {
    return <EmptyState icon={Bell} title="No notifications yet" description="Check-ins, AI alerts, and messages will show up here." />;
  }

  return (
    <div className="space-y-3">
      {data.unreadCount > 0 ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            Mark all read
          </Button>
        </div>
      ) : null}

      {data.notifications.map((notification) => {
        const href = notificationHref(notification, viewerRole);

        if (!href) {
          return <NotificationCard key={notification.id} notification={notification} clickable={false} />;
        }

        return (
          <Link key={notification.id} href={href} onClick={() => !notification.readAt && markRead.mutate(notification.id)}>
            <NotificationCard notification={notification} clickable />
          </Link>
        );
      })}
    </div>
  );
}
