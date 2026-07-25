import { describe, it, expect } from 'vitest';
import { calculate1RMMatrix } from '../utils/formulas';

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
});
