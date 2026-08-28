'use client';

import { PageHeader } from '@/components/ui/page-header';
import { PushOptIn } from '@/components/notifications/push-opt-in';
import { NotificationsList } from '@/components/notifications/notifications-list';

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" />
      <PushOptIn />
      <NotificationsList viewerRole="COACH" />
    </div>
  );
}
