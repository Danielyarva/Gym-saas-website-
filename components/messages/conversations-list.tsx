'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useConversations } from '@/hooks/use-conversations';
import { formatRelativeTime } from '@/lib/format';

/** The coach's cross-client inbox (PRD §20) — mirrors Phase 4's ReportsList: one row per client on the roster. */
export function ConversationsList() {
  const { data, isPending } = useConversations();

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.conversations.length === 0) {
    return <EmptyState icon={MessageCircle} title="No conversations yet" description="Messages between you and your clients will show up here." />;
  }

  return (
    <div className="space-y-3">
      {data.conversations.map(({ client, lastMessage, unreadCount }) => (
        <Link key={client.id} href={`/clients/${client.id}/messages`}>
          <Card className="transition-colors hover:bg-secondary/50">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-foreground">{client.fullName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {lastMessage ? (lastMessage.content ?? 'Sent an attachment') : 'No messages yet'}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {lastMessage ? <span className="text-xs text-muted-foreground">{formatRelativeTime(lastMessage.createdAt)}</span> : null}
                {unreadCount > 0 ? <Badge>{unreadCount}</Badge> : null}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
