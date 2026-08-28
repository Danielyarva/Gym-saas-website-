'use client';

import { PageHeader } from '@/components/ui/page-header';
import { AppearanceCard } from '@/components/settings/appearance-card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Just Appearance for now — Profile, Account, Security, and the rest of PRD §23 come later." />
      <AppearanceCard />
    </div>
  );
}
