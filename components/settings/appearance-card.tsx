'use client';

import { Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useThemeStore, type Theme } from '@/stores/theme-store';

const OPTIONS: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

export function AppearanceCard() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose how AI Coach OS looks on this device. Your choice is remembered for next time.</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        {OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={theme === option.value ? 'default' : 'outline'}
            className={cn('gap-2')}
            onClick={() => setTheme(option.value)}
            aria-pressed={theme === option.value}
          >
            <option.icon className="h-4 w-4" />
            {option.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
