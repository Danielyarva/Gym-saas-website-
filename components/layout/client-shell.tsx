'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Dumbbell as LogoIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/use-auth';
import { CLIENT_NAV_ITEMS } from './client-nav-items';

/** The client app's entire shell: a slim header (logo + logout) and a fixed bottom nav. Deliberately simpler than the coach dashboard's sidebar/hamburger — the client surface is only ever these four pages. */
export function ClientShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LogoIcon className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-foreground">AI Coach OS</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => logout.mutate(undefined, { onSuccess: () => router.replace('/login') })} aria-label="Log out">
          <LogOut />
        </Button>
      </header>

      <main className="mx-auto w-full max-w-lg space-y-6 px-4 py-6 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {CLIENT_NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('flex flex-col items-center gap-1 py-2 text-[11px] font-medium', active ? 'text-primary' : 'text-muted-foreground')}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
