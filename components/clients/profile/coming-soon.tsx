import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface ComingSoonProps {
  icon: LucideIcon;
  feature: string;
  phase: number;
}

export function ComingSoon({ icon, feature, phase }: ComingSoonProps) {
  return <EmptyState icon={icon} title={`${feature} is coming soon`} description={`This ships in Phase ${phase} of AI Coach OS.`} />;
}
