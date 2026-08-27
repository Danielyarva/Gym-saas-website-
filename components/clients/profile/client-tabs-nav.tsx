'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Overview', segment: 'overview' },
  { label: 'Plan', segment: 'plan' },
  { label: 'Progress', segment: 'progress' },
  { label: 'Chat', segment: 'chat' },
  { label: 'Notes', segment: 'notes' },
];

export function ClientTabsNav({ clientId }: { clientId: string }) {
  const pathname = usePathname();

  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex gap-4 overflow-x-auto">
        {TABS.map((tab) => {
          const href = `/clients/${clientId}/${tab.segment}`;
          const active = pathname === href;
          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
