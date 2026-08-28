export type Role = 'COACH' | 'CLIENT' | 'ADMIN';
export type ClientStatus = 'ON_TRACK' | 'NEEDS_ATTENTION' | 'AT_RISK' | 'INACTIVE';

export interface PublicUser {
  id: string;
  email: string;
  role: Role;
  emailVerified: boolean;
}

export interface PublicCoach {
  id: string;
  fullName: string;
  businessName: string | null;
  avatarUrl: string | null;
}

export interface PublicClient {
  id: string;
  fullName: string;
  email: string;
}

export interface InvitePreview {
  clientFullName: string;
  email: string;
  expiresAt: string;
}

export interface Session {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface DashboardActivityItem {
  id: string;
  action: string;
  entityId: string | null;
  summary: string;
  createdAt: string;
}

export interface DashboardData {
  activeClients: number;
  statusBreakdown: {
    onTrack: number;
    needsAttention: number;
    atRisk: number;
  };
  averageAdherencePct: number | null;
  averageProgressPct: number | null;
  clientProgressChart: { available: boolean; series: Array<{ date: string; value: number }> };
  recentActivity: DashboardActivityItem[];
  recentAlerts: DashboardActivityItem[];
  aiInsights: { available: boolean; items: string[] };
  upcomingTasks: { available: boolean; items: string[] };
}

export interface ClientSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: ClientStatus;
  adherencePct: number | null;
  currentWeightKg: number | null;
  goalWeightKg: number | null;
  goalText: string | null;
  lastCheckInAt: string | null;
  archivedAt: string | null;
}

export interface ClientProfileDetail {
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  heightCm: number | null;
  startingWeightKg: number | null;
  currentWeightKg: number | null;
  goalWeightKg: number | null;
  goalText: string | null;
}

export interface ClientDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  hasAccount: boolean;
  status: ClientStatus;
  adherencePct: number | null;
  progressPct: number | null;
  lastCheckInAt: string | null;
  archivedAt: string | null;
  assignedAt: string;
  profile: ClientProfileDetail | null;
}

export interface ClientListResult {
  items: ClientSummary[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ClientNote {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingGoal {
  type: string;
  targetValue: number | null;
  targetUnit: string | null;
  targetDate: string | null;
  notes: string | null;
}

export interface OnboardingBodyMeasurement {
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armsCm: number | null;
  hipsCm: number | null;
  thighsCm: number | null;
}

export interface OnboardingState {
  basicInfo: {
    fullName: string;
    phone: string | null;
    email: string;
    dateOfBirth: string | null;
    gender: string | null;
    heightCm: number | null;
  };
  goal: OnboardingGoal | null;
  bodyMeasurement: OnboardingBodyMeasurement | null;
  trainingExperience: string | null;
  trainingDaysPerWeek: number | null;
  equipmentList: string[];
  equipmentNotes: string | null;
  dietaryPreferences: string[];
  allergies: string[];
  mealsPerDayPreference: number | null;
  activityLevel: string | null;
  occupationType: string | null;
  stressLevel: number | null;
  typicalSleepHours: number | null;
  sleepQuality: string | null;
  injuriesOrLimitations: string | null;
  clearedForExercise: boolean | null;
  needsMedicalClearance: boolean;
  currentStep: number;
  completedAt: string | null;
}

export type WorkoutPlanStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type MuscleGroup = 'CHEST' | 'BACK' | 'SHOULDERS' | 'BICEPS' | 'TRICEPS' | 'LEGS' | 'GLUTES' | 'CORE' | 'CARDIO' | 'FULL_BODY' | 'OTHER';
export type EquipmentType = 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'CABLE' | 'BODYWEIGHT' | 'KETTLEBELL' | 'BAND' | 'OTHER';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type WorkoutLogStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface Exercise {
  id: string;
  coachId: string | null;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: EquipmentType;
  difficulty: Difficulty;
  instructions: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
}

export interface WorkoutExerciseDetail {
  id: string;
  order: number;
  sets: number;
  reps: string;
  weightKg: number | null;
  restSeconds: number | null;
  tempo: string | null;
  notes: string | null;
  exercise: Exercise;
}

export interface WorkoutDayDetail {
  id: string;
  label: string;
  order: number;
  isRestDay: boolean;
  dayOfWeek: number | null;
  notes: string | null;
  exercises: WorkoutExerciseDetail[];
}

export interface WorkoutPlanSummary {
  id: string;
  name: string;
  description: string | null;
  status: WorkoutPlanStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface WorkoutPlanDetail extends WorkoutPlanSummary {
  days: WorkoutDayDetail[];
}

export interface TodayWorkoutExercise {
  id: string;
  order: number;
  sets: number;
  reps: string;
  weightKg: number | null;
  restSeconds: number | null;
  tempo: string | null;
  notes: string | null;
  exercise: Exercise;
  log: { id: string; completed: boolean; actualSets: number | null; actualReps: string | null; actualWeightKg: number | null } | null;
}

export interface TodayWorkout {
  plan: { id: string; name: string };
  day: { id: string; label: string; notes: string | null; exercises: TodayWorkoutExercise[] } | null;
  log: { id: string; status: WorkoutLogStatus; date: string } | null;
}

export type NutritionPlanStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface NutritionTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export interface NutritionFoodDetail {
  id: string;
  order: number;
  name: string;
  quantity: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export interface NutritionMealDetail {
  id: string;
  type: MealType;
  order: number;
  name: string | null;
  foods: NutritionFoodDetail[];
  totals: NutritionTotals;
}

export interface NutritionPlanSummary {
  id: string;
  name: string;
  status: NutritionPlanStatus;
  dailyWaterTargetMl: number | null;
  notes: string | null;
  createdAt: string;
}

export interface NutritionPlanDetail extends NutritionPlanSummary {
  meals: NutritionMealDetail[];
  dailyTotals: NutritionTotals;
}

export type MoodLevel = 'VERY_LOW' | 'LOW' | 'NEUTRAL' | 'GOOD' | 'VERY_GOOD';
export type EnergyLevel = 'VERY_LOW' | 'LOW' | 'NEUTRAL' | 'GOOD' | 'VERY_GOOD';
export type AdherenceLevel = 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';

export interface DailyCheckIn {
  id: string;
  date: string;
  weightKg: number | null;
  workoutCompleted: boolean | null;
  steps: number | null;
  sleepHours: number | null;
  mood: MoodLevel | null;
  energy: EnergyLevel | null;
  nutritionAdherence: AdherenceLevel | null;
  notes: string | null;
}

export interface CheckInListResult {
  checkIns: DailyCheckIn[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProgressPhoto {
  id: string;
  url: string;
  takenAt: string;
  notes: string | null;
}

export interface ProgressPhotoListResult {
  items: ProgressPhoto[];
  total: number;
  page: number;
  pageSize: number;
}

export type ProgressRange = 'WEEKLY' | 'MONTHLY' | '3M' | '6M' | 'ALL';

export interface ProgressPoint {
  date: string;
  value: number;
}

export interface ProgressCharts {
  weight: ProgressPoint[];
  waistCm: ProgressPoint[];
  chestCm: ProgressPoint[];
  armsCm: ProgressPoint[];
  hipsCm: ProgressPoint[];
  thighsCm: ProgressPoint[];
  steps: ProgressPoint[];
  sleepHours: ProgressPoint[];
  workoutAdherence: ProgressPoint[];
  nutritionAdherence: ProgressPoint[];
}

export type AiMessageRole = 'USER' | 'ASSISTANT';

export interface AiMessage {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAt: string;
}

export interface AiChatListResult {
  messages: AiMessage[];
  total: number;
  page: number;
  pageSize: number;
}

export type AiRiskLevel = 'GREEN' | 'YELLOW' | 'RED';

export interface AiInsight {
  id: string;
  checkInId: string | null;
  riskLevel: AiRiskLevel;
  confidence: number;
  insights: string[];
  recommendedActions: string[];
  reasoning: string;
  createdAt: string;
}

export interface AiInsightListResult {
  insights: AiInsight[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  overallProgressPct: number | null;
  weightChangeKg: number | null;
  workoutAdherencePct: number | null;
  nutritionAdherencePct: number | null;
  avgSteps: number | null;
  avgSleepHours: number | null;
  wins: string[];
  problems: string[];
  aiSummary: string;
  suggestedActions: string[];
  createdAt: string;
}

export interface WeeklyReportListResult {
  reports: WeeklyReport[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CoachWeeklyReport extends WeeklyReport {
  client: { id: string; fullName: string };
}

export interface CoachReportListResult {
  reports: CoachWeeklyReport[];
  total: number;
  page: number;
  pageSize: number;
}

export type MessageSenderRole = 'COACH' | 'CLIENT';

export interface Message {
  id: string;
  senderRole: MessageSenderRole;
  content: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface MessageListResult {
  messages: Message[];
  total: number;
  page: number;
  pageSize: number;
  otherPartyTyping: boolean;
}

export interface CoachConversationSummary {
  client: { id: string; fullName: string };
  lastMessage: Message | null;
  unreadCount: number;
}

export interface ConversationListResult {
  conversations: CoachConversationSummary[];
}

export type NotificationType = 'CLIENT_CHECKIN' | 'CLIENT_AT_RISK' | 'MISSED_WORKOUT' | 'WEEKLY_REPORT' | 'NEW_MESSAGE' | 'SUBSCRIPTION' | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResult {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  message: string;
}
