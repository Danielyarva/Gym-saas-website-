import { cn } from '@/lib/utils';
import type { AiMessage } from '@/types';

/** Expects `messages` in chronological (oldest-first) order — callers reverse the API's newest-first pages before passing them in. */
export function ChatMessageList({ messages }: { messages: AiMessage[] }) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((message) => (
        <div key={message.id} className={cn('flex', message.role === 'USER' ? 'justify-end' : 'justify-start')}>
          <div
            className={cn(
              'max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm',
              message.role === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
            )}
          >
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );
}
