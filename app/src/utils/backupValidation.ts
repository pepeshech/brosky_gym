import { z } from 'zod';

export const AthleteProfileSchema = z.object({
  gender: z.enum(['male', 'female']),
  age: z.number().min(1).max(120),
  weight: z.number().positive(),
  height: z.number().positive(),
  fatPercent: z.number().min(0).max(100),
  dailySteps: z.number().nonnegative().optional(),
  selectedGoal: z.enum(['recomp', 'maintenance', 'bulk', 'cut']),
  username: z.string(),
  isOnboarded: z.boolean(),
});

export const ProgressEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight: z.number().positive().optional(),
  fatPercent: z.number().min(0).max(100).optional(),
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  thigh: z.number().positive().optional(),
  biceps: z.number().positive().optional(),
  steps: z.number().nonnegative().optional(),
  notes: z.string().optional(),
}).catchall(z.union([z.string(), z.number(), z.undefined()]));

export const ExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  muscleGroup: z.string(),
  muscleGroups: z.array(z.string()).optional(),
  equipment: z.string(),
  repScheme: z.string(),
  technique: z.string(),
  color: z.string(),
  isCustom: z.boolean().optional(),
  image: z.string().optional(),
  gifUrl: z.string().optional(),
});

export const SetLogSchema = z.object({
  setIndex: z.number().int().nonnegative(),
  reps: z.number().nonnegative(),
  weight: z.number().nonnegative(),
  isCompleted: z.boolean(),
  rpe: z.number().min(0).max(10).optional(),
});

export const ExerciseLogSchema = z.object({
  exerciseId: z.string(),
  sets: z.array(SetLogSchema),
  notes: z.string().optional(),
  isCompleted: z.boolean(),
  weight: z.number().nonnegative().optional(),
});

export const WorkoutSessionSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  templateId: z.string().optional(),
  templateName: z.string(),
  duration: z.number().positive().optional(),
  logs: z.record(z.string(), ExerciseLogSchema),
  notes: z.string().optional(),
  workoutType: z.string().optional(),
});

export const NutritionFoodItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  grams: z.number().positive(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  time: z.string().optional(),
});

export const NutritionLogEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  water: z.number().nonnegative().optional(),
  steps: z.number().nonnegative().optional(),
  items: z.array(NutritionFoodItemSchema).optional(),
});

export const MetricConfigSchema = z.object({
  key: z.string(),
  name: z.string(),
  unit: z.string(),
  target: z.enum(['up', 'down']),
  desc: z.string().optional(),
  color: z.string().optional(),
  isVirtual: z.boolean().optional(),
});

export const WorkoutTemplateExerciseSchema = z.object({
  exerciseId: z.string(),
  sets: z.number().int().positive(),
  reps: z.union([z.number(), z.string()]),
  restSec: z.number().int().nonnegative(),
  order: z.number().int().nonnegative(),
});

export const WorkoutTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  color: z.string(),
  exercises: z.array(WorkoutTemplateExerciseSchema),
  isCustom: z.boolean().optional(),
});

export const PersonalRecordSchema = z.object({
  exerciseId: z.string(),
  weight1rm: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  actualReps: z.number().int().positive().optional(),
  actualWeight: z.number().positive().optional(),
});

export const CustomFoodSchema = z.object({
  name: z.string(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  baseWeight: z.number().positive(),
});

export const NutritionPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['static', 'dynamic']),
  isCustom: z.boolean().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  calories: z.number().nonnegative().optional(),
  proteinGrams: z.number().nonnegative().optional(),
  fatGrams: z.number().nonnegative().optional(),
  carbsGrams: z.number().nonnegative().optional(),
  waterMl: z.number().nonnegative().optional(),
  stepsTarget: z.number().nonnegative().optional(),
  kcalOffsetPercent: z.number().optional(),
  proteinRatioPerKg: z.number().optional(),
  fatPercentOfKcal: z.number().optional(),
  stepsTargetFromGoal: z.boolean().optional(),
  stepsTargetCustom: z.number().nonnegative().optional(),
});

export const BackupDataSchema = z.object({
  profile: AthleteProfileSchema,
  progress: z.array(ProgressEntrySchema),
  workoutSessions: z.array(WorkoutSessionSchema),
  nutritionLogs: z.array(NutritionLogEntrySchema).optional(),
  trackedMetrics: z.array(MetricConfigSchema).optional(),
  workoutTemplates: z.array(WorkoutTemplateSchema).optional(),
  personalRecords: z.array(PersonalRecordSchema).optional(),
  prHistory: z.array(PersonalRecordSchema).optional(),
  customFoods: z.array(CustomFoodSchema).optional(),
  nutritionPresets: z.array(NutritionPresetSchema).optional(),
  dailyNutritionPresets: z.record(z.string(), z.string()).optional(),
});

type ValidBackupData = z.infer<typeof BackupDataSchema>;

/**
 * Валидирует переданный объект резервной копии с помощью Zod.
 */
export function validateBackup(data: unknown): ValidBackupData {
  return BackupDataSchema.parse(data);
}
