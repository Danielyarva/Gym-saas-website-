'use client';

import { CheckInForm } from '@/components/client-app/checkin/checkin-form';
import { useMe } from '@/hooks/use-auth';

export default function CheckInPage() {
  const { data: me } = useMe();
  const clientId = me?.client?.id ?? '';

  return <CheckInForm clientId={clientId} />;
}
