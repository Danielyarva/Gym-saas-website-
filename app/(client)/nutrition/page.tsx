'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivePlanView } from '@/components/client-app/nutrition/active-plan-view';
import { useMe, useLogout } from '@/hooks/use-auth';

export default function NutritionPage() {
  const router = useRouter();
  const { data: me } = useMe();
  const logout = useLogout();
  const clientId = me?.client?.id ?? '';

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Dumbbell className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-foreground">AI Coach OS</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/today" className="text-muted-foreground hover:text-foreground">
            Today
          </Link>
          <span className="font-medium text-foreground">Nutrition</span>
        </nav>
        <Button variant="ghost" size="icon" onClick={() => logout.mutate(undefined, { onSuccess: () => router.replace('/login') })} aria-label="Log out">
          <LogOut />
        </Button>
      </header>

      <main className="mx-auto w-full max-w-lg space-y-6 px-4 py-6">
        <ActivePlanView clientId={clientId} />
      </main>
    </div>
  );
}
