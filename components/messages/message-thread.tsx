'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Send, Paperclip, MessageCircle, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useMessages, useSendMessage, useTypingPing } from '@/hooks/use-messages';
import { ApiError } from '@/services/api-client';
import type { Message, MessageSenderRole } from '@/types';
import { TypingIndicator } from './typing-indicator';

const TYPING_PING_INTERVAL_MS = 3000;

function MessageBubble({ message, viewerRole }: { message: Message; viewerRole: MessageSenderRole }) {
  const isMine = message.senderRole === viewerRole;
  return (
    <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] space-y-2 rounded-lg px-3 py-2 text-sm',
          isMine ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
        )}
      >
        {message.attachmentUrl ? (
          <div className="relative h-48 w-48 overflow-hidden rounded-md">
            <Image src={message.attachmentUrl} alt={message.attachmentName ?? 'Attachment'} fill className="object-cover" unoptimized />
          </div>
        ) : null}
        {message.content ? <p className="whitespace-pre-wrap">{message.content}</p> : null}
      </div>
    </div>
  );
}

/** Shared by both roles — unlike Phase 4's AI chat, both a coach and a client read and write here, so bubble alignment compares each message's sender to *this* viewer rather than assuming a fixed side. */
export function MessageThread({ clientId, viewerRole }: { clientId: string; viewerRole: MessageSenderRole }) {
  const { data, isPending } = useMessages(clientId);
  const sendMessage = useSendMessage(clientId);
  const typingPing = useTypingPing(clientId);
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<File | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingPingRef = useRef(0);

  const pingTyping = () => {
    const now = Date.now();
    if (now - lastTypingPingRef.current > TYPING_PING_INTERVAL_MS) {
      lastTypingPingRef.current = now;
      typingPing.mutate();
    }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed && !attachment) return;

    sendMessage.mutate(
      { content: trimmed || undefined, attachment },
      {
        onSuccess: () => {
          setContent('');
          setAttachment(undefined);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
      },
    );
  };

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="ml-auto h-12 w-1/2" />
      </div>
    );
  }

  const messages = data ? [...data.messages].reverse() : [];

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No messages yet" description="Send a message to start the conversation." />
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} viewerRole={viewerRole} />
          ))}
        </div>
      )}

      {data?.otherPartyTyping ? <TypingIndicator /> : null}

      {attachment ? (
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
          <span className="truncate">{attachment.name}</span>
          <button type="button" onClick={() => setAttachment(undefined)} aria-label="Remove attachment">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => setAttachment(event.target.files?.[0])}
        />
        <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} aria-label="Attach image">
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            pingTyping();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message…"
          rows={2}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={sendMessage.isPending || (!content.trim() && !attachment)} size="icon" aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
