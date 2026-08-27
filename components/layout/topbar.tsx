'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/stores/ui-store';
import { UserMenu } from './user-menu';

export function Topbar() {
  const setMobileMenuOpen = useUiStore((state) => state.setMobileMenuOpen);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1" />
      <UserMenu />
    </header>
  );
}
