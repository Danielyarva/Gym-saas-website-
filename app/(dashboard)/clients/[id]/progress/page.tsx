'use client';

import { useParams } from 'next/navigation';
import { ProgressCharts } from '@/components/progress/progress-charts';
import { PhotoGallery } from '@/components/progress/photo-gallery';
import { CheckInHistory } from '@/components/checkins/checkin-history';

export default function ClientProgressPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <ProgressCharts clientId={id} />
      <PhotoGallery clientId={id} />
      <CheckInHistory clientId={id} />
    </div>
  );
}
