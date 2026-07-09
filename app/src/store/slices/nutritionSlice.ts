import type { StateCreator } from 'zustand';
import type { GymState } from '../gymStore';
import type { NutritionLogEntry, CustomFood, NutritionPreset } from '../../types';

export const defaultNutritionPresets: NutritionPreset[] = [
  {
    id: 'sys-refeed',
    name: 'Углеводный рефид',
    type: 'dynamic',
    isCustom: false,
    color: '#06b6d4',
    description: 'Контролируемый профицит углеводов для восполнения запасов гликогена перед тяжелыми тренировками.',
    kcalOffsetPercent: 10,
    proteinRatioPerKg: 2.2,
    fatPercentOfKcal: 15,
    stepsTargetFromGoal: true,
  },
  {
    id: 'sys-keto',
    name: 'Кето-день',
    type: 'static',
    isCustom: false,
    color: '#eab308',
    description: 'Высокожировой рацион с минимальным количеством углеводов для стимуляции жиросжигания.',
    calories: 2000,
    proteinGrams: 130,
    fatGrams: 120,
    carbsGrams: 20,
    waterMl: 2500,
    stepsTarget: 9000,
  },
  {
    id: 'sys-fast',
    name: 'Разгрузочный день',
    type: 'static',
    isCustom: false,
    color: '#f43f5e',
    description: 'Низкокалорийный день для отдыха пищеварительной системы и создания глубокого дефицита калорий.',
    calories: 1300,
    proteinGrams: 100,
    fatGrams: 40,
    carbsGrams: 135,
    waterMl: 3000,
    stepsTarget: 10000,
  }
];

export interface NutritionSlice {
  nutritionLogs: NutritionLogEntry[];
  customFoods: CustomFood[];
  nutritionPresets: NutritionPreset[];
  dailyNutritionPresets: Record<string, string>;

  addNutritionLog: (log: NutritionLogEntry) => void;
  deleteNutritionLog: (date: string) => void;
  addCustomFood: (food: CustomFood) => void;
  deleteCustomFood: (name: string) => void;
  addNutritionPreset: (preset: NutritionPreset) => void;
  deleteNutritionPreset: (id: string) => void;
  setDailyNutritionPreset: (date: string, presetId: string) => void;
}

export const createNutritionSlice: StateCreator<GymState, [], [], NutritionSlice> = (set) => ({
  nutritionLogs: [],
  customFoods: [],
  nutritionPresets: defaultNutritionPresets,
  dailyNutritionPresets: {},

  addNutritionLog: (log) =>
    set((state) => {
      const filtered = state.nutritionLogs.filter((l) => l.date !== log.date);
      return {
        nutritionLogs: [...filtered, log].sort(
          (a, b) => String(a.date).localeCompare(String(b.date))
        ),
      };
    }),

  deleteNutritionLog: (date) =>
    set((state) => ({
      nutritionLogs: state.nutritionLogs.filter((l) => l.date !== date),
    })),

  addCustomFood: (food) =>
    set((state) => ({
      customFoods: [
        ...state.customFoods.filter((f) => f.name.toLowerCase() !== food.name.toLowerCase()),
        food,
      ],
    })),

  deleteCustomFood: (name) =>
    set((state) => ({
      customFoods: state.customFoods.filter((f) => f.name !== name),
    })),

  addNutritionPreset: (preset) =>
    set((state) => ({
      nutritionPresets: [
        ...state.nutritionPresets.filter((p) => p.id !== preset.id),
        preset,
      ],
    })),

  deleteNutritionPreset: (id) =>
    set((state) => ({
      nutritionPresets: state.nutritionPresets.filter((p) => p.id !== id),
      dailyNutritionPresets: Object.fromEntries(
        Object.entries(state.dailyNutritionPresets).map(([date, pid]) => [
          date,
          pid === id ? 'auto' : pid,
        ])
      ),
    })),

  setDailyNutritionPreset: (date, presetId) =>
    set((state) => {
      const updated = { ...state.dailyNutritionPresets };
      if (presetId === 'auto') {
        delete updated[date];
      } else {
        updated[date] = presetId;
      }
      return { dailyNutritionPresets: updated };
    }),
});
