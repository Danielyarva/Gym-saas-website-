'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Send, MessageCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ChatMessageList } from '@/components/ai/chat-message-list';
import { AiNotConfiguredState } from '@/components/ai/ai-not-configured-state';
import { useAiChatMessages, useSendAiChatMessage } from '@/hooks/use-ai-chat';
import { ApiError } from '@/services/api-client';

export function ChatView({ clientId }: { clientId: string }) {
  const { data, isPending } = useAiChatMessages(clientId);
  const sendMessage = useSendAiChatMessage(clientId);
  const [content, setContent] = useState('');
  const [notConfigured, setNotConfigured] = useState(false);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="ml-auto h-12 w-1/2" />
      </div>
    );
  }

  const messages = data ? [...data.messages].reverse() : [];

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    sendMessage.mutate(trimmed, {
      onSuccess: () => setContent(''),
      onError: (error) => {
        if (error instanceof ApiError && error.code === 'AI_NOT_CONFIGURED') {
          setNotConfigured(true);
          return;
        }
        toast.error(error instanceof ApiError ? error.message : 'Something went wrong');
      },
    });
  };

  return (
    <div className="space-y-4">
      {messages.length === 0 && !notConfigured ? (
        <EmptyState
          icon={MessageCircle}
          title="Ask your AI Coach anything"
          description="Questions about your plan, progress, or how you're doing between check-ins."
        />
      ) : (
        <ChatMessageList messages={messages} />
      )}

      {notConfigured ? (
        <AiNotConfiguredState feature="AI Coach chat" />
      ) : (
        <div className="flex gap-2">
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message your AI Coach…"
            rows={2}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={sendMessage.isPending || !content.trim()} size="icon" aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
