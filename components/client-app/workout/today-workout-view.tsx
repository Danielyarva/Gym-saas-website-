'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarOff, Dumbbell, PartyPopper } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { RestTimer } from '@/components/ui/rest-timer';
import { useTodayWorkout, useMarkExercise, useCompleteWorkout } from '@/hooks/use-workout';
import { ApiError } from '@/services/api-client';
import type { TodayWorkoutExercise } from '@/types';

function ExerciseItem({ clientId, exercise }: { clientId: string; exercise: TodayWorkoutExercise }) {
  const markExercise = useMarkExercise(clientId);
  const [restingSeconds, setRestingSeconds] = useState<number | null>(null);
  const completed = exercise.log?.completed ?? false;

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-start gap-3">
        <Checkbox
          className="mt-1"
          checked={completed}
          onCheckedChange={(checked) => {
            markExercise.mutate(
              { workoutExerciseId: exercise.id, input: { completed: checked === true, actualSets: exercise.sets, actualReps: exercise.reps } },
              {
                onSuccess: () => {
                  if (checked === true && exercise.restSeconds) setRestingSeconds(exercise.restSeconds);
                },
                onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
              },
            );
          }}
        />
        <div className="flex-1">
          <p className={`text-sm font-medium ${completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{exercise.exercise.name}</p>
          <p className="text-xs text-muted-foreground">
            {exercise.sets} sets × {exercise.reps}
            {exercise.weightKg !== null ? ` @ ${exercise.weightKg}kg` : ''}
          </p>
          {exercise.notes ? <p className="text-xs text-muted-foreground">{exercise.notes}</p> : null}
        </div>
      </div>

      {restingSeconds ? <RestTimer seconds={restingSeconds} onDismiss={() => setRestingSeconds(null)} /> : null}
    </div>
  );
}

export function TodayWorkoutView({ clientId }: { clientId: string }) {
  const { data, isPending, isError, error } = useTodayWorkout(clientId);
  const completeWorkout = useCompleteWorkout(clientId);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    const noActivePlan = error instanceof ApiError && error.code === 'PLAN_NOT_ACTIVE';
    return (
      <EmptyState
        icon={Dumbbell}
        title={noActivePlan ? 'No active workout plan yet' : "Couldn't load today's workout"}
        description={noActivePlan ? 'Your coach hasn\'t assigned a workout plan yet.' : undefined}
      />
    );
  }

  if (!data.day) {
    return <EmptyState icon={CalendarOff} title="Rest day" description="No workout scheduled for today. Recovery is part of the plan." />;
  }

  const allCompleted = data.day.exercises.every((e) => e.log?.completed);
  const alreadyDone = data.log?.status === 'COMPLETED';

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{data.plan.name}</p>
        <h1 className="text-lg font-semibold text-foreground">{data.day.label}</h1>
        {data.day.notes ? <p className="text-sm text-muted-foreground">{data.day.notes}</p> : null}
      </div>

      <div className="space-y-2">
        {data.day.exercises.map((exercise) => (
          <ExerciseItem key={exercise.id} clientId={clientId} exercise={exercise} />
        ))}
      </div>

      {alreadyDone ? (
        <EmptyState icon={PartyPopper} title="Workout complete" description="Nice work — see you next session." />
      ) : (
        <Button
          className="w-full"
          disabled={completeWorkout.isPending}
          onClick={() =>
            completeWorkout.mutate(undefined, {
              onSuccess: () => toast.success('Workout complete — great job!'),
              onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
            })
          }
        >
          {completeWorkout.isPending ? 'Finishing…' : allCompleted ? 'Finish workout' : 'Finish workout anyway'}
        </Button>
      )}
    </div>
  );
}
