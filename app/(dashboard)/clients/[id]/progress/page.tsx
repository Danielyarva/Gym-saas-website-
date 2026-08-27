'use client';

import { useParams } from 'next/navigation';
import { CheckInHistory } from '@/components/checkins/checkin-history';

export default function ClientProgressPage() {
  const { id } = useParams<{ id: string }>();
  return <CheckInHistory clientId={id} />;
}
