import { describe, it, expect } from 'vitest';
import {
  calculateLBM,
  calculateBMR_Mifflin,
  calculateBMR_Katch,
  calculateNEAT,
  calculateEAT,
  calculateTDEE,
  generateMacroForDay,
  generateDietPlans,
  calculateNavyBodyFat,
  getTargetStepsForGoal,
  calculateWilksScore,
  calculateDotsScore,
  getDotsLevelCategory,
  calculateRelativeStrength,
  calculatePowerliftingRank
} from '../utils/formulas';
import type { AthleteProfile } from '../types';

describe('Formulas Math Engine', () => {
  describe('getTargetStepsForGoal', () => {
    it('returns correct step targets for goals', () => {
      expect(getTargetStepsForGoal('cut')).toBe(13000);
      expect(getTargetStepsForGoal('recomp')).toBe(11000);
      expect(getTargetStepsForGoal('maintenance')).toBe(9000);
      expect(getTargetStepsForGoal('bulk')).toBe(7000);
    });
  });

  describe('calculateLBM', () => {
    it('calculates Lean Body Mass accurately', () => {
      // 80kg at 15% fat => 80 * 0.85 = 68kg
      expect(calculateLBM(80, 15)).toBe(68);
      // 70kg at 10% fat => 70 * 0.90 = 63kg
      expect(calculateLBM(70, 10)).toBe(63);
    });
  });

  describe('calculateBMR_Mifflin', () => {
    it('calculates BMR for male accurately', () => {
      // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
      expect(calculateBMR_Mifflin(80, 180, 30, 'male')).toBe(1780);
    });

    it('calculates BMR for female accurately', () => {
      // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
      expect(calculateBMR_Mifflin(60, 165, 25, 'female')).toBe(1345.25);
    });
  });

  describe('calculateBMR_Katch', () => {
    it('calculates BMR Katch-McArdle using LBM', () => {
      // 370 + 21.6 * 68 = 370 + 1468.8 = 1838.8 => rounded 1839
      expect(calculateBMR_Katch(68)).toBe(1839);
    });
  });

  describe('calculateNEAT', () => {
    it('scales non-exercise activity thermogenesis by steps and weight', () => {
      // 10000 steps at 70kg = 10000 * 0.04 * 1 = 400 kcal
      expect(calculateNEAT(10000, 70)).toBe(400);
      // 10000 steps at 84kg = 10000 * 0.04 * (84/70) = 480 kcal
      expect(calculateNEAT(10000, 84)).toBe(480);
    });
  });

  describe('calculateEAT', () => {
    it('calculates exercise activity thermogenesis threshold', () => {
      expect(calculateEAT(80)).toBe(400);
    });
  });

  describe('calculateTDEE', () => {
    const sampleProfile: AthleteProfile = {
      gender: 'male',
      age: 28,
      weight: 80,
      height: 180,
      fatPercent: 15,
      selectedGoal: 'recomp',
      username: 'TestAthlete',
      isOnboarded: true,
    };

    it('returns complete TDEE metrics for athlete profile', () => {
      const result = calculateTDEE(sampleProfile);
      expect(result.lbm).toBe(68);
      expect(result.bmrMifflin).toBe(1790);
      expect(result.bmrKatch).toBe(1839);
      expect(result.bmrAverage).toBe(1815);
      expect(result.neat).toBeGreaterThan(0);
      expect(result.tdeeTrain).toBeGreaterThan(result.tdeeRest);
    });
  });

  describe('generateMacroForDay', () => {
    it('generates macros correctly with workout day water bonus', () => {
      const restDayMacro = generateMacroForDay(2500, 80, 2.0, 25, 11000, false);
      expect(restDayMacro.protein.grams).toBe(160);
      expect(restDayMacro.water).toBe(80 * 40); // 3200ml

      const workoutDayMacro = generateMacroForDay(2500, 80, 2.0, 25, 11000, true);
      expect(workoutDayMacro.water).toBe(80 * 40 + 600); // 3800ml
    });
  });

  describe('generateDietPlans', () => {
    const sampleProfile: AthleteProfile = {
      gender: 'male',
      age: 30,
      weight: 75,
      height: 178,
      fatPercent: 14,
      selectedGoal: 'maintenance',
      username: 'Alex',
      isOnboarded: true,
    };

    it('generates all 4 goal diet plans (recomp, maintenance, bulk, cut)', () => {
      const plans = generateDietPlans(sampleProfile);
      expect(plans.recomp).toBeDefined();
      expect(plans.maintenance).toBeDefined();
      expect(plans.bulk).toBeDefined();
      expect(plans.cut).toBeDefined();

      expect(plans.bulk.trainingDay.calories).toBeGreaterThan(plans.maintenance.trainingDay.calories);
      expect(plans.cut.trainingDay.calories).toBeLessThan(plans.maintenance.trainingDay.calories);
    });
  });

  describe('calculateNavyBodyFat', () => {
    it('returns error if height, neck or waist are invalid', () => {
      const res = calculateNavyBodyFat({ gender: 'male', height: 0, neck: 38, waist: 85 });
      expect(res.error).toBe('Пожалуйста, введите корректные числовые значения.');
      expect(res.fatPercent).toBeNull();
    });

    it('calculates body fat for male correctly', () => {
      // Male height 180cm, neck 38cm, waist 85cm
      const res = calculateNavyBodyFat({ gender: 'male', height: 180, neck: 38, waist: 85 });
      expect(res.error).toBeNull();
      expect(res.fatPercent).toBeGreaterThan(5);
      expect(res.fatPercent).toBeLessThan(25);
    });

    it('returns error for male if waist <= neck', () => {
      const res = calculateNavyBodyFat({ gender: 'male', height: 180, neck: 40, waist: 40 });
      expect(res.error).toBe('Обхват талии должен быть больше обхвата шеи.');
      expect(res.fatPercent).toBeNull();
    });

    it('calculates body fat for female correctly', () => {
      // Female height 165cm, neck 34cm, waist 70cm, hips 95cm
      const res = calculateNavyBodyFat({ gender: 'female', height: 165, neck: 34, waist: 70, hips: 95 });
      expect(res.error).toBeNull();
      expect(res.fatPercent).toBeGreaterThan(10);
      expect(res.fatPercent).toBeLessThan(40);
    });

    it('returns error for female if hips are missing', () => {
      const res = calculateNavyBodyFat({ gender: 'female', height: 165, neck: 34, waist: 70 });
      expect(res.error).toBe('Для женщин необходим обхват бедер.');
      expect(res.fatPercent).toBeNull();
    });

    it('returns error for female if waist + hips <= neck', () => {
      const res = calculateNavyBodyFat({ gender: 'female', height: 165, neck: 40, waist: 20, hips: 20 });
      expect(res.error).toBe('Сумма обхватов талии и бедер должна быть больше обхвата шеи.');
      expect(res.fatPercent).toBeNull();
    });
  });

  describe('DOTS & Wilks Relative Strength Engine', () => {
    it('returns 0 if body weight or total lifted <= 0', () => {
      expect(calculateWilksScore('male', 0, 500)).toBe(0);
      expect(calculateDotsScore('male', 80, 0)).toBe(0);
    });

    it('calculates Wilks score for male powerlifter accurately', () => {
      // 80kg male lifting 500kg total
      const wilks = calculateWilksScore('male', 80, 500);
      expect(wilks).toBeGreaterThan(320);
      expect(wilks).toBeLessThan(370);
    });

    it('calculates DOTS score for male powerlifter accurately', () => {
      // 80kg male lifting 500kg total
      const dots = calculateDotsScore('male', 80, 500);
      expect(dots).toBeGreaterThan(320);
      expect(dots).toBeLessThan(370);
    });

    it('calculates Wilks and DOTS score for female powerlifter accurately', () => {
      // 60kg female lifting 300kg total
      const wilks = calculateWilksScore('female', 60, 300);
      const dots = calculateDotsScore('female', 60, 300);
      expect(wilks).toBeGreaterThan(280);
      expect(dots).toBeGreaterThan(280);
    });

    it('classifies DOTS score level categories correctly', () => {
      expect(getDotsLevelCategory(150).category).toBe('Начинающий');
      expect(getDotsLevelCategory(250).category).toBe('Любитель');
      expect(getDotsLevelCategory(350).category).toBe('Продвинутый');
      expect(getDotsLevelCategory(450).category).toBe('Элитный атлет');
      expect(getDotsLevelCategory(520).category).toBe('Гроссмейстер / Pro');
    });

    it('calculates relative strength result struct correctly', () => {
      const res = calculateRelativeStrength({ gender: 'male', bodyWeight: 80, totalLifted: 500 });
      expect(res.dots).toBeGreaterThan(300);
      expect(res.wilks).toBeGreaterThan(300);
      expect(res.levelCategory).toBeDefined();
      expect(res.levelColor).toBeDefined();
    });
  });

  describe('Powerlifting Rank Benchmarks Engine', () => {
    it('returns "Без разряда" for 0 weight or total', () => {
      const res = calculatePowerliftingRank('male', 80, 0);
      expect(res.currentRank).toBe('Без разряда');
      expect(res.progressPercent).toBe(0);
    });

    it('calculates beginner rank accurately', () => {
      // 80kg male, lifting 200kg total (< 80*2.8 = 224kg)
      const res = calculatePowerliftingRank('male', 80, 200);
      expect(res.currentRank).toBe('Новичок');
      expect(res.nextRank).toBe('3 юношеский');
      expect(res.neededWeight).toBe(24);
    });

    it('calculates higher rank accurately (KMS)', () => {
      // 80kg male, lifting 520kg total (>= 80*6.4 = 512kg)
      const res = calculatePowerliftingRank('male', 80, 520);
      expect(res.currentRank).toBe('КМС');
      expect(res.nextRank).toBe('МС');
      expect(res.neededWeight).toBeGreaterThan(0);
    });
  });
});
