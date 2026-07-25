import { describe, it, expect } from 'vitest';
import { calculateEWMATrend, calculateAdaptiveTDEE } from '../utils/formulas';

describe('EWMA Weight Trend & Adaptive TDEE Engine', () => {
  const sampleProgress = [
    { date: '2026-07-01', weight: 80.0 },
    { date: '2026-07-02', weight: 82.5 }, // Water weight spike after high sodium dinner
    { date: '2026-07-03', weight: 80.2 },
    { date: '2026-07-04', weight: 79.8 },
    { date: '2026-07-05', weight: 79.5 },
  ];

  it('smooths out daily water weight spikes using EWMA (alpha = 0.25)', () => {
    const trend = calculateEWMATrend(sampleProgress, 0.25);

    expect(trend.length).toBe(5);
    expect(trend[0].weightTrend).toBe(80.0);
    // Spike to 82.5 kg on day 2 is smoothed down to ~80.63 kg (instead of 82.5 kg raw)
    expect(trend[1].weightTrend).toBeLessThan(81.0);
    expect(trend[4].weightTrend).toBeGreaterThan(79.0);
  });

  it('returns empty array for empty weight entries', () => {
    expect(calculateEWMATrend([])).toEqual([]);
  });

  it('calculates adaptive TDEE with EWMA trend stability', () => {
    const nutrition = [
      { date: '2026-07-01', calories: 2500 },
      { date: '2026-07-02', calories: 2500 },
      { date: '2026-07-03', calories: 2500 },
      { date: '2026-07-04', calories: 2500 },
      { date: '2026-07-05', calories: 2500 },
      { date: '2026-07-06', calories: 2500 },
      { date: '2026-07-07', calories: 2500 },
    ];

    const result = calculateAdaptiveTDEE(sampleProgress, nutrition, 2400);
    expect(result.dataDaysCount).toBeGreaterThanOrEqual(7);
    expect(result.adaptiveTDEE).toBeGreaterThan(1500);
    expect(result.adaptiveTDEE).toBeLessThan(4000);
  });
});
