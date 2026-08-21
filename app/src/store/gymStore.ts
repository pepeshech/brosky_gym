import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  defaultExercises,
  defaultMetrics,
  MUSCLE_COLORS,
  MUSCLE_GROUPS,
  EQUIPMENT_TYPES,
  calcEpley1RM,
  defaultTemplates,
} from './staticData';
import { createProfileSlice, type ProfileSlice } from './slices/profileSlice';
import { createWorkoutSlice, type WorkoutSlice } from './slices/workoutSlice';
import { createNutritionSlice, type NutritionSlice, defaultNutritionPresets } from './slices/nutritionSlice';

export {
  defaultExercises,
  defaultMetrics,
  MUSCLE_COLORS,
  MUSCLE_GROUPS,
  EQUIPMENT_TYPES,
  calcEpley1RM,
  defaultTemplates,
};

export interface GymState extends ProfileSlice, WorkoutSlice, NutritionSlice {
  importBackup: (data: unknown) => Promise<boolean>;
  resetAllData: () => void;
}

export const useGymStore = create<GymState>()(
  persist(
    (...a) => ({
      ...createProfileSlice(...a),
      ...createWorkoutSlice(...a),
      ...createNutritionSlice(...a),

      importBackup: async (data) => {
        try {
          const { validateBackup } = await import('../utils/backupValidation');
          const validated = validateBackup(data);
          const set = a[0];
          set({
            profile: validated.profile,
            progress: validated.progress,
            workoutSessions: validated.workoutSessions,
            nutritionLogs: validated.nutritionLogs || [],
            trackedMetrics: validated.trackedMetrics || defaultMetrics,
            workoutTemplates: (validated.workoutTemplates && validated.workoutTemplates.length > 0) ? validated.workoutTemplates : defaultTemplates,
            personalRecords: validated.personalRecords || [],
            prHistory: validated.prHistory || [],
            customFoods: validated.customFoods || [],
            nutritionPresets: validated.nutritionPresets || defaultNutritionPresets,
            dailyNutritionPresets: validated.dailyNutritionPresets || {},
          });
          return true;
        } catch (err) {
          console.error('[Backup Import] Validation failed:', err);
          return false;
        }
      },

      resetAllData: () => {
        localStorage.removeItem('gym-tracker-store');
        const set = a[0];
        set({
          profile: {
            gender: 'male', age: 25, weight: 70, height: 175,
            fatPercent: 15, dailySteps: 10000, selectedGoal: 'maintenance',
            username: '', isOnboarded: false,
          },
          progress: [],
          workoutSessions: [],
          nutritionLogs: [],
          trackedMetrics: defaultMetrics,
          workoutTemplates: defaultTemplates,
          personalRecords: [],
          prHistory: [],
          customFoods: [],
          nutritionPresets: defaultNutritionPresets,
          dailyNutritionPresets: {},
        });
      },
    }),
    {
      name: 'gym-tracker-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profile: state.profile,
        progress: state.progress,
        trackedMetrics: state.trackedMetrics,
        workoutSessions: state.workoutSessions,
        customExercises: state.exercises ? state.exercises.filter((e) => e.isCustom) : [],
        workoutTemplates: state.workoutTemplates,
        personalRecords: state.personalRecords,
        prHistory: state.prHistory,
        nutritionLogs: state.nutritionLogs,
        customFoods: state.customFoods,
        nutritionPresets: state.nutritionPresets,
        dailyNutritionPresets: state.dailyNutritionPresets,
      }),
      merge: (persistedState: unknown, currentState: GymState) => {
        if (!persistedState || typeof persistedState !== 'object') return currentState;
        const pState = persistedState as Partial<GymState> & { customExercises?: typeof defaultExercises };
        const customEx = pState.customExercises || (Array.isArray(pState.exercises) ? pState.exercises.filter((e) => e.isCustom) : []);
        const mergedExercises = [
          ...defaultExercises.filter((de) => !customEx.some((ce) => ce.id === de.id)),
          ...customEx,
        ];
        return {
          ...currentState,
          ...pState,
          exercises: mergedExercises,
        };
      },
    }
  )
);

