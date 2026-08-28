'use client';

import { MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ChatMessageList } from './chat-message-list';
import { useAiChatMessages } from '@/hooks/use-ai-chat';

/** Read-only — the coach observes the client's AI Coach conversation, never sends into it (PRD: chat is client-facing). */
export function ChatTranscript({ clientId }: { clientId: string }) {
  const { data, isPending } = useAiChatMessages(clientId);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="ml-auto h-12 w-1/2" />
        <Skeleton className="h-12 w-3/4" />
      </div>
    );
  }

  if (!data || data.messages.length === 0) {
    return <EmptyState icon={MessageCircle} title="No messages yet" description="Messages this client sends their AI Coach will show up here." />;
  }

  return <ChatMessageList messages={[...data.messages].reverse()} />;
}
