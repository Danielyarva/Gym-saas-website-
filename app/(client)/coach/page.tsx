'use client';

import { ChatView } from '@/components/client-app/ai-coach/chat-view';
import { useMe } from '@/hooks/use-auth';

export default function CoachPage() {
  const { data: me } = useMe();
  const clientId = me?.client?.id ?? '';

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">AI Coach</p>
        <h1 className="text-lg font-semibold text-foreground">Chat</h1>
      </div>
      <ChatView clientId={clientId} />
    </div>
  );
}
