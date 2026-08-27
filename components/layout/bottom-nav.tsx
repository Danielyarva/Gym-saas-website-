'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';
import { BOTTOM_NAV_ITEMS } from './nav-items';

/** Fixed bottom nav for mobile (PRD §3). Pads for the safe-area inset so it never sits under a device's home indicator; the dashboard shell adds matching bottom padding so page content never renders underneath it. */
export function BottomNav() {
  const pathname = usePathname();
  const setMobileMenuOpen = useUiStore((state) => state.setMobileMenuOpen);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.comingSoon ? '#' : item.href}
              aria-disabled={item.comingSoon}
              className={cn(
                'flex flex-col items-center gap-1 py-2 text-[11px] font-medium',
                active ? 'text-primary' : 'text-muted-foreground',
                item.comingSoon && 'pointer-events-none opacity-50',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground"
        >
          <Menu className="h-5 w-5" />
          More
        </button>
      </div>
    </nav>
  );
}
