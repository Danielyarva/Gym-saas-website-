'use client';

import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateWorkoutDay, useUpdateWorkoutDay } from '@/hooks/use-workout-plans';
import { dayFormSchema, type DayFormValues } from '@/schemas/workout-plan.schema';
import { ApiError } from '@/services/api-client';
import type { WorkoutDayDetail } from '@/types';

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DayFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  planId: string;
  day?: WorkoutDayDetail;
}

export function DayFormDialog({ open, onOpenChange, clientId, planId, day }: DayFormDialogProps) {
  const createDay = useCreateWorkoutDay(clientId, planId);
  const updateDay = useUpdateWorkoutDay(clientId, planId);
  const isEditing = Boolean(day);
  const isPending = createDay.isPending || updateDay.isPending;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof dayFormSchema>, undefined, DayFormValues>({
    resolver: zodResolver(dayFormSchema),
    values: {
      label: day?.label ?? '',
      isRestDay: day?.isRestDay ?? false,
      dayOfWeek: day?.dayOfWeek ?? undefined,
      notes: day?.notes ?? '',
    },
  });
  const isRestDay = useWatch({ control, name: 'isRestDay' });

  const onSubmit = (values: DayFormValues) => {
    const input = {
      label: values.label,
      isRestDay: values.isRestDay ?? false,
      dayOfWeek: values.dayOfWeek,
      notes: values.notes || undefined,
    };

    const onSuccess = () => {
      toast.success(isEditing ? 'Day updated' : 'Day added');
      reset();
      onOpenChange(false);
    };
    const onError = (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong');

    if (isEditing && day) {
      updateDay.mutate({ dayId: day.id, input }, { onSuccess, onError });
    } else {
      createDay.mutate(input, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit day' : 'Add a day'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="label">Day label</Label>
            <Input id="label" placeholder="e.g. Push Day" {...register('label')} />
            {errors.label ? <p className="text-xs text-destructive">{errors.label.message}</p> : null}
          </div>

          <div className="flex items-center gap-2">
            <Controller control={control} name="isRestDay" render={({ field }) => <Checkbox id="isRestDay" checked={field.value} onCheckedChange={field.onChange} />} />
            <Label htmlFor="isRestDay" className="font-normal">
              This is a rest day
            </Label>
          </div>

          {!isRestDay ? (
            <div className="space-y-2">
              <Label>Fixed weekday (optional)</Label>
              <Controller
                control={control}
                name="dayOfWeek"
                render={({ field }) => (
                  <Select value={field.value === undefined ? 'none' : String(field.value)} onValueChange={(v) => field.onChange(v === 'none' ? undefined : Number(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No fixed day — follow plan order</SelectItem>
                      {WEEKDAY_LABELS.map((label, index) => (
                        <SelectItem key={label} value={String(index)}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Add day'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
