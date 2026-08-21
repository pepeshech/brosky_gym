import { describe, it, expect } from 'vitest';
import {
  calculateMacroDeficit,
  recommendOptimalFoodCombination,
  generateSmartAdvisorAdvice,
  inferFoodCategory,
  type MacroTarget,
  type MacroCurrent,
  type FoodCandidate,
} from '../utils/macroOptimizer';

describe('macroOptimizer (Simplex MILP Engine 2.0)', () => {
  const mockTarget: MacroTarget = {
    calories: 2500,
    proteinGrams: 160,
    fatGrams: 70,
    carbsGrams: 300,
    fiberGrams: 30,
  };

  const mockFoods: FoodCandidate[] = [
    { name: 'Творог 5%', calories: 121, protein: 17.2, fat: 5, carbs: 1.8, baseWeight: 100 },
    { name: 'Куриное филе', calories: 170, protein: 30, fat: 3.5, carbs: 0, baseWeight: 100 },
    { name: 'Банан', calories: 96, protein: 1.5, fat: 0.2, carbs: 22, baseWeight: 100 },
    { name: 'Миндаль', calories: 579, protein: 21.2, fat: 49.9, carbs: 21.6, baseWeight: 100 },
    { name: 'Гречневая каша', calories: 110, protein: 4, fat: 1, carbs: 21, baseWeight: 100 },
    { name: 'Масло оливковое', calories: 884, protein: 0, fat: 99.8, carbs: 0, baseWeight: 100 },
  ];

  describe('Food Category Inference', () => {
    it('infers proper categories for culinary harmony', () => {
      expect(inferFoodCategory({ name: 'Куриное филе вареное', calories: 165, protein: 31, fat: 3, carbs: 0, baseWeight: 100 })).toBe('protein');
      expect(inferFoodCategory({ name: 'Овсяная крупа', calories: 350, protein: 12, fat: 6, carbs: 65, baseWeight: 100 })).toBe('carb');
      expect(inferFoodCategory({ name: 'Масло льняное', calories: 884, protein: 0, fat: 100, carbs: 0, baseWeight: 100 })).toBe('fat');
      expect(inferFoodCategory({ name: 'Брокколи на пару', calories: 34, protein: 2.8, fat: 0.4, carbs: 7, baseWeight: 100 })).toBe('veg');
      expect(inferFoodCategory({ name: 'Сывороточный протеин Whey', calories: 390, protein: 80, fat: 4, carbs: 8, baseWeight: 100 })).toBe('supplement');
    });
  });

  describe('Macro Deficit Calculation', () => {
    it('calculates macro deficit correctly when under target', () => {
      const current: MacroCurrent = {
        calories: 2000,
        protein: 120,
        fat: 50,
        carbs: 250,
        fiber: 15,
      };

      const deficit = calculateMacroDeficit(mockTarget, current);

      expect(deficit.calories).toBe(500);
      expect(deficit.protein).toBe(40);
      expect(deficit.fat).toBe(20);
      expect(deficit.carbs).toBe(50);
      expect(deficit.fiber).toBe(15);
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
  });

  describe('Simplex Multi-Item Recommender', () => {
    it('recommends balanced multi-item combination for large deficit', () => {
      const current: MacroCurrent = {
        calories: 1900,
        protein: 110,
        fat: 45,
        carbs: 220,
      };

      const deficit = calculateMacroDeficit(mockTarget, current);
      const recommendations = recommendOptimalFoodCombination(deficit, mockFoods, 3);

      expect(recommendations.length).toBeGreaterThanOrEqual(1);
      expect(recommendations.length).toBeLessThanOrEqual(3);

      const totalP = recommendations.reduce((sum, item) => sum + item.protein, 0);
      const totalKcal = recommendations.reduce((sum, item) => sum + item.calories, 0);

      expect(totalP).toBeGreaterThan(25); // significant protein close to 50g deficit
      expect(totalKcal).toBeLessThanOrEqual(deficit.calories + 50);
    });

    it('never recommends unrealistic portions for oils or powders', () => {
      const hugeDeficit = { calories: 2000, protein: 150, fat: 150, carbs: 200, fiber: 20, isFulfilled: false };
      const foodsWithOil: FoodCandidate[] = [
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
  });

  describe('generateSmartAdvisorAdvice', () => {
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
});
