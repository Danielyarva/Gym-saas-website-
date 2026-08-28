import { clientRepository } from '../repositories/client.repository';
import { goalRepository } from '../repositories/goal.repository';
import { workoutPlanRepository } from '../repositories/workout-plan.repository';
import { nutritionPlanRepository } from '../repositories/nutrition-plan.repository';
import { checkinRepository } from '../repositories/checkin.repository';
import { bodyMeasurementRepository } from '../repositories/body-measurement.repository';
import { clientNoteRepository } from '../repositories/client-note.repository';

const RECENT_CHECK_INS = 7;
const RECENT_NOTES = 5;

function section(title: string, body: string): string {
  return `## ${title}\n${body}`;
}

/**
 * Assembles exactly what PRD §16 asks for — client profile + goals +
 * approved (active) workout/nutrition plan + recent check-ins + recent
 * progress + coach notes — into one bounded text block. This is the *only*
 * thing ever sent to the model; nothing else in the app builds a prompt
 * from raw data ("do not blindly send the entire database to the AI").
 */
export async function buildClientContext(clientId: string): Promise<string> {
  const [client, goal, workoutPlan, nutritionPlan, recentCheckIns, latestMeasurement, recentNotes] = await Promise.all([
    clientRepository.findOwnProfile(clientId),
    goalRepository.findPrimary(clientId),
    workoutPlanRepository.findActiveForClient(clientId),
    nutritionPlanRepository.findActiveForClient(clientId),
    checkinRepository.listForClient(clientId, { page: 1, pageSize: RECENT_CHECK_INS }),
    bodyMeasurementRepository.findLatest(clientId),
    clientNoteRepository.listForClient(clientId, RECENT_NOTES),
  ]);

  const sections: string[] = [];

  sections.push(
    section(
      'Client profile',
      [
        `Name: ${client?.fullName ?? 'Unknown'}`,
        client?.profile?.heightCm ? `Height: ${client.profile.heightCm}cm` : null,
        client?.profile?.startingWeightKg ? `Starting weight: ${client.profile.startingWeightKg}kg` : null,
        client?.profile?.currentWeightKg ? `Current weight: ${client.profile.currentWeightKg}kg` : null,
        client?.profile?.goalWeightKg ? `Goal weight: ${client.profile.goalWeightKg}kg` : null,
      ]
        .filter(Boolean)
        .join('\n') || 'No profile data yet.',
    ),
  );

  sections.push(
    section(
      'Current goal',
      goal
        ? [`Type: ${goal.type}`, goal.targetValue ? `Target: ${goal.targetValue} ${goal.targetUnit ?? ''}` : null, goal.notes ? `Notes: ${goal.notes}` : null]
            .filter(Boolean)
            .join('\n')
        : 'No goal set yet.',
    ),
  );

  sections.push(
    section(
      'Approved workout plan',
      workoutPlan
        ? `"${workoutPlan.name}" — ${workoutPlan.days.length} day(s): ${workoutPlan.days
            .map((day) => `${day.label}${day.isRestDay ? ' (rest)' : ` (${day.exercises.length} exercises)`}`)
            .join(', ')}`
        : 'No active workout plan.',
    ),
  );

  sections.push(
    section(
      'Approved nutrition plan',
      nutritionPlan
        ? `"${nutritionPlan.name}" — ${nutritionPlan.meals.length} meal(s): ${nutritionPlan.meals.map((meal) => meal.name || meal.type).join(', ')}`
        : 'No active nutrition plan.',
    ),
  );

  const [checkIns] = recentCheckIns;
  sections.push(
    section(
      `Recent check-ins (last ${RECENT_CHECK_INS})`,
      checkIns.length > 0
        ? checkIns
            .map((checkIn) => {
              const date = checkIn.date.toISOString().slice(0, 10);
              const parts = [
                checkIn.weightKg != null ? `weight ${checkIn.weightKg}kg` : null,
                checkIn.workoutCompleted != null ? `workout ${checkIn.workoutCompleted ? 'done' : 'skipped'}` : null,
                checkIn.steps != null ? `${checkIn.steps} steps` : null,
                checkIn.sleepHours != null ? `${checkIn.sleepHours}h sleep` : null,
                checkIn.mood ? `mood ${checkIn.mood}` : null,
                checkIn.nutritionAdherence ? `nutrition ${checkIn.nutritionAdherence}` : null,
              ]
                .filter(Boolean)
                .join(', ');
              return `- ${date}: ${parts || 'no data recorded'}`;
            })
            .join('\n')
        : 'No check-ins yet.',
    ),
  );

  sections.push(
    section(
      'Latest body measurements',
      latestMeasurement
        ? [
            latestMeasurement.waistCm ? `waist ${latestMeasurement.waistCm}cm` : null,
            latestMeasurement.chestCm ? `chest ${latestMeasurement.chestCm}cm` : null,
            latestMeasurement.armsCm ? `arms ${latestMeasurement.armsCm}cm` : null,
            latestMeasurement.hipsCm ? `hips ${latestMeasurement.hipsCm}cm` : null,
            latestMeasurement.thighsCm ? `thighs ${latestMeasurement.thighsCm}cm` : null,
          ]
            .filter(Boolean)
            .join(', ') || 'No measurements recorded.'
        : 'No measurements recorded.',
    ),
  );

  sections.push(
    section(
      `Coach notes (last ${RECENT_NOTES})`,
      recentNotes.length > 0 ? recentNotes.map((note) => `- ${note.body}`).join('\n') : 'No coach notes.',
    ),
  );

  return sections.join('\n\n');
}
