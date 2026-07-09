import { create } from 'zustand';
import {
  defaultExercises,
  defaultMetrics,
  MUSCLE_COLORS,
  MUSCLE_GROUPS,
  EQUIPMENT_TYPES,
  calcEpley1RM,
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
};

export interface GymState extends ProfileSlice, WorkoutSlice, NutritionSlice {
  importBackup: (data: unknown) => Promise<boolean>;
  resetAllData: () => void;
}

export const useGymStore = create<GymState>()((...a) => ({
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
        workoutTemplates: validated.workoutTemplates || [],
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
    localStorage.removeItem('gym-tracker-store'); // Удаляем legacy бэкап
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
      workoutTemplates: [],
      personalRecords: [],
      prHistory: [],
      customFoods: [],
      nutritionPresets: defaultNutritionPresets,
      dailyNutritionPresets: {},
    });
  },
}));

import { bindZustandToYjs } from './zustandYjsBridge';
import { ydoc } from './yjsProvider';

// Подключаем мост: синхронизируем Zustand store с Y.Map ('gym-state')
const yGymState = ydoc.getMap('gym-state');
bindZustandToYjs(useGymStore, yGymState);
