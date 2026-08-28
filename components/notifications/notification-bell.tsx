'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';

/**
 * Polls its own unread count independently — the badge stays current whether
 * or not the notifications page is open. `href` defaults to the coach's
 * /notifications; the client app passes /alerts (both route groups can't
 * share the literal path /notifications — Next.js route groups don't
 * namespace URLs).
 */
export function NotificationBell({ href = '/notifications' }: { href?: string }) {
  const { data: unreadCount } = useUnreadNotificationCount();

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href={href} aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unreadCount ? (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
