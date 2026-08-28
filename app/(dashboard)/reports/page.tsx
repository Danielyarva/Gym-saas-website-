'use client';

import { PageHeader } from '@/components/ui/page-header';
import { ReportsList } from '@/components/reports/reports-list';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Weekly AI-generated progress reports across your clients" />
      <ReportsList />
    </div>
  );
}
