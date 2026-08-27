'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DayFormDialog } from './day-form-dialog';
import { WorkoutExerciseDialog } from './workout-exercise-dialog';
import { ExerciseRow } from './exercise-row';
import { useDeleteWorkoutDay, useDeleteWorkoutExercise, useReorderWorkoutExercises } from '@/hooks/use-workout-plans';
import { ApiError } from '@/services/api-client';
import type { WorkoutDayDetail, WorkoutExerciseDetail } from '@/types';

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DayCardProps {
  clientId: string;
  planId: string;
  day: WorkoutDayDetail;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function DayCard({ clientId, planId, day, isFirst, isLast, onMoveUp, onMoveDown }: DayCardProps) {
  const [editDayOpen, setEditDayOpen] = useState(false);
  const [deleteDayOpen, setDeleteDayOpen] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<WorkoutExerciseDetail | undefined>();
  const [deletingExercise, setDeletingExercise] = useState<WorkoutExerciseDetail | undefined>();

  const deleteDay = useDeleteWorkoutDay(clientId, planId);
  const deleteExercise = useDeleteWorkoutExercise(clientId, planId);
  const reorderExercises = useReorderWorkoutExercises(clientId, planId);

  function moveExercise(index: number, direction: -1 | 1) {
    const ids = day.exercises.map((e) => e.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= ids.length) return;
    [ids[index], ids[targetIndex]] = [ids[targetIndex]!, ids[index]!];
    reorderExercises.mutate({ dayId: day.id, orderedIds: ids });
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{day.label}</p>
          {day.isRestDay ? <Badge variant="muted">Rest day</Badge> : null}
          {day.dayOfWeek !== null ? <Badge variant="outline">{WEEKDAY_LABELS[day.dayOfWeek]}</Badge> : null}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" disabled={isFirst} onClick={onMoveUp} aria-label="Move day up">
            <ArrowUp />
          </Button>
          <Button variant="ghost" size="icon" disabled={isLast} onClick={onMoveDown} aria-label="Move day down">
            <ArrowDown />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setEditDayOpen(true)} aria-label="Edit day">
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteDayOpen(true)} aria-label="Delete day">
            <Trash2 />
          </Button>
        </div>
      </div>

      {!day.isRestDay ? (
        <div className="space-y-2 p-4">
          {day.exercises.map((exercise, index) => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              isFirst={index === 0}
              isLast={index === day.exercises.length - 1}
              onMoveUp={() => moveExercise(index, -1)}
              onMoveDown={() => moveExercise(index, 1)}
              onEdit={() => setEditingExercise(exercise)}
              onDelete={() => setDeletingExercise(exercise)}
            />
          ))}

          <Button variant="outline" size="sm" onClick={() => setAddExerciseOpen(true)}>
            <Plus /> Add exercise
          </Button>
        </div>
      ) : null}

      <DayFormDialog open={editDayOpen} onOpenChange={setEditDayOpen} clientId={clientId} planId={planId} day={day} />

      <ConfirmDialog
        open={deleteDayOpen}
        onOpenChange={setDeleteDayOpen}
        title={`Delete "${day.label}"?`}
        description="This removes the day and every exercise in it. This can't be undone."
        confirmLabel="Delete"
        destructive
        isPending={deleteDay.isPending}
        onConfirm={() =>
          deleteDay.mutate(day.id, {
            onSuccess: () => {
              toast.success('Day deleted');
              setDeleteDayOpen(false);
            },
            onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
          })
        }
      />

      <WorkoutExerciseDialog open={addExerciseOpen} onOpenChange={setAddExerciseOpen} clientId={clientId} planId={planId} dayId={day.id} />

      {editingExercise ? (
        <WorkoutExerciseDialog
          open={Boolean(editingExercise)}
          onOpenChange={(next) => !next && setEditingExercise(undefined)}
          clientId={clientId}
          planId={planId}
          dayId={day.id}
          existing={editingExercise}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingExercise)}
        onOpenChange={(next) => !next && setDeletingExercise(undefined)}
        title={`Remove "${deletingExercise?.exercise.name}"?`}
        description="This removes the exercise from this day."
        confirmLabel="Remove"
        destructive
        isPending={deleteExercise.isPending}
        onConfirm={() => {
          if (!deletingExercise) return;
          deleteExercise.mutate(
            { dayId: day.id, workoutExerciseId: deletingExercise.id },
            {
              onSuccess: () => {
                toast.success('Exercise removed');
                setDeletingExercise(undefined);
              },
              onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
            },
          );
        }}
      />
    </div>
  );
}
