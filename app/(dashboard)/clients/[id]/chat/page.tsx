'use client';

import { useParams } from 'next/navigation';
import { ChatTranscript } from '@/components/ai/chat-transcript';

export default function ClientChatPage() {
  const { id } = useParams<{ id: string }>();

  return <ChatTranscript clientId={id} />;
}
