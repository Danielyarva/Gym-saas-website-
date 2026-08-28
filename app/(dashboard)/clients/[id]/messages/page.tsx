'use client';

import { useParams } from 'next/navigation';
import { MessageThread } from '@/components/messages/message-thread';

export default function ClientMessagesPage() {
  const { id } = useParams<{ id: string }>();

  return <MessageThread clientId={id} viewerRole="COACH" />;
}
