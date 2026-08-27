'use client';

import { useParams } from 'next/navigation';
import { UtensilsCrossed } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComingSoon } from '@/components/clients/profile/coming-soon';
import { WorkoutPlanBuilder } from '@/components/workouts/workout-plan-builder';

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
        <ComingSoon icon={UtensilsCrossed} feature="Nutrition plans" phase={2} />
      </TabsContent>
    </Tabs>
  );
}
