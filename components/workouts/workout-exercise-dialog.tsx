'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExercisePickerDialog } from './exercise-picker-dialog';
import { useCreateWorkoutExercise, useUpdateWorkoutExercise } from '@/hooks/use-workout-plans';
import { workoutExerciseFormSchema, type WorkoutExerciseFormValues } from '@/schemas/workout-plan.schema';
import { ApiError } from '@/services/api-client';
import type { Exercise, WorkoutExerciseDetail } from '@/types';

interface WorkoutExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  planId: string;
  dayId: string;
  existing?: WorkoutExerciseDetail;
}

/** Add flow picks an exercise first (nested picker dialog), then collects sets/reps/etc; edit flow skips straight to the details form since the exercise itself is fixed. */
export function WorkoutExerciseDialog({ open, onOpenChange, clientId, planId, dayId, existing }: WorkoutExerciseDialogProps) {
  const [pickerOpen, setPickerOpen] = useState(!existing);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | undefined>(existing?.exercise);

  // Resets the two-stage flow (pick -> details) whenever the dialog opens —
  // adjusted during render rather than in an effect, per React's guidance
  // for resetting state in response to a prop change.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setPickerOpen(!existing);
      setSelectedExercise(existing?.exercise);
    }
  }

  const createExercise = useCreateWorkoutExercise(clientId, planId);
  const updateExercise = useUpdateWorkoutExercise(clientId, planId);
  const isPending = createExercise.isPending || updateExercise.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof workoutExerciseFormSchema>, undefined, WorkoutExerciseFormValues>({
    resolver: zodResolver(workoutExerciseFormSchema),
    values: {
      sets: existing?.sets ?? 3,
      reps: existing?.reps ?? '8-12',
      weightKg: existing?.weightKg ?? undefined,
      restSeconds: existing?.restSeconds ?? undefined,
      tempo: existing?.tempo ?? '',
      notes: existing?.notes ?? '',
    },
  });

  const onSubmit = (values: WorkoutExerciseFormValues) => {
    if (!selectedExercise) return;
    const input = {
      exerciseId: selectedExercise.id,
      sets: values.sets,
      reps: values.reps,
      weightKg: values.weightKg,
      restSeconds: values.restSeconds,
      tempo: values.tempo || undefined,
      notes: values.notes || undefined,
    };

    const onSuccess = () => {
      toast.success(existing ? 'Exercise updated' : 'Exercise added');
      reset();
      onOpenChange(false);
    };
    const onError = (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong');

    if (existing) {
      updateExercise.mutate({ dayId, workoutExerciseId: existing.id, input }, { onSuccess, onError });
    } else {
      createExercise.mutate({ dayId, input }, { onSuccess, onError });
    }
  };

  return (
    <>
      <ExercisePickerDialog
        open={open && pickerOpen}
        onOpenChange={(next) => {
          setPickerOpen(next);
          if (!next && !selectedExercise) onOpenChange(false);
        }}
        onSelect={(exercise) => {
          setSelectedExercise(exercise);
          setPickerOpen(false);
        }}
      />

      <Dialog open={open && !pickerOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{existing ? 'Edit exercise' : selectedExercise?.name}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {existing ? <p className="text-sm font-medium text-foreground">{existing.exercise.name}</p> : null}

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sets">Sets</Label>
                <Input id="sets" type="number" {...register('sets')} />
                {errors.sets ? <p className="text-xs text-destructive">{errors.sets.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reps">Reps</Label>
                <Input id="reps" placeholder="8-12" {...register('reps')} />
                {errors.reps ? <p className="text-xs text-destructive">{errors.reps.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightKg">Weight (kg)</Label>
                <Input id="weightKg" type="number" step="0.5" placeholder="Bodyweight" {...register('weightKg')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="restSeconds">Rest (seconds)</Label>
                <Input id="restSeconds" type="number" {...register('restSeconds')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempo">Tempo (optional)</Label>
                <Input id="tempo" placeholder="e.g. 2-0-2" {...register('tempo')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" rows={2} {...register('notes')} />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : existing ? 'Save changes' : 'Add exercise'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
