import { describe, it, expect } from 'vitest';
import { calculate1RMMatrix, calculateWeighted1RM, getMovementFatigueProfile } from '../utils/formulas';

describe('One Rep Max (1RM) Matrix Engine', () => {
  it('returns exact weight for 1 rep across all formulas', () => {
    const res = calculate1RMMatrix(100, 1);
    expect(res.epley).toBe(100);
    expect(res.brzycki).toBe(100);
    expect(res.lander).toBe(100);
    expect(res.mayhew).toBe(100);
    expect(res.wathan).toBe(100);
    expect(res.oconner).toBe(100);
    expect(res.average).toBe(100);
    expect(res.optimal).toBe(100);
  });

  it('calculates 1RM for 5 reps accurately', () => {
    // 100kg x 5 reps -> Epley = 100 * (1 + 5/30) = 116.7kg
    const res = calculate1RMMatrix(100, 5);

    expect(res.epley).toBe(116.7);
    expect(res.brzycki).toBe(112.5);
    expect(res.lander).toBeGreaterThan(110);
    expect(res.average).toBeGreaterThan(110);
    expect(res.optimalFormulaName).toContain('Epley');
  });

  it('selects Lander formula as optimal for low reps (1-4 reps)', () => {
    const res = calculate1RMMatrix(140, 3);
    expect(res.optimalFormulaName).toContain('Lander');
    expect(res.optimal).toBe(res.lander);
  });

  it('selects Wathan formula as optimal for high reps (10+ reps)', () => {
    const res = calculate1RMMatrix(80, 12);
    expect(res.optimalFormulaName).toContain('Wathan');
    expect(res.optimal).toBe(res.wathan);
  });

  describe('Gaussian Kernel Weighted 1RM & Confidence', () => {
    it('calculates smooth weighted 1RM and confidence score', () => {
      const res5 = calculateWeighted1RM(100, 5, 0);
      expect(res5.estimate1RM).toBeGreaterThan(110);
      expect(res5.estimate1RM).toBeLessThan(120);
      expect(res5.confidencePercent).toBeGreaterThan(85);

      const res15 = calculateWeighted1RM(80, 15, 0);
      expect(res15.confidencePercent).toBeLessThan(res5.confidencePercent);
      expect(res15.rangeMin).toBeLessThan(res15.rangeMax);
    });
  });

  describe('Movement Specific Fatigue Kinetics', () => {
    it('returns high axial cost for deadlifts and squats', () => {
      const deadlift = getMovementFatigueProfile('Становая тяга со штангой');
      expect(deadlift.axialLoad).toBe('high');
      expect(deadlift.systemicCost).toBe(1.5);
      expect(deadlift.localRecoveryHours).toBe(72);
    });

    it('returns moderate cost for bench press and upper compound movements', () => {
      const bench = getMovementFatigueProfile('Жим лежа со штангой');
      expect(bench.axialLoad).toBe('moderate');
      expect(bench.systemicCost).toBe(1.0);
    });

    it('returns low cost for isolation exercises', () => {
      const curl = getMovementFatigueProfile('Подъем на бицепс с гантелями');
      expect(curl.axialLoad).toBe('low');
      expect(curl.systemicCost).toBe(0.6);
    });
  });
});

