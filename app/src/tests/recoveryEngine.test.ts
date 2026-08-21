import { describe, it, expect } from 'vitest';
import {
  calculateMuscleRecoveryMap,
  getRecoveryColorHex,
  calculateEffectiveReps,
  calculateSetINOL,
  evaluateINOL,
  calculateBanisterModel,
  calculateDailyReadinessScore,
} from '../utils/recoveryEngine';
import type { WorkoutSession } from '../types';

describe('recoveryEngine (Fitness-Fatigue & Recovery 2.0)', () => {
  describe('Effective Reps & Hypertrophy Stimulus', () => {
    it('calculates effective reps based on RIR (Chris Beardsley theory)', () => {
      // 10 reps with RIR 0 (to failure) -> 5 effective reps
      expect(calculateEffectiveReps(10, 0)).toBe(5);
      // 10 reps with RIR 2 -> 3 effective reps (5 - 2)
      expect(calculateEffectiveReps(10, 2)).toBe(3);
      // 10 reps with RIR 5 -> 0 effective reps (warmup/sub-threshold)
      expect(calculateEffectiveReps(10, 5)).toBe(0);
      // 3 reps with RIR 0 -> 3 effective reps (limited by total reps)
      expect(calculateEffectiveReps(3, 0)).toBe(3);
    });
  });

  describe('Intensity Number of Lifts (INOL)', () => {
    it('calculates set INOL correctly', () => {
      // 5 reps @ 80% 1RM -> 5 / (100 - 80) = 0.25
      expect(calculateSetINOL(5, 80)).toBe(0.25);
      // 10 reps @ 70% 1RM -> 10 / (100 - 70) = 0.333
      expect(calculateSetINOL(10, 70)).toBeCloseTo(0.333, 2);
    });

    it('evaluates session INOL categories and safety recommendations', () => {
      expect(evaluateINOL(0.8).status).toBe('light');
      expect(evaluateINOL(1.5).status).toBe('optimal');
      expect(evaluateINOL(2.5).status).toBe('heavy');
      expect(evaluateINOL(3.5).status).toBe('overreaching');
    });
  });

  describe('Two-Factor Banister Impulse-Response Model', () => {
    it('returns fresh baseline state when no sessions exist', () => {
      const state = calculateBanisterModel([]);
      expect(state.readiness).toBe(100);
      expect(state.fitness).toBe(0);
      expect(state.fatigue).toBe(0);
      expect(state.status).toBe('fresh');
    });

    it('calculates acute fatigue spike immediately after hard training and predicts supercompensation', () => {
      const now = new Date('2026-07-26T12:00:00Z');
      const workoutTime = new Date('2026-07-26T10:00:00Z').toISOString();

      const sessions: WorkoutSession[] = [
        {
          id: 's-1',
          date: workoutTime,
          templateName: 'Heavy SBD',
          logs: {
            'log-1': {
              exerciseId: 'squat-barbell',
              isCompleted: true,
              sets: [
                { setIndex: 0, weight: 150, reps: 5, rpe: 9, isCompleted: true },
                { setIndex: 1, weight: 150, reps: 5, rpe: 9.5, isCompleted: true },
                { setIndex: 2, weight: 150, reps: 5, rpe: 10, isCompleted: true },
              ],
            },
          },
        },
      ];

      const state = calculateBanisterModel(sessions, now);
      expect(state.fatigue).toBeGreaterThan(0);
      expect(state.fitness).toBeGreaterThan(0);
      expect(state.supercompensationPeakHours).toBeGreaterThan(0);
    });
  });

  describe('7-Day Muscle Recovery Decay Map', () => {
    it('returns 100% recovery for all muscle groups when no workout sessions exist', () => {
      const recoveryMap = calculateMuscleRecoveryMap([]);
      
      expect(recoveryMap['Грудь'].recoveryPercent).toBe(100);
      expect(recoveryMap['Грудь'].statusCategory).toBe('rested');
      expect(recoveryMap['Грудь'].colorHex).toBe('#64748b');
      expect(recoveryMap['Квадрицепс'].recoveryPercent).toBe(100);
    });

    it('calculates significant fatigue, effective reps and INOL after a heavy chest session', () => {
      const now = new Date('2026-07-26T12:00:00Z');
      const workoutTime = new Date('2026-07-26T10:00:00Z').toISOString(); // 2 hours ago

      const sessions: WorkoutSession[] = [
        {
          id: 'session-1',
          date: workoutTime,
          templateName: 'Chest Heavy',
          logs: {
            'log-1': {
              exerciseId: 'bench-press-barbell', // Bench Press -> Chest primary, Triceps/Delts secondary
              isCompleted: true,
              sets: [
                { setIndex: 0, weight: 100, reps: 5, rpe: 9, isCompleted: true },
                { setIndex: 1, weight: 100, reps: 5, rpe: 9, isCompleted: true },
                { setIndex: 2, weight: 100, reps: 5, rpe: 9.5, isCompleted: true },
                { setIndex: 3, weight: 100, reps: 5, rpe: 10, isCompleted: true },
                { setIndex: 4, weight: 100, reps: 5, rpe: 10, isCompleted: true },
              ],
            },
          },
        },
      ];

      const recoveryMap = calculateMuscleRecoveryMap(sessions, undefined, now);

      // Primary muscle (Chest) should have significant fatigue
      expect(recoveryMap['Грудь'].recoveryPercent).toBeLessThan(80);
      expect(recoveryMap['Грудь'].totalSets7Days).toBe(5);
      expect(recoveryMap['Грудь'].totalVolume7Days).toBe(2500); // 100kg * 5reps * 5sets
      expect(recoveryMap['Грудь'].effectiveReps7Days).toBeGreaterThan(10);
      expect(recoveryMap['Грудь'].inol7Days).toBeGreaterThan(0);
      expect(recoveryMap['Грудь'].lastTrainedHoursAgo).toBe(2);
      expect(recoveryMap['Грудь'].hoursUntilFullRecovery).toBeGreaterThan(0);

      // Secondary muscle (Triceps) should take 50% load
      expect(recoveryMap['Трицепс'].totalSets7Days).toBe(3); // 5 sets * 0.5 = 2.5 rounded to 3
      expect(recoveryMap['Трицепс'].recoveryPercent).toBeGreaterThan(recoveryMap['Грудь'].recoveryPercent);
    });

    it('shows exponential recovery decay over 48 hours', () => {
      const now = new Date('2026-07-26T12:00:00Z');
      const recentWorkoutTime = new Date('2026-07-26T10:00:00Z').toISOString(); // 2h ago
      const oldWorkoutTime = new Date('2026-07-24T12:00:00Z').toISOString();    // 48h ago

      const recentSession: WorkoutSession[] = [
        {
          id: 's-recent',
          date: recentWorkoutTime,
          templateName: 'Legs',
          logs: {
            'log-1': {
              exerciseId: 'squat-barbell',
              isCompleted: true,
              sets: [{ setIndex: 0, weight: 140, reps: 5, rpe: 9, isCompleted: true }],
            },
          },
        },
      ];

      const oldSession: WorkoutSession[] = [
        {
          id: 's-old',
          date: oldWorkoutTime,
          templateName: 'Legs',
          logs: {
            'log-1': {
              exerciseId: 'squat-barbell',
              isCompleted: true,
              sets: [{ setIndex: 0, weight: 140, reps: 5, rpe: 9, isCompleted: true }],
            },
          },
        },
      ];

      const mapRecent = calculateMuscleRecoveryMap(recentSession, undefined, now);
      const mapOld = calculateMuscleRecoveryMap(oldSession, undefined, now);

      // 48h old workout should have significantly higher recovery % than 2h old workout
      expect(mapOld['Квадрицепс'].recoveryPercent).toBeGreaterThan(mapRecent['Квадрицепс'].recoveryPercent);
    });

    it('maps recovery percentage to correct hex colors', () => {
      expect(getRecoveryColorHex(20)).toBe('#e11d48'); // Crimson
      expect(getRecoveryColorHex(50)).toBe('#f59e0b'); // Amber
      expect(getRecoveryColorHex(75)).toBe('#10b981'); // Emerald
      expect(getRecoveryColorHex(95)).toBe('#64748b'); // Slate
    });
  });

  describe('Daily Readiness Score 2.0', () => {
    it('computes peak readiness score for fresh baseline and rested muscles', () => {
      const banister = calculateBanisterModel([]);
      const recoveryMap = calculateMuscleRecoveryMap([]);

      const readiness = calculateDailyReadinessScore(banister, recoveryMap, { domsScore: 'none', sleepScore: 9 });
      expect(readiness.readinessScore).toBeGreaterThanOrEqual(88);
      expect(readiness.status).toBe('peak');
      expect(readiness.colorHex).toBe('#10b981');
    });

    it('penalizes readiness score when severe DOMS and poor sleep are reported', () => {
      const banister = calculateBanisterModel([]);
      const recoveryMap = calculateMuscleRecoveryMap([]);

      const freshReadiness = calculateDailyReadinessScore(banister, recoveryMap, { domsScore: 'none', sleepScore: 8 });
      const fatiguedReadiness = calculateDailyReadinessScore(banister, recoveryMap, { domsScore: 'severe', sleepScore: 4 });

      expect(fatiguedReadiness.readinessScore).toBeLessThan(freshReadiness.readinessScore);
      expect(fatiguedReadiness.recommendation).toBeDefined();
    });
  });
});

