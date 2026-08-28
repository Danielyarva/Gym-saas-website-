'use client';

import { PageHeader } from '@/components/ui/page-header';
import { CoachList } from '@/components/admin/coach-list';

export default function AdminCoachesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Coaches" description="Every coach on the platform." />
      <CoachList />
    </div>
  );
}
