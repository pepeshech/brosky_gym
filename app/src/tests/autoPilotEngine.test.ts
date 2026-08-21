import { describe, it, expect } from 'vitest';
import {
  calculateAutoPilotRecommendation,
  calculateDoubleProgression,
  calculateAPREAdjustment,
  getMesocyclePhaseConfig,
} from '../utils/autoPilotEngine';
import type { WorkoutSession, AthleteProfile } from '../types';

describe('AI Auto-Pilot & Periodization Engine 2.0', () => {
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

  describe('Double Progression Algorithm', () => {
    it('holds weight and steps up reps when ceiling is not reached', () => {
      const sets = [
        { reps: 10, weight: 100, rir: 2 },
        { reps: 9, weight: 100, rir: 1 },
        { reps: 8, weight: 100, rir: 1 },
      ];

      const res = calculateDoubleProgression(sets, 8, 12, 100, 2.5);
      expect(res.targetWeight).toBe(100);
      expect(res.isReadyForWeightIncrease).toBe(false);
      expect(res.targetReps).toBe(9); // min was 8 -> next target is 9
    });

    it('unlocks weight increase and resets reps when all sets reach 12 reps', () => {
      const sets = [
        { reps: 12, weight: 100, rir: 1 },
        { reps: 12, weight: 100, rir: 1 },
        { reps: 12, weight: 100, rir: 1 },
      ];

      const res = calculateDoubleProgression(sets, 8, 12, 100, 2.5);
      expect(res.targetWeight).toBe(102.5); // +2.5kg
      expect(res.targetReps).toBe(8);       // reset to minReps
      expect(res.isReadyForWeightIncrease).toBe(true);
    });
  });

  describe('APRE Protocol (Autoregulatory Progressive Resistance)', () => {
    it('increases weight by +5kg on +3 reps AMRAP overperformance', () => {
      const res = calculateAPREAdjustment(11, 8, 100, 2.5); // 11 vs 8 target (+3 reps)
      expect(res.newWeight).toBe(105);
      expect(res.deltaWeight).toBe(5);
    });

    it('increases weight by +2.5kg on +1 rep overperformance', () => {
      const res = calculateAPREAdjustment(9, 8, 100, 2.5);
      expect(res.newWeight).toBe(102.5);
      expect(res.deltaWeight).toBe(2.5);
    });

    it('holds weight when target reps are matched exactly', () => {
      const res = calculateAPREAdjustment(8, 8, 100, 2.5);
      expect(res.newWeight).toBe(100);
      expect(res.deltaWeight).toBe(0);
    });

    it('reduces weight when failing target reps', () => {
      const res = calculateAPREAdjustment(6, 8, 100, 2.5);
      expect(res.newWeight).toBe(97.5);
      expect(res.deltaWeight).toBe(-2.5);
    });
  });

  describe('Mesocycle 5-Week Periodization', () => {
    it('provides correct RIR and phase configs across 5 weeks', () => {
      expect(getMesocyclePhaseConfig(1).phase).toBe('accumulation');
      expect(getMesocyclePhaseConfig(1).targetRir).toBe(3);

      expect(getMesocyclePhaseConfig(2).phase).toBe('intensification_1');
      expect(getMesocyclePhaseConfig(2).targetRir).toBe(2);

      expect(getMesocyclePhaseConfig(3).phase).toBe('intensification_2');
      expect(getMesocyclePhaseConfig(3).targetRir).toBe(1);

      expect(getMesocyclePhaseConfig(4).phase).toBe('overreaching');
      expect(getMesocyclePhaseConfig(4).targetRir).toBe(0);

      expect(getMesocyclePhaseConfig(5).phase).toBe('deload');
      expect(getMesocyclePhaseConfig(5).volumeMultiplier).toBe(0.5);
    });
  });

  describe('calculateAutoPilotRecommendation', () => {
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

    it('modulates target RIR according to mesocycle week options', () => {
      const sessions: WorkoutSession[] = [
        {
          id: 's1',
          date: '2026-07-20',
          templateName: 'Upper A',
          domsScore: 'none',
          logs: {
            ex1: {
              exerciseId: 'ex1',
              isCompleted: true,
              sets: [{ setIndex: 0, weight: 100, reps: 8, rir: 2, isCompleted: true }],
            },
          },
        },
      ];

      const recWeek1 = calculateAutoPilotRecommendation('ex1', sessions, mockProfile, 8, { mesocycleWeek: 1 });
      expect(recWeek1.mesocyclePhase).toContain('Аккумуляция');

      const recWeek4 = calculateAutoPilotRecommendation('ex1', sessions, mockProfile, 8, { mesocycleWeek: 4 });
      expect(recWeek4.mesocyclePhase).toContain('Оверричинг');
    });
  });
});
