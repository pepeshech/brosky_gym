import { describe, it, expect } from 'vitest';
import { calculateAdjusted1RM, getRpePercent1RM } from '../utils/formulas';

describe('RIR / RPE Autoregulation & Adjusted 1RM Engine', () => {
  it('correctly calculates 1RM with zero RIR (failure)', () => {
    // 100 kg x 5 reps @ RIR 0 -> 100 * (1 + 5/30) = 116.7 kg
    const orm = calculateAdjusted1RM(100, 5, 0);
    expect(orm).toBe(116.7);
  });

  it('correctly adjusts 1RM when RIR is 2 (2 reps left in reserve)', () => {
    // 100 kg x 5 reps @ RIR 2 -> effective reps = 7 -> 100 * (1 + 7/30) = 123.3 kg
    const orm = calculateAdjusted1RM(100, 5, 2);
    expect(orm).toBe(123.3);
  });

  it('handles edge cases safely', () => {
    expect(calculateAdjusted1RM(0, 5, 2)).toBe(0);
    expect(calculateAdjusted1RM(100, 0, 2)).toBe(0);
    expect(calculateAdjusted1RM(100, 5, -1)).toBe(116.7); // RIR cannot be negative
  });

  it('calculates RTS %1RM matrix values correctly', () => {
    // 5 reps @ RPE 10 (RIR 0) -> 1 / (1 + 0.0333 * 5) = 85.7%
    const pct100 = getRpePercent1RM(5, 10);
    expect(pct100).toBe(85.7);

    // 5 reps @ RPE 8 (RIR 2) -> total reps = 7 -> 1 / (1 + 0.0333 * 7) = 81.1%
    const pctRpe8 = getRpePercent1RM(5, 8);
    expect(pctRpe8).toBe(81.1);
  });
});
