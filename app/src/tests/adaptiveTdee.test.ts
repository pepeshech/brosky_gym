import { describe, it, expect } from 'vitest';
import {
  calculateAdaptiveTDEE as calcAdaptiveTDEE,
  calculateForbesEnergyDensity,
  calculateKalmanTrend,
  calculateMetabolicAdaptation,
} from '../utils/formulas';

describe('Adaptive TDEE & Energy Balance Engine 2.0', () => {
  const staticTDEE = 2400;

  describe('Forbes Energy Density Curve', () => {
    it('calculates higher energy density for high body fat (fat loss)', () => {
      const leanDensity = calculateForbesEnergyDensity(8);  // ~6000 kcal/kg
      const avgDensity = calculateForbesEnergyDensity(15);  // ~7100 kcal/kg
      const obeseDensity = calculateForbesEnergyDensity(35); // ~8500+ kcal/kg

      expect(leanDensity).toBeLessThan(avgDensity);
      expect(avgDensity).toBeLessThan(obeseDensity);
      expect(leanDensity).toBeGreaterThanOrEqual(5500);
      expect(obeseDensity).toBeLessThanOrEqual(9200);
    });

    it('defaults to ~7143 kcal/kg for undefined body fat', () => {
      const defaultDensity = calculateForbesEnergyDensity();
      expect(defaultDensity).toBeGreaterThan(6800);
      expect(defaultDensity).toBeLessThan(7500);
    });
  });

  describe('1D Kalman Filter for Weight Trend', () => {
    it('filters out sodium/water spikes and computes velocity', () => {
      const sample = [
        { date: '2026-07-01', weight: 80.0 },
        { date: '2026-07-02', weight: 82.5 }, // sudden water spike
        { date: '2026-07-03', weight: 80.1 },
        { date: '2026-07-04', weight: 79.9 },
        { date: '2026-07-05', weight: 79.7 },
        { date: '2026-07-06', weight: 79.5 },
        { date: '2026-07-07', weight: 79.3 },
      ];

      const trend = calculateKalmanTrend(sample);
      expect(trend.length).toBe(7);
      expect(trend[0].weightTrend).toBe(80.0);
      // Spike on day 2 (82.5) is smoothed down
      expect(trend[1].weightTrend).toBeLessThan(81.5);
      // Trend converges below 80kg
      expect(trend[6].weightTrend).toBeLessThan(80.0);
      // Trend velocity reflects downward mass loss
      expect(trend[6].velocityKgPerDay).toBeLessThan(0);
    });

    it('handles empty entries gracefully', () => {
      expect(calculateKalmanTrend([])).toEqual([]);
    });
  });

  describe('Adaptive Thermogenesis (Metabolic Adaptation)', () => {
    it('computes metabolic slowdown on prolonged large deficits', () => {
      const baseBmr = 1800;
      const resultShort = calculateMetabolicAdaptation(1, 300, baseBmr);
      expect(resultShort.adaptationFactor).toBe(1.0);
      expect(resultShort.adaptedBMR).toBe(baseBmr);

      const result12Weeks = calculateMetabolicAdaptation(12, 600, baseBmr);
      expect(result12Weeks.adaptationFactor).toBeLessThan(1.0);
      expect(result12Weeks.adaptedBMR).toBeLessThan(baseBmr);
      expect(result12Weeks.slowdownKcal).toBeGreaterThan(50);
    });
  });

  describe('calculateAdaptiveTDEE', () => {
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

      const result = calcAdaptiveTDEE(weightEntries, nutritionLogs, staticTDEE, { athleteFatPercent: 14 });

      expect(result.confidenceLevel).toBe('high');
      expect(result.avgDailyCalories).toBe(2500);
      expect(result.adaptiveTDEE).toBe(2500);
      expect(result.differenceFromStatic).toBe(100);
      expect(result.energyDensityKcalPerKg).toBeDefined();
    });

    it('detects caloric deficit when weight is decreasing', () => {
      // Lost 1kg in 14 days while eating 2000 kcal
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
      expect(result.adaptiveTDEE).toBe(2600);
    });
  });
});
