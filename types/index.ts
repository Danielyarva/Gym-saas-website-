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
