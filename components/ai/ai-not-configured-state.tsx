import { Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

/** The one place every AI surface renders the graceful-degradation state (AI_NOT_CONFIGURED) — chat, insights, weekly reports all read the same message. */
export function AiNotConfiguredState({ feature }: { feature: string }) {
  return (
    <EmptyState
      icon={Sparkles}
      title="AI features aren't configured yet"
      description={`An AI provider API key needs to be added before ${feature} can work.`}
    />
  );
}
