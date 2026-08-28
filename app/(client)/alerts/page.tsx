'use client';

import { NotificationsList } from '@/components/notifications/notifications-list';

export default function ClientNotificationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
      <NotificationsList viewerRole="CLIENT" />
    </div>
  );
}
