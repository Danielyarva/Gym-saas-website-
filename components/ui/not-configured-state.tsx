import { Sparkles, type LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface NotConfiguredStateProps {
  feature: string;
  title?: string;
  icon?: LucideIcon;
}

/** The one place every "provider not configured" surface renders its graceful-degradation state — AI features and billing both degrade cleanly when a third-party key is unset, and read the same message shape. */
export function NotConfiguredState({ feature, title = "AI features aren't configured yet", icon: Icon = Sparkles }: NotConfiguredStateProps) {
  return <EmptyState icon={Icon} title={title} description={`Add the required provider credentials before ${feature} can work.`} />;
}
