'use client';

import { useEffect, useState } from 'react';
import { Timer, X } from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { cn } from '@/lib/utils';

interface RestTimerProps {
  seconds: number;
  onDismiss: () => void;
  className?: string;
}

/** A plain countdown via setInterval — no push notifications, no background timers; the tab has to stay open. Dismisses itself at zero. */
export function RestTimer({ seconds, onDismiss, className }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  // Restarts the countdown when `seconds` changes — adjusted during render
  // rather than in an effect, per React's guidance for resetting state in
  // response to a prop change.
  const [prevSeconds, setPrevSeconds] = useState(seconds);
  if (seconds !== prevSeconds) {
    setPrevSeconds(seconds);
    setRemaining(seconds);
  }

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(interval);
  }, [remaining]);

  useEffect(() => {
    if (remaining === 0) onDismiss();
  }, [remaining, onDismiss]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className={cn('flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3', className)}>
      <Timer className="h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">
          Resting — {minutes}:{String(secs).padStart(2, '0')}
        </p>
        <Progress value={((seconds - remaining) / seconds) * 100} />
      </div>
      <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss rest timer">
        <X />
      </Button>
    </div>
  );
}
