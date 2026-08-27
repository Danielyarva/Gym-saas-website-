'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTodayCheckIn, useSubmitCheckIn } from '@/hooks/use-checkins';
import { checkInFormSchema, moodOptions, energyOptions, adherenceOptions, type CheckInFormValues } from '@/schemas/checkin.schema';
import { ApiError } from '@/services/api-client';

const LABELS: Record<string, string> = {
  VERY_LOW: 'Very low',
  LOW: 'Low',
  NEUTRAL: 'Neutral',
  GOOD: 'Good',
  VERY_GOOD: 'Very good',
  POOR: 'Poor',
  FAIR: 'Fair',
  EXCELLENT: 'Excellent',
};

export function CheckInForm({ clientId }: { clientId: string }) {
  const { data: existing, isPending } = useTodayCheckIn(clientId);
  const submitCheckIn = useSubmitCheckIn(clientId);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.input<typeof checkInFormSchema>, undefined, CheckInFormValues>({
    resolver: zodResolver(checkInFormSchema),
    values: {
      weightKg: existing?.weightKg ?? undefined,
      workoutCompleted: existing?.workoutCompleted ?? false,
      steps: existing?.steps ?? undefined,
      sleepHours: existing?.sleepHours ?? undefined,
      mood: existing?.mood ?? undefined,
      energy: existing?.energy ?? undefined,
      nutritionAdherence: existing?.nutritionAdherence ?? undefined,
      notes: existing?.notes ?? '',
    },
  });

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const onSubmit = (values: CheckInFormValues) => {
    submitCheckIn.mutate(
      { ...values, notes: values.notes || undefined },
      {
        onSuccess: () => toast.success(existing ? "Today's check-in updated" : 'Check-in submitted — nice work!'),
        onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Daily check-in</p>
        <h1 className="text-lg font-semibold text-foreground">How did today go?</h1>
      </div>

      {existing ? (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-foreground">
          <CheckCircle2 className="h-4 w-4 text-success" /> You already checked in today — edit and resave anytime.
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input id="weightKg" type="number" step="0.1" {...register('weightKg')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="steps">Steps</Label>
            <Input id="steps" type="number" {...register('steps')} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sleepHours">Sleep (hours)</Label>
          <Input id="sleepHours" type="number" step="0.5" {...register('sleepHours')} />
        </div>

        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="workoutCompleted"
            render={({ field }) => <Checkbox id="workoutCompleted" checked={field.value} onCheckedChange={field.onChange} />}
          />
          <Label htmlFor="workoutCompleted" className="font-normal">
            Completed today&apos;s workout
          </Label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Mood</Label>
            <Controller
              control={control}
              name="mood"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {moodOptions.map((o) => (
                      <SelectItem key={o} value={o}>
                        {LABELS[o]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Energy</Label>
            <Controller
              control={control}
              name="energy"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {energyOptions.map((o) => (
                      <SelectItem key={o} value={o}>
                        {LABELS[o]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Nutrition</Label>
            <Controller
              control={control}
              name="nutritionAdherence"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {adherenceOptions.map((o) => (
                      <SelectItem key={o} value={o}>
                        {LABELS[o]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" rows={3} {...register('notes')} />
          {errors.notes ? <p className="text-xs text-destructive">{errors.notes.message}</p> : null}
        </div>

        <Button type="submit" className="w-full" disabled={submitCheckIn.isPending}>
          {submitCheckIn.isPending ? 'Saving…' : existing ? 'Update check-in' : 'Submit check-in'}
        </Button>
      </form>
    </div>
  );
}

