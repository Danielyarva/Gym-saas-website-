import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { BottomNav } from './bottom-nav';
import { HamburgerMenu } from './hamburger-menu';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 pb-20 pt-4 sm:px-6 lg:pb-6 lg:pt-6">{children}</main>
      </div>
      <BottomNav />
      <HamburgerMenu />
    </div>
  );
}
