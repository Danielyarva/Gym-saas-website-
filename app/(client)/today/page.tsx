'use client';

import { TodayWorkoutView } from '@/components/client-app/workout/today-workout-view';
import { useMe } from '@/hooks/use-auth';

export default function TodayPage() {
  const { data: me } = useMe();
  const clientId = me?.client?.id ?? '';

  return <TodayWorkoutView clientId={clientId} />;
}
