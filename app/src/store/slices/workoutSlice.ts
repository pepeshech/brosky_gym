import type { StateCreator } from 'zustand';
import type { GymState } from '../gymStore';
import type { Exercise, WorkoutSession, WorkoutTemplate, PersonalRecord } from '../../types';
import { defaultExercises } from '../staticData';

export interface WorkoutSlice {
  exercises: Exercise[];
  workoutSessions: WorkoutSession[];
  workoutTemplates: WorkoutTemplate[];
  personalRecords: PersonalRecord[];
  prHistory: PersonalRecord[];

  saveWorkoutSession: (session: WorkoutSession) => void;
  deleteWorkoutSession: (id: string) => void;
  addExercise: (exercise: Exercise) => void;
  updateExercise: (id: string, data: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  addWorkoutTemplate: (template: WorkoutTemplate) => void;
  updateWorkoutTemplate: (id: string, data: Partial<WorkoutTemplate>) => void;
  deleteWorkoutTemplate: (id: string) => void;
  updatePersonalRecord: (record: PersonalRecord) => void;
}

export const createWorkoutSlice: StateCreator<GymState, [], [], WorkoutSlice> = (set) => ({
  exercises: defaultExercises,
  workoutSessions: [],
  workoutTemplates: [],
  personalRecords: [],
  prHistory: [],

  saveWorkoutSession: (session) =>
    set((state) => {
      const filtered = state.workoutSessions.filter((s) => s.id !== session.id);
      return {
        workoutSessions: [...filtered, session].sort(
          (a, b) => String(a.date).localeCompare(String(b.date))
        ),
      };
    }),

  deleteWorkoutSession: (id) =>
    set((state) => ({
      workoutSessions: state.workoutSessions.filter((s) => s.id !== id),
    })),

  addExercise: (exercise) =>
    set((state) => ({ exercises: [...state.exercises, exercise] })),

  updateExercise: (id, data) =>
    set((state) => ({
      exercises: state.exercises.map((e) => (e.id === id ? { ...e, ...data } : e)),
    })),

  deleteExercise: (id) =>
    set((state) => ({ exercises: state.exercises.filter((e) => e.id !== id) })),

  addWorkoutTemplate: (template) =>
    set((state) => ({ workoutTemplates: [...state.workoutTemplates, template] })),

  updateWorkoutTemplate: (id, data) =>
    set((state) => ({
      workoutTemplates: state.workoutTemplates.map((t) =>
        t.id === id ? { ...t, ...data } : t
      ),
    })),

  deleteWorkoutTemplate: (id) =>
    set((state) => ({
      workoutTemplates: state.workoutTemplates.filter((t) => t.id !== id),
    })),

  updatePersonalRecord: (record) =>
    set((state) => {
      const updatedHistory = [...(state.prHistory || []), record];
      const existing = state.personalRecords.find(
        (pr) => pr.exerciseId === record.exerciseId
      );
      if (existing && existing.weight1rm >= record.weight1rm) {
        return {
          prHistory: updatedHistory,
        };
      }
      return {
        prHistory: updatedHistory,
        personalRecords: [
          ...state.personalRecords.filter((pr) => pr.exerciseId !== record.exerciseId),
          record,
        ],
      };
    }),
});
