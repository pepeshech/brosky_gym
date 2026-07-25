import { describe, it, expect } from 'vitest';
import { calculateAdaptiveTDEE as calcAdaptiveTDEE } from '../utils/formulas';

describe('Adaptive TDEE Engine', () => {
  const staticTDEE = 2400;

  it('returns static TDEE with insufficient confidence when less than 7 days of logs', () => {
    const weightEntries = [
      { date: '2026-07-01', weight: 80 },
      { date: '2026-07-03', weight: 79.8 },
    ];
    const nutritionLogs = [
      { date: '2026-07-01', calories: 2400 },
      { date: '2026-07-02', calories: 2350 },
    ];

    const result = calcAdaptiveTDEE(weightEntries, nutritionLogs, staticTDEE);

    expect(result.adaptiveTDEE).toBe(staticTDEE);
    expect(result.confidenceLevel).toBe('insufficient');
    expect(result.differenceFromStatic).toBe(0);
  });

  it('calculates real expenditure accurately on maintenance (constant weight)', () => {
    // 14 days of data with constant weight 80kg and 2500 kcal daily intake
    const weightEntries = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, '0')}`,
      weight: 80.0,
    }));
    const nutritionLogs = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, '0')}`,
      calories: 2500,
    }));

    const result = calcAdaptiveTDEE(weightEntries, nutritionLogs, staticTDEE);

    expect(result.confidenceLevel).toBe('high');
    expect(result.avgDailyCalories).toBe(2500);
    expect(result.adaptiveTDEE).toBe(2500);
    expect(result.differenceFromStatic).toBe(100);
  });

  it('detects caloric deficit when weight is decreasing', () => {
    // Lost 1kg in 14 days (~550 kcal/day deficit) while eating 2000 kcal
    // Real TDEE should be ~ 2000 + 550 = 2550 kcal
    const weightEntries = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, '0')}`,
      weight: 80.0 - (i * (1.0 / 13)),
    }));
    const nutritionLogs = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, '0')}`,
      calories: 2000,
    }));

    const result = calcAdaptiveTDEE(weightEntries, nutritionLogs, staticTDEE);

    expect(result.confidenceLevel).toBe('high');
    expect(result.adaptiveTDEE).toBeGreaterThan(2300);
  });

  it('blends static and adaptive TDEE for 7-13 days (moderate confidence)', () => {
    const weightEntries = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, '0')}`,
      weight: 80.0,
    }));
    const nutritionLogs = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, '0')}`,
      calories: 2800,
    }));

    const result = calcAdaptiveTDEE(weightEntries, nutritionLogs, staticTDEE);

    expect(result.confidenceLevel).toBe('moderate');
    // Raw adaptive = 2800. Blended = 50% * 2400 + 50% * 2800 = 2600
    expect(result.adaptiveTDEE).toBe(2600);
  });
});
