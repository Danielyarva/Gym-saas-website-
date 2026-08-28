'use client';

import { PageHeader } from '@/components/ui/page-header';
import { ConversationsList } from '@/components/messages/conversations-list';

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Conversations with your clients" />
      <ConversationsList />
    </div>
  );
}
