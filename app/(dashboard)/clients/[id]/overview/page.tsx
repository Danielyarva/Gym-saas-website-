'use client';

import { useParams } from 'next/navigation';
import { useClient } from '@/hooks/use-clients';
import { OverviewStats } from '@/components/clients/profile/overview/overview-stats';
import { WeightSummaryCard } from '@/components/clients/profile/overview/weight-summary-card';
import { LatestInsightCard } from '@/components/ai/latest-insight-card';

export default function ClientOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: client } = useClient(id);

  if (!client) return null;

  return (
    <div className="space-y-4">
      <OverviewStats client={client} />
      <WeightSummaryCard profile={client.profile} />
      <LatestInsightCard clientId={id} />
    </div>
  );
}
