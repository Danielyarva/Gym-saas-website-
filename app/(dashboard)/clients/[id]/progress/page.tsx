'use client';

import { useParams } from 'next/navigation';
import { ProgressCharts } from '@/components/progress/progress-charts';
import { PhotoGallery } from '@/components/progress/photo-gallery';
import { CheckInHistory } from '@/components/checkins/checkin-history';
import { WeeklyReportCard } from '@/components/ai/weekly-report-card';

export default function ClientProgressPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <WeeklyReportCard clientId={id} />
      <ProgressCharts clientId={id} />
      <PhotoGallery clientId={id} />
      <CheckInHistory clientId={id} />
    </div>
  );
}
