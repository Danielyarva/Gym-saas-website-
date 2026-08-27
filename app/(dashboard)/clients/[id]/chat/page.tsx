import { MessageCircle } from 'lucide-react';
import { ComingSoon } from '@/components/clients/profile/coming-soon';

export default function ClientChatPage() {
  return <ComingSoon icon={MessageCircle} feature="AI Coach chat" phase={4} />;
}
