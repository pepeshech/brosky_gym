import { describe, it, expect } from 'vitest';
import {
  calculateMacroDeficit,
  recommendOptimalFoodCombination,
  generateSmartAdvisorAdvice,
  type MacroTarget,
  type MacroCurrent,
  type FoodCandidate,
} from '../utils/macroOptimizer';

describe('macroOptimizer', () => {
  const mockTarget: MacroTarget = {
    calories: 2500,
    proteinGrams: 160,
    fatGrams: 70,
    carbsGrams: 300,
  };

  const mockFoods: FoodCandidate[] = [
    { name: 'Творог 5%', calories: 121, protein: 17.2, fat: 5, carbs: 1.8, baseWeight: 100 },
    { name: 'Куриное филе', calories: 170, protein: 30, fat: 3.5, carbs: 0, baseWeight: 100 },
    { name: 'Банан', calories: 96, protein: 1.5, fat: 0.2, carbs: 22, baseWeight: 100 },
    { name: 'Миндаль', calories: 579, protein: 21.2, fat: 49.9, carbs: 21.6, baseWeight: 100 },
    { name: 'Гречневая каша', calories: 110, protein: 4, fat: 1, carbs: 21, baseWeight: 100 },
  ];

  it('calculates macro deficit correctly when under target', () => {
    const current: MacroCurrent = {
      calories: 2000,
      protein: 120,
      fat: 50,
      carbs: 250,
    };

    const deficit = calculateMacroDeficit(mockTarget, current);

    expect(deficit.calories).toBe(500);
    expect(deficit.protein).toBe(40);
    expect(deficit.fat).toBe(20);
    expect(deficit.carbs).toBe(50);
    expect(deficit.isFulfilled).toBe(false);
  });

  it('marks macro deficit as fulfilled when current exceeds or meets target', () => {
    const current: MacroCurrent = {
      calories: 2510,
      protein: 162,
      fat: 71,
      carbs: 305,
    };

    const deficit = calculateMacroDeficit(mockTarget, current);

    expect(deficit.calories).toBe(0);
    expect(deficit.protein).toBe(0);
    expect(deficit.fat).toBe(0);
    expect(deficit.carbs).toBe(0);
    expect(deficit.isFulfilled).toBe(true);
  });

  it('recommends valid food portions to fill deficit', () => {
    const current: MacroCurrent = {
      calories: 2100,
      protein: 130,
      fat: 55,
      carbs: 260,
    };

    const deficit = calculateMacroDeficit(mockTarget, current);
    const recommendations = recommendOptimalFoodCombination(deficit, mockFoods);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].grams).toBeGreaterThan(0);

    const totalP = recommendations.reduce((sum, item) => sum + item.protein, 0);
    expect(totalP).toBeGreaterThan(15); // Significant protein provision
  });

  it('never recommends unrealistic portions for oils or powders', () => {
    const hugeDeficit = { calories: 2000, protein: 150, fat: 150, carbs: 200, isFulfilled: false };
    const foodsWithOil = [
      { name: 'Масло оливковое', calories: 884, protein: 0, fat: 99.8, carbs: 0, baseWeight: 100 },
      { name: 'Протеиновый концентрат сывороточный', calories: 400, protein: 80, fat: 5, carbs: 10, baseWeight: 100 },
      { name: 'Творог 5%', calories: 121, protein: 17.2, fat: 5, carbs: 1.8, baseWeight: 100 },
    ];

    const recommendations = recommendOptimalFoodCombination(hugeDeficit, foodsWithOil);
    for (const item of recommendations) {
      if (item.name.includes('Масло')) {
        expect(item.grams).toBeLessThanOrEqual(20); // Max 20g of oil
      }
      if (item.name.includes('Протеиновый')) {
        expect(item.grams).toBeLessThanOrEqual(40); // Max 40g of protein powder
      }
    }
  });

  it('generates fallback expert advice string without errors', async () => {
    const current: MacroCurrent = {
      calories: 2000,
      protein: 120,
      fat: 50,
      carbs: 250,
    };

    const deficit = calculateMacroDeficit(mockTarget, current);
    const recommendations = recommendOptimalFoodCombination(deficit, mockFoods);
    const advice = await generateSmartAdvisorAdvice(deficit, recommendations);

    expect(advice).toContain('Совет нутрициолога');
    expect(typeof advice).toBe('string');
  });
});
