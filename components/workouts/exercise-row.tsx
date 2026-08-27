'use client';

import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WorkoutExerciseDetail } from '@/types';

interface ExerciseRowProps {
  exercise: WorkoutExerciseDetail;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ExerciseRow({ exercise, isFirst, isLast, onMoveUp, onMoveDown, onEdit, onDelete }: ExerciseRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{exercise.exercise.name}</p>
          <Badge variant="secondary">{exercise.exercise.muscleGroup.replace('_', ' ')}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {exercise.sets} sets × {exercise.reps}
          {exercise.weightKg !== null ? ` @ ${exercise.weightKg}kg` : ''}
          {exercise.restSeconds !== null ? ` · ${exercise.restSeconds}s rest` : ''}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" disabled={isFirst} onClick={onMoveUp} aria-label="Move exercise up">
          <ArrowUp />
        </Button>
        <Button variant="ghost" size="icon" disabled={isLast} onClick={onMoveDown} aria-label="Move exercise down">
          <ArrowDown />
        </Button>
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit exercise">
          <Pencil />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Remove exercise">
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
