import type { StateCreator } from 'zustand';
import type { GymState } from '../gymStore';
import type { ProgressEntry, AthleteProfile, MetricConfig } from '../../types';
import { defaultMetrics } from '../staticData';

export interface ProfileSlice {
  profile: AthleteProfile;
  progress: ProgressEntry[];
  trackedMetrics: MetricConfig[];
  
  updateProfile: (newProfile: Partial<AthleteProfile>) => void;
  addProgressEntry: (entry: ProgressEntry) => void;
  deleteProgressEntry: (date: string) => void;
  addMetric: (metric: MetricConfig) => void;
  updateMetric: (key: string, updated: Partial<MetricConfig>) => void;
  deleteMetric: (key: string) => void;
}

export const createProfileSlice: StateCreator<GymState, [], [], ProfileSlice> = (set) => ({
  profile: {
    gender: 'male',
    age: 25,
    weight: 70,
    height: 175,
    fatPercent: 15,
    dailySteps: 10000,
    selectedGoal: 'maintenance',
    username: '',
    isOnboarded: false,
  },
  progress: [],
  trackedMetrics: defaultMetrics,

  updateProfile: (newProfile) =>
    set((state) => ({ profile: { ...state.profile, ...newProfile } })),

  addProgressEntry: (entry) =>
    set((state) => {
      const existing = state.progress.find((p) => p.date === entry.date);
      const filtered = state.progress.filter((p) => p.date !== entry.date);
      const mergedEntry = existing
        ? {
            ...existing,
            ...Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== undefined)),
            notes: existing.notes && entry.notes
              ? `${existing.notes}; ${entry.notes}`
              : (entry.notes || existing.notes || undefined),
          }
        : entry;
      return {
        progress: [...filtered, mergedEntry].sort(
          (a, b) => String(a.date).localeCompare(String(b.date))
        ),
      };
    }),

  deleteProgressEntry: (date) =>
    set((state) => ({ progress: state.progress.filter((p) => p.date !== date) })),

  addMetric: (metric) =>
    set((state) => ({
      trackedMetrics: [...state.trackedMetrics.filter((m) => m.key !== metric.key), metric],
    })),

  updateMetric: (key, updated) =>
    set((state) => ({
      trackedMetrics: state.trackedMetrics.map((m) =>
        m.key === key ? { ...m, ...updated } : m
      ),
    })),

  deleteMetric: (key) =>
    set((state) => ({
      trackedMetrics: state.trackedMetrics.filter((m) => m.key !== key),
    })),
});
