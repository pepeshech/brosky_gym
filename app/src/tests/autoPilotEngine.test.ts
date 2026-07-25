import { describe, it, expect } from 'vitest';
import { calculateAutoPilotRecommendation } from '../utils/autoPilotEngine';
import type { WorkoutSession, AthleteProfile } from '../types';

describe('AI Auto-Pilot Load Predictor Engine', () => {
  const mockProfile: AthleteProfile = {
    gender: 'male',
    age: 28,
    weight: 80,
    height: 180,
    fatPercent: 15,
    selectedGoal: 'bulk',
    username: 'Test',
    isOnboarded: true,
    autoPilotEnabled: true,
    autoPilotAggressiveness: 'balanced',
    autoPilotPlateStep: 2.5,
  };

  it('should return initial baseline for empty workout history', () => {
    const rec = calculateAutoPilotRecommendation('ex1', [], mockProfile, 8);
    expect(rec.recommendedWeight).toBe(20);
    expect(rec.recommendedReps).toBe(8);
    expect(rec.targetRir).toBe(2);
    expect(rec.reason).toContain('Первая тренировка');
  });

  it('should increase weight when past RIR >= 2 and DOMS is none', () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        date: '2026-07-20',
        templateName: 'Upper A',
        domsScore: 'none',
        stimulusScore: 'optimal',
        logs: {
          ex1: {
            exerciseId: 'ex1',
            isCompleted: true,
            sets: [
              { setIndex: 0, weight: 100, reps: 8, rir: 2, isCompleted: true },
            ],
          },
        },
      },
    ];

    const rec = calculateAutoPilotRecommendation('ex1', sessions, mockProfile, 8);
    expect(rec.recommendedWeight).toBe(102.5); // 100 + 2.5
    expect(rec.reason).toContain('плановый рост веса +2.5 кг');
  });

  it('should auto-reduce weight by 15% when severe DOMS is present to protect fascia', () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        date: '2026-07-20',
        templateName: 'Upper A',
        domsScore: 'severe',
        stimulusScore: 'optimal',
        logs: {
          ex1: {
            exerciseId: 'ex1',
            isCompleted: true,
            sets: [
              { setIndex: 0, weight: 100, reps: 8, rir: 1, isCompleted: true },
            ],
          },
        },
      },
    ];

    const rec = calculateAutoPilotRecommendation('ex1', sessions, mockProfile, 8);
    expect(rec.protectionActive).toBe(true);
    expect(rec.recommendedWeight).toBeLessThan(100);
    expect(rec.reason).toContain('сильная боль (DOMS)');
  });

  it('should respect hardcore aggressiveness setting for larger weight increments', () => {
    const hardcoreProfile: AthleteProfile = {
      ...mockProfile,
      autoPilotAggressiveness: 'hardcore',
    };

    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        date: '2026-07-20',
        templateName: 'Upper A',
        domsScore: 'none',
        stimulusScore: 'optimal',
        logs: {
          ex1: {
            exerciseId: 'ex1',
            isCompleted: true,
            sets: [
              { setIndex: 0, weight: 100, reps: 8, rir: 2, isCompleted: true },
            ],
          },
        },
      },
    ];

    const rec = calculateAutoPilotRecommendation('ex1', sessions, hardcoreProfile, 8);
    expect(rec.recommendedWeight).toBeGreaterThanOrEqual(102.5);
  });
});
