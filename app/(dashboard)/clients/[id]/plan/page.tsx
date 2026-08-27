'use client';

import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkoutPlanBuilder } from '@/components/workouts/workout-plan-builder';
import { NutritionPlanBuilder } from '@/components/nutrition/nutrition-plan-builder';

export default function ClientPlanPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <Tabs defaultValue="workout">
      <TabsList>
        <TabsTrigger value="workout">Workout</TabsTrigger>
        <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
      </TabsList>

      <TabsContent value="workout">
        <WorkoutPlanBuilder clientId={id} />
      </TabsContent>

      <TabsContent value="nutrition">
        <NutritionPlanBuilder clientId={id} />
      </TabsContent>
    </Tabs>
  );
}
