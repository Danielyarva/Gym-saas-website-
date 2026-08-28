'use client';

import { MessageThread } from '@/components/messages/message-thread';
import { useMe } from '@/hooks/use-auth';

export default function ClientMessagesPage() {
  const { data: me } = useMe();
  const clientId = me?.client?.id ?? '';

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Messages</p>
        <h1 className="text-lg font-semibold text-foreground">Your coach</h1>
      </div>
      <MessageThread clientId={clientId} viewerRole="CLIENT" />
    </div>
  );
}
