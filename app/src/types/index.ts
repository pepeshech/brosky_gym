export interface AthleteProfile {
  gender: 'male' | 'female';
  age: number;
  weight: number;
  height: number;
  fatPercent: number;
  dailySteps?: number;
  selectedGoal: 'recomp' | 'maintenance' | 'bulk' | 'cut';
  username: string;
  isOnboarded: boolean;
  autoPilotEnabled?: boolean;
  autoPilotAggressiveness?: 'conservative' | 'balanced' | 'hardcore';
  autoPilotPlateStep?: number;
  autoPilotMode?: 'autofill' | 'hints';
  useLocalLlm?: boolean;
  llmAdviceDetail?: 'concise' | 'detailed' | 'math_only';
}

export interface MetricConfig {
  key: string;
  name: string;
  unit: string;
  target: 'up' | 'down';
  desc?: string;
  color?: string;
  isVirtual?: boolean;
}

export interface ProgressEntry {
  date: string; // YYYY-MM-DD
  weight?: number;
  fatPercent?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  thigh?: number;
  biceps?: number;
  steps?: number;
  notes?: string;
  [key: string]: string | number | undefined;
}

// ── Exercises ──────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  muscleGroups?: string[]; // Массив задействованных мышечных групп (основная + дополнительные)
  equipment: string;       // Штанга | Гантели | Блок | Тренажёр | Вес тела
  repScheme: string;       // e.g. "4x5", "3x10"
  technique: string;
  color: string;
  isCustom?: boolean;
  image?: string;
  gifUrl?: string;
}

// ── Workout Logging ────────────────────────────────────────────────────────

export interface SetLog {
  setIndex: number;
  reps: number;
  weight: number;
  isCompleted: boolean;
  rpe?: number;
  rir?: number; // Reps In Reserve (повторов в запасе)
  isOverloaded?: boolean;
  overloadAmount?: number;
  prevWeight?: number;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
  notes?: string;
  isCompleted: boolean;
  weight?: number; // legacy — backward compat with old sessions
}

// ── Workout Templates ──────────────────────────────────────────────────────

export interface WorkoutTemplateExercise {
  exerciseId: string;
  sets: number;
  reps: number | string; // number OR range string like "8-12"
  restSec: number;
  order: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  color: string;
  exercises: WorkoutTemplateExercise[];
  isCustom?: boolean;
}

// ── Workout Sessions ───────────────────────────────────────────────────────

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  templateId?: string;
  templateName: string;     // Snapshot of name (survives template deletion)
  duration?: number;        // minutes
  logs: Record<string, ExerciseLog>;
  notes?: string;
  workoutType?: string;     // legacy — backward compat
  domsScore?: 'none' | 'mild' | 'severe';
  stimulusScore?: 'low' | 'optimal' | 'extreme';
}

// ── Personal Records ───────────────────────────────────────────────────────

export interface PersonalRecord {
  exerciseId: string;
  weight1rm: number;        // Best 1RM (Epley formula or manual)
  date: string;             // YYYY-MM-DD
  actualReps?: number;      // The reps used to compute Epley
  actualWeight?: number;    // The weight used to compute Epley
}

// ── Nutrition ──────────────────────────────────────────────────────────────

export interface NutritionFoodItem {
  id: string;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  time?: string; // Время добавления, например "14:25"
}

export interface NutritionLogEntry {
  date: string; // YYYY-MM-DD
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  water?: number; // мл
  steps?: number; // шаги за день
  items?: NutritionFoodItem[]; // Список съеденных продуктов за день
}

export interface CustomFood {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  baseWeight: number;
}

export interface NutritionPreset {
  id: string;
  name: string;
  type: 'static' | 'dynamic';
  isCustom?: boolean;
  color?: string;
  description?: string;

  // Параметры для фиксированного (static) типа
  calories?: number;
  proteinGrams?: number;
  fatGrams?: number;
  carbsGrams?: number;
  waterMl?: number;
  stepsTarget?: number;

  // Параметры для динамического (dynamic) типа
  kcalOffsetPercent?: number;  // Дефицит/профицит от TDEE (например, -15 или +10)
  proteinRatioPerKg?: number;  // Грамм белка на 1 кг веса
  fatPercentOfKcal?: number;   // Процент калорийности на жиры
  stepsTargetFromGoal?: boolean;
  stepsTargetCustom?: number;
}

