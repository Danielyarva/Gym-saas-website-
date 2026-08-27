'use client';

import { ActivePlanView } from '@/components/client-app/nutrition/active-plan-view';
import { useMe } from '@/hooks/use-auth';

export default function NutritionPage() {
  const { data: me } = useMe();
  const clientId = me?.client?.id ?? '';

  return <ActivePlanView clientId={clientId} />;
}
