export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserMe {
  id: string;
  email: string;
  display_name: string;
  onboarding_completed: boolean;
}

export interface Profile {
  onboarding_completed: boolean;
  display_name?: string | null;
  age?: number | null;
  biological_sex?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  training_experience?: string | null;
  primary_goal?: string | null;
  days_per_week?: number | null;
  session_duration_minutes?: number | null;
  gym_access?: string | null;
  injuries?: string[] | null;
  injury_notes?: string | null;
  preferred_style?: string | null;
  can_pushups?: boolean | null;
  can_squat?: boolean | null;
  cardio_level?: string | null;
  strength_level?: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  sets: number;
  reps: string;
  rest_seconds: number;
  tempo: string | null;
  target_rpe: number | null;
  instructions: string | null;
  video_url: string | null;
  image_url: string | null;
  alternatives: string[] | null;
}

export interface Workout {
  id: string;
  day_label: string;
  day_index: number;
  week_number: number;
  estimated_minutes: number;
  exercises: Exercise[];
  is_completed?: boolean;
  completed_at?: string | null;
  adaptation_summary?: string | null;
}

export interface PlanSummary {
  id: string;
  program_name: string;
  weekly_split: string;
  rationale: string | null;
  workouts: Workout[];
}

export interface SessionExerciseLog {
  planned_exercise_id: string;
  completed_sets: number;
  completed_reps?: string | null;
  load_kg?: number | null;
  rpe?: number | null;
  notes?: string | null;
}

export interface SessionExerciseLogInput {
  planned_exercise_id: string;
  completed_sets: number;
  completed_reps?: string | null;
  load_kg?: number | null;
  rpe?: number | null;
  notes?: string | null;
}

export interface Session {
  id: string;
  planned_workout_id: string;
  status: string;
  completed: boolean;
  perceived_effort?: number | null;
  energy_level?: number | null;
  soreness_level?: number | null;
  difficulty_level?: number | null;
  notes?: string | null;
  adaptation_summary?: string | null;
  started_at: string;
  finished_at?: string | null;
  exercise_logs?: SessionExerciseLog[];
}

export interface ProgressPoint {
  date: string;
  value: number;
}

export interface ProgressSummary {
  adherence_pct: number;
  completed_workouts: number;
  total_sessions: number;
  streak_days: number;
  total_volume_kg: number;
  latest_weight_kg: number | null;
  weight_progression: ProgressPoint[];
  consistency_progression: ProgressPoint[];
  completed_workout_ids: string[];
}

export interface BodyMetricInput {
  weight_kg?: number | null;
  body_fat_pct?: number | null;
  measurements?: Record<string, number> | null;
  photo_url?: string | null;
}

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface AchievementItem {
  id: string;
  code: string;
  title: string;
  description: string;
  earned_at: string;
}
