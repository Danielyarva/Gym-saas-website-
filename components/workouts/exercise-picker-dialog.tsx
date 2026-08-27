'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Plus, Dumbbell } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useExercises, useCreateExercise } from '@/hooks/use-exercises';
import { customExerciseFormSchema, muscleGroupOptions, equipmentOptions, difficultyOptions, type CustomExerciseFormValues } from '@/schemas/workout-plan.schema';
import { ApiError } from '@/services/api-client';
import type { Exercise, MuscleGroup } from '@/types';

interface ExercisePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePickerDialog({ open, onOpenChange, onSelect }: ExercisePickerDialogProps) {
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | 'ALL'>('ALL');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: exercises, isPending } = useExercises({
    search: search || undefined,
    muscleGroup: muscleGroup === 'ALL' ? undefined : muscleGroup,
  });
  const createExercise = useCreateExercise();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof customExerciseFormSchema>, undefined, CustomExerciseFormValues>({ resolver: zodResolver(customExerciseFormSchema) });

  const onCreateSubmit = (values: CustomExerciseFormValues) => {
    createExercise.mutate(values, {
      onSuccess: (exercise) => {
        toast.success('Exercise added to your library');
        reset();
        setShowCreateForm(false);
        onSelect(exercise);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setShowCreateForm(false);
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{showCreateForm ? 'Create a custom exercise' : 'Choose an exercise'}</DialogTitle>
        </DialogHeader>

        {showCreateForm ? (
          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="ex-name">Name</Label>
              <Input id="ex-name" {...register('name')} />
              {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Muscle group</Label>
                <Controller
                  control={control}
                  name="muscleGroup"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {muscleGroupOptions.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Equipment</Label>
                <Controller
                  control={control}
                  name="equipment"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentOptions.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Controller
                  control={control}
                  name="difficulty"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {difficultyOptions.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>
                Back to library
              </Button>
              <Button type="submit" disabled={createExercise.isPending}>
                {createExercise.isPending ? 'Adding…' : 'Add & use'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Search exercises…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
              <Select value={muscleGroup} onValueChange={(v) => setMuscleGroup(v as MuscleGroup | 'ALL')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All muscle groups</SelectItem>
                  {muscleGroupOptions.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : exercises && exercises.length > 0 ? (
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {exercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => onSelect(exercise)}
                    className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-medium text-foreground">{exercise.name}</span>
                    <span className="flex gap-1.5">
                      <Badge variant="secondary">{exercise.muscleGroup.replace('_', ' ')}</Badge>
                      <Badge variant="outline">{exercise.equipment}</Badge>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState icon={Dumbbell} title="No exercises found" description="Try a different search, or add a custom exercise." />
            )}

            <Button type="button" variant="outline" className="w-full" onClick={() => setShowCreateForm(true)}>
              <Plus /> Add a custom exercise
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
