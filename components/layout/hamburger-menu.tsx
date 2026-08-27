'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useUiStore } from '@/stores/ui-store';
import { useLogout } from '@/hooks/use-auth';
import { NAV_ITEMS } from './nav-items';

export function HamburgerMenu() {
  const open = useUiStore((state) => state.mobileMenuOpen);
  const setOpen = useUiStore((state) => state.setMobileMenuOpen);
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="flex flex-col p-0">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Dumbbell className="h-4 w-4" />
            </div>
            AI Coach OS
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.comingSoon ? '#' : item.href}
                aria-disabled={item.comingSoon}
                onClick={() => !item.comingSoon && setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                } ${item.comingSoon ? 'pointer-events-none opacity-50' : ''}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.comingSoon ? (
                  <Badge variant="muted" className="text-[10px]">
                    Soon
                  </Badge>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
