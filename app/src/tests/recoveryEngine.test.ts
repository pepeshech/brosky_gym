import { describe, it, expect } from 'vitest';
import { calculateMuscleRecoveryMap, getRecoveryColorHex } from '../utils/recoveryEngine';
import type { WorkoutSession } from '../types';

describe('recoveryEngine (7-Day Muscle Recovery Decay)', () => {
  it('returns 100% recovery for all muscle groups when no workout sessions exist', () => {
    const recoveryMap = calculateMuscleRecoveryMap([]);
    
    expect(recoveryMap['Грудь'].recoveryPercent).toBe(100);
    expect(recoveryMap['Грудь'].statusCategory).toBe('rested');
    expect(recoveryMap['Грудь'].colorHex).toBe('#64748b');
    expect(recoveryMap['Квадрицепс'].recoveryPercent).toBe(100);
  });

  it('calculates significant fatigue immediately after a heavy chest session', () => {
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
