import type { AthleteProfile } from '../types';

export interface MacroPlan {
  calories: number;
  protein: { grams: number; calories: number };
  fat: { grams: number; calories: number };
  carbs: { grams: number; calories: number };
  water: number;
  steps: number; // Цель по шагам в день
}

export interface DietPlan {
  trainingDay: MacroPlan;
  restDay: MacroPlan;
}

// Научно-обоснованные нормы шагов для разных целей активности (NEAT)
export const GOAL_STEPS: Record<'recomp' | 'maintenance' | 'bulk' | 'cut', number> = {
  cut: 13000,         // Сушка: максимизация NEAT-расхода для жиросжигания без голодания
  recomp: 11000,      // Рекомпозиция: оптимизация чувствительности к инсулину при сохранении анаболического потенциала
  maintenance: 9000,  // Поддержание: оптимальная рекомендация для здоровья сердечно-сосудистой системы
  bulk: 7000          // Набор: сохранение калорий и сил для силовых тренировок при минимально необходимой активности
};

export const getTargetStepsForGoal = (goal: 'recomp' | 'maintenance' | 'bulk' | 'cut'): number => {
  return GOAL_STEPS[goal] || 9000;
};

// 1. Чистая масса тела (LBM)
export const calculateLBM = (weight: number, fatPercent: number): number => {
  return weight * (1 - fatPercent / 100);
};

// 2. BMR Mifflin-St Jeor
export const calculateBMR_Mifflin = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female'
): number => {
  return 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
};

// 3. BMR Katch-McArdle
export const calculateBMR_Katch = (lbm: number): number => {
  return Math.round(370 + 21.6 * lbm);
};

// 4. NEAT (Внетренировочная активность с учетом веса атлета)
export const calculateNEAT = (steps: number, weight: number): number => {
  return steps * 0.04 * (weight / 70);
};

// 5. EAT (Расход энергии на силовую тренировку)
export const calculateEAT = (weight: number): number => {
  return weight * 5.0; // 5 ккал/кг для классической силовой работы
};

// Расчет базовых TDEE
export const calculateTDEE = (profile: AthleteProfile, totalVolume?: number) => {
  const lbm = calculateLBM(profile.weight, profile.fatPercent);
  const bmrMifflin = calculateBMR_Mifflin(profile.weight, profile.height, profile.age, profile.gender);
  const bmrKatch = calculateBMR_Katch(lbm);
  const bmrAverage = Math.round((bmrMifflin + bmrKatch) / 2);

  const steps = getTargetStepsForGoal(profile.selectedGoal);
  const neat = Math.round(calculateNEAT(steps, profile.weight));
  
  // EAT: рассчитываем статический EAT как минимальный порог тренировки
  const staticEat = Math.round(calculateEAT(profile.weight));
  
  // Если передан тоннаж за тренировку, считаем динамический EAT, но ограничиваем его снизу статическим порогом,
  // чтобы калорийность тренировочного дня до или в начале тренировки в кружке "Сегодня"
  // в точности соответствовала общему КБЖУ-ориентиру.
  const eat = totalVolume !== undefined
    ? Math.max(staticEat, Math.round(profile.weight * 2.0 + (totalVolume * 0.065) * (profile.weight / 75)))
    : staticEat;

  // TDEE = (BMR + Activity) + 10% TEF
  const tdeeRest = Math.round((bmrAverage + neat) * 1.10);
  const tdeeTrain = Math.round((bmrAverage + neat + eat) * 1.10);

  return {
    lbm: Math.round(lbm * 10) / 10,
    bmrMifflin: Math.round(bmrMifflin),
    bmrKatch: Math.round(bmrKatch),
    bmrAverage,
    neat,
    eat,
    tdeeRest,
    tdeeTrain,
  };
};

// Генерация макронутриентов под конкретные калории и нормы
export const generateMacroForDay = (
  calories: number,
  weight: number,
  proteinRatio: number,
  fatPercent: number,
  steps: number
): MacroPlan => {
  const proteinGrams = Math.round(weight * proteinRatio * 10) / 10;
  const proteinCalories = Math.round(proteinGrams * 4);

  const fatCalories = Math.round(calories * (fatPercent / 100));
  const fatGrams = Math.round((fatCalories / 9) * 10) / 10;

  const carbsCalories = Math.round(calories - proteinCalories - fatCalories);
  const carbsGrams = Math.round((carbsCalories / 4) * 10) / 10;

  // Вода: 35-40 мл/кг
  const water = Math.round(weight * 40);

  return {
    calories,
    protein: { grams: proteinGrams, calories: proteinCalories },
    fat: { grams: fatGrams, calories: fatCalories },
    carbs: { grams: carbsGrams, calories: carbsCalories },
    water,
    steps,
  };
};

// Генерация планов питания по режимам
export const generateDietPlans = (profile: AthleteProfile, totalVolume?: number): Record<'recomp' | 'maintenance' | 'bulk' | 'cut', DietPlan> => {
  const t = calculateTDEE(profile, totalVolume);

  return {
    recomp: {
      trainingDay: generateMacroForDay(Math.round(t.tdeeTrain * 0.95), profile.weight, 2.2, 25, GOAL_STEPS.recomp),
      restDay: generateMacroForDay(Math.round(t.tdeeRest * 0.90), profile.weight, 2.0, 30, GOAL_STEPS.recomp),
    },
    maintenance: {
      trainingDay: generateMacroForDay(t.tdeeTrain, profile.weight, 2.2, 25, GOAL_STEPS.maintenance),
      restDay: generateMacroForDay(t.tdeeRest, profile.weight, 2.0, 30, GOAL_STEPS.maintenance),
    },
    bulk: {
      trainingDay: generateMacroForDay(Math.round(t.tdeeTrain * 1.10), profile.weight, 2.2, 25, GOAL_STEPS.bulk),
      restDay: generateMacroForDay(Math.round(t.tdeeRest * 1.05), profile.weight, 2.0, 30, GOAL_STEPS.bulk),
    },
    cut: {
      trainingDay: generateMacroForDay(Math.round(t.tdeeTrain * 0.80), profile.weight, 2.5, 25, GOAL_STEPS.cut),
      restDay: generateMacroForDay(Math.round(t.tdeeRest * 0.85), profile.weight, 2.4, 30, GOAL_STEPS.cut),
    },
  };
};
