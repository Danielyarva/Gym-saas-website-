'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';
import { NAV_ITEMS } from './nav-items';

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 lg:flex',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className={cn('flex h-14 items-center gap-2 border-b border-border px-4', collapsed && 'justify-center px-0')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Dumbbell className="h-4 w-4" />
        </div>
        {!collapsed ? <span className="truncate text-sm font-semibold text-foreground">AI Coach OS</span> : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const content = (
            <span
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                item.comingSoon && 'pointer-events-none opacity-50',
                collapsed && 'justify-center px-0',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
              {!collapsed && item.comingSoon ? (
                <Badge variant="muted" className="text-[10px]">
                  Soon
                </Badge>
              ) : null}
            </span>
          );

          return item.comingSoon ? (
            <div key={item.href}>{content}</div>
          ) : (
            <Link key={item.href} href={item.href}>
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        <Button variant="ghost" size="sm" className="w-full justify-center" onClick={toggleSidebar}>
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
