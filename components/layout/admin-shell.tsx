'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserMenu } from './user-menu';

const ADMIN_NAV_ITEMS = [
  { label: 'Overview', href: '/admin' },
  { label: 'Coaches', href: '/admin/coaches' },
];

/**
 * A deliberately minimal shell, not a reuse of Sidebar/nav-items.ts (the
 * coach app's own full nav) — the admin area is two read-only pages, so a
 * small top nav is all it needs.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="hidden truncate text-sm font-semibold text-foreground sm:inline">AI Coach OS Admin</span>
          </div>
          <nav className="flex items-center gap-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex-1" />
          <UserMenu />
        </div>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
