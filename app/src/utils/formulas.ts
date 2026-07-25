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

// Бонус воды в дни силовых тренировок (мл)
export const WORKOUT_WATER_BONUS_ML = 600;

// Генерация макронутриентов под конкретные калории и нормы
export const generateMacroForDay = (
  calories: number,
  weight: number,
  proteinRatio: number,
  fatPercent: number,
  steps: number,
  isWorkoutDay = false
): MacroPlan => {
  const proteinGrams = Math.round(weight * proteinRatio * 10) / 10;
  const proteinCalories = Math.round(proteinGrams * 4);

  const fatCalories = Math.round(calories * (fatPercent / 100));
  const fatGrams = Math.round((fatCalories / 9) * 10) / 10;

  const carbsCalories = Math.round(calories - proteinCalories - fatCalories);
  const carbsGrams = Math.round((carbsCalories / 4) * 10) / 10;

  // Вода: базовая норма 40 мл/кг + 600 мл в день силовой тренировки
  const baseWater = Math.round(weight * 40);
  const water = isWorkoutDay ? baseWater + WORKOUT_WATER_BONUS_ML : baseWater;

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
export const generateDietPlans = (profile: AthleteProfile, totalVolume?: number, isWorkoutDay = false): Record<'recomp' | 'maintenance' | 'bulk' | 'cut', DietPlan> => {
  const t = calculateTDEE(profile, totalVolume);

  return {
    recomp: {
      trainingDay: generateMacroForDay(Math.round(t.tdeeTrain * 0.95), profile.weight, 2.2, 25, GOAL_STEPS.recomp, isWorkoutDay),
      restDay: generateMacroForDay(Math.round(t.tdeeRest * 0.90), profile.weight, 2.0, 30, GOAL_STEPS.recomp, false),
    },
    maintenance: {
      trainingDay: generateMacroForDay(t.tdeeTrain, profile.weight, 2.2, 25, GOAL_STEPS.maintenance, isWorkoutDay),
      restDay: generateMacroForDay(t.tdeeRest, profile.weight, 2.0, 30, GOAL_STEPS.maintenance, false),
    },
    bulk: {
      trainingDay: generateMacroForDay(Math.round(t.tdeeTrain * 1.10), profile.weight, 2.2, 25, GOAL_STEPS.bulk, isWorkoutDay),
      restDay: generateMacroForDay(Math.round(t.tdeeRest * 1.05), profile.weight, 2.0, 30, GOAL_STEPS.bulk, false),
    },
    cut: {
      trainingDay: generateMacroForDay(Math.round(t.tdeeTrain * 0.80), profile.weight, 2.5, 25, GOAL_STEPS.cut, isWorkoutDay),
      restDay: generateMacroForDay(Math.round(t.tdeeRest * 0.85), profile.weight, 2.4, 30, GOAL_STEPS.cut, false),
    },
  };
};

export interface NavyBodyFatParams {
  gender: 'male' | 'female';
  height: number;
  neck: number;
  waist: number;
  hips?: number;
}

export interface NavyBodyFatResult {
  fatPercent: number | null;
  error: string | null;
}

// Расчет процента жира по методу ВМФ США (US Navy Body Fat Calculator)
export const calculateNavyBodyFat = (params: NavyBodyFatParams): NavyBodyFatResult => {
  const { gender, height, neck, waist, hips } = params;

  if (isNaN(height) || height <= 0 || isNaN(neck) || neck <= 0 || isNaN(waist) || waist <= 0) {
    return { fatPercent: null, error: 'Пожалуйста, введите корректные числовые значения.' };
  }

  if (gender === 'male') {
    if (waist <= neck) {
      return { fatPercent: null, error: 'Обхват талии должен быть больше обхвата шеи.' };
    }
    const density = 1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height);
    const fatPercent = (495 / density) - 450;
    const rounded = Math.round(Math.max(2, Math.min(60, fatPercent)) * 10) / 10;
    return { fatPercent: rounded, error: null };
  } else {
    if (hips === undefined || isNaN(hips) || hips <= 0) {
      return { fatPercent: null, error: 'Для женщин необходим обхват бедер.' };
    }
    if ((waist + hips) <= neck) {
      return { fatPercent: null, error: 'Сумма обхватов талии и бедер должна быть больше обхвата шеи.' };
    }
    const density = 1.29579 - 0.35004 * Math.log10(waist + hips - neck) + 0.22100 * Math.log10(height);
    const fatPercent = (495 / density) - 450;
    const rounded = Math.round(Math.max(5, Math.min(70, fatPercent)) * 10) / 10;
    return { fatPercent: rounded, error: null };
  }
};

export interface RelativeStrengthParams {
  gender: 'male' | 'female';
  bodyWeight: number;
  totalLifted: number;
}

export interface RelativeStrengthResult {
  dots: number;
  wilks: number;
  levelCategory: string;
  levelColor: string;
}

// 1. Расчет коэффициента Wilks (Классический пауэрлифтерский стандарт)
export const calculateWilksScore = (gender: 'male' | 'female', bodyWeight: number, totalLifted: number): number => {
  if (bodyWeight <= 0 || totalLifted <= 0) return 0;

  let coeff: number;
  if (gender === 'male') {
    const a = -216.0475144;
    const b = 16.2606339;
    const c = -0.002388645;
    const d = -0.00113732;
    const e = 7.01863e-6;
    const f = -1.291e-8;
    const w = bodyWeight;
    const denom = a + b * w + c * Math.pow(w, 2) + d * Math.pow(w, 3) + e * Math.pow(w, 4) + f * Math.pow(w, 5);
    coeff = 500 / denom;
  } else {
    const a = 594.3174777;
    const b = -27.2384253;
    const c = 0.8211222687;
    const d = -0.00930733913;
    const e = 4.731582e-5;
    const f = -9.054e-8;
    const w = bodyWeight;
    const denom = a + b * w + c * Math.pow(w, 2) + d * Math.pow(w, 3) + e * Math.pow(w, 4) + f * Math.pow(w, 5);
    coeff = 500 / denom;
  }

  return Math.round(totalLifted * coeff * 100) / 100;
};

// 2. Расчет коэффициента DOTS (Официальный международный стандарт IPF 2019+)
export const calculateDotsScore = (gender: 'male' | 'female', bodyWeight: number, totalLifted: number): number => {
  if (bodyWeight <= 0 || totalLifted <= 0) return 0;

  let coeff: number;
  if (gender === 'male') {
    const A = -0.0000010930;
    const B = 0.0007391293;
    const C = -0.1918759221;
    const D = 24.0900786;
    const E = -307.75376;
    const w = bodyWeight;
    const denom = A * Math.pow(w, 4) + B * Math.pow(w, 3) + C * Math.pow(w, 2) + D * w + E;
    coeff = 500 / denom;
  } else {
    const A = -0.0000010706;
    const B = 0.0005158568;
    const C = -0.1126655495;
    const D = 13.6175032;
    const E = -57.96288;
    const w = bodyWeight;
    const denom = A * Math.pow(w, 4) + B * Math.pow(w, 3) + C * Math.pow(w, 2) + D * w + E;
    coeff = 500 / denom;
  }

  return Math.round(totalLifted * coeff * 100) / 100;
};

// 3. Определение уровня категории атлета по очкам DOTS
export const getDotsLevelCategory = (dots: number): { category: string; color: string } => {
  if (dots >= 500) return { category: 'Гроссмейстер / Pro', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  if (dots >= 400) return { category: 'Элитный атлет', color: 'text-purple-600 bg-purple-50 border-purple-200' };
  if (dots >= 300) return { category: 'Продвинутый', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (dots >= 200) return { category: 'Любитель', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  return { category: 'Начинающий', color: 'text-gray-600 bg-gray-50 border-gray-200' };
};

export const calculateRelativeStrength = (params: RelativeStrengthParams): RelativeStrengthResult => {
  const wilks = calculateWilksScore(params.gender, params.bodyWeight, params.totalLifted);
  const dots = calculateDotsScore(params.gender, params.bodyWeight, params.totalLifted);
  const { category, color } = getDotsLevelCategory(dots);

  return {
    dots,
    wilks,
    levelCategory: category,
    levelColor: color,
  };
};

export interface RankProgressResult {
  currentRank: string;
  currentRankColor: string;
  nextRank: string | null;
  targetWeight: number;
  currentWeight: number;
  neededWeight: number;
  progressPercent: number;
}

export const POWERLIFTING_RANKS = [
  { id: 'youth3', name: '3 юношеский', maleRatio: 2.8, femaleRatio: 2.0, color: 'text-gray-600 bg-gray-100 border-gray-300' },
  { id: 'youth2', name: '2 юношеский', maleRatio: 3.2, femaleRatio: 2.4, color: 'text-slate-600 bg-slate-100 border-slate-300' },
  { id: 'youth1', name: '1 юношеский', maleRatio: 3.6, femaleRatio: 2.8, color: 'text-zinc-600 bg-zinc-100 border-zinc-300' },
  { id: 'adult3', name: '3 взрослый', maleRatio: 4.2, femaleRatio: 3.3, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'adult2', name: '2 взрослый', maleRatio: 4.8, femaleRatio: 3.9, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { id: 'adult1', name: '1 взрослый', maleRatio: 5.5, femaleRatio: 4.5, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'kms', name: 'КМС', maleRatio: 6.4, femaleRatio: 5.3, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'ms', name: 'МС', maleRatio: 7.4, femaleRatio: 6.2, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'msmk', name: 'МСМК', maleRatio: 8.5, femaleRatio: 7.2, color: 'text-amber-600 bg-amber-50 border-amber-300' },
];

export const calculatePowerliftingRank = (
  gender: 'male' | 'female',
  bodyWeight: number,
  totalLifted: number
): RankProgressResult => {
  if (bodyWeight <= 0 || totalLifted <= 0) {
    const target = Math.round(bodyWeight * (gender === 'male' ? POWERLIFTING_RANKS[0].maleRatio : POWERLIFTING_RANKS[0].femaleRatio));
    return {
      currentRank: 'Без разряда',
      currentRankColor: 'text-gray-500 bg-gray-50 border-gray-200',
      nextRank: POWERLIFTING_RANKS[0].name,
      targetWeight: target,
      currentWeight: totalLifted,
      neededWeight: target,
      progressPercent: 0,
    };
  }

  const isMale = gender === 'male';
  const thresholds = POWERLIFTING_RANKS.map(r => ({
    ...r,
    required: Math.round(bodyWeight * (isMale ? r.maleRatio : r.femaleRatio)),
  }));

  let currentRankIdx = -1;
  for (let i = 0; i < thresholds.length; i++) {
    if (totalLifted >= thresholds[i].required) {
      currentRankIdx = i;
    } else {
      break;
    }
  }

  if (currentRankIdx === -1) {
    const nextReq = thresholds[0].required;
    const progress = Math.min(99, Math.round((totalLifted / nextReq) * 100));
    return {
      currentRank: 'Новичок',
      currentRankColor: 'text-gray-600 bg-gray-50 border-gray-200',
      nextRank: thresholds[0].name,
      targetWeight: nextReq,
      currentWeight: totalLifted,
      neededWeight: Math.max(0, nextReq - totalLifted),
      progressPercent: progress,
    };
  }

  const current = thresholds[currentRankIdx];
  if (currentRankIdx === thresholds.length - 1) {
    return {
      currentRank: current.name,
      currentRankColor: current.color,
      nextRank: null,
      targetWeight: current.required,
      currentWeight: totalLifted,
      neededWeight: 0,
      progressPercent: 100,
    };
  }

  const next = thresholds[currentRankIdx + 1];
  const range = next.required - current.required;
  const currentProgressInStep = totalLifted - current.required;
  const progressPercent = Math.min(99, Math.round((currentProgressInStep / range) * 100));

  return {
    currentRank: current.name,
    currentRankColor: current.color,
    nextRank: next.name,
    targetWeight: next.required,
    currentWeight: totalLifted,
    neededWeight: Math.max(0, next.required - totalLifted),
    progressPercent,
  };
};

export interface AdaptiveTDEEResult {
  adaptiveTDEE: number;
  confidenceLevel: 'insufficient' | 'moderate' | 'high';
  confidenceLabel: string;
  dataDaysCount: number;
  weightChangePerWeekKg: number;
  avgDailyCalories: number;
  differenceFromStatic: number;
}

export interface EWMATrendEntry {
  date: string;
  weight: number;
  weightTrend: number;
}

/**
 * Exponentially Weighted Moving Average (EWMA) weight trend calculation.
 * Smooths out daily water, salt, and glycogen weight fluctuations.
 */
export const calculateEWMATrend = (
  entries: Array<{ date: string; weight?: number }>,
  alpha: number = 0.25
): EWMATrendEntry[] => {
  const sorted = entries
    .filter((e): e is { date: string; weight: number } => e.weight !== undefined && e.weight > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) return [];

  let currentTrend = sorted[0].weight;
  const result: EWMATrendEntry[] = [];

  for (const entry of sorted) {
    currentTrend = Math.round((alpha * entry.weight + (1 - alpha) * currentTrend) * 100) / 100;
    result.push({
      date: entry.date,
      weight: entry.weight,
      weightTrend: currentTrend,
    });
  }

  return result;
};

/**
 * Science-backed Adaptive Expenditure Engine (MacroFactor-style Exponential Moving Average).
 * Computes real TDEE by correlating historical body weight changes and logged calorie intake.
 */
export const calculateAdaptiveTDEE = (
  weightEntries: Array<{ date: string; weight?: number }>,
  nutritionLogs: Array<{ date: string; calories?: number }>,
  staticTDEE: number
): AdaptiveTDEEResult => {
  const pairedMap = new Map<string, { weight?: number; calories?: number }>();

  for (const w of weightEntries) {
    if (w.weight && w.weight > 0) {
      pairedMap.set(w.date, { ...pairedMap.get(w.date), weight: w.weight });
    }
  }

  for (const n of nutritionLogs) {
    if (n.calories && n.calories > 0) {
      pairedMap.set(n.date, { ...pairedMap.get(n.date), calories: n.calories });
    }
  }

  const sortedDates = Array.from(pairedMap.keys()).sort();

  const validEntries: Array<{ date: string; weight?: number; calories?: number }> = [];
  for (const date of sortedDates) {
    const entry = pairedMap.get(date);
    if (entry && (entry.weight || entry.calories)) {
      validEntries.push({ date, ...entry });
    }
  }

  const dataDaysCount = validEntries.length;

  if (dataDaysCount < 7) {
    return {
      adaptiveTDEE: staticTDEE,
      confidenceLevel: 'insufficient',
      confidenceLabel: 'Недостаточно данных (< 7 дней замеров)',
      dataDaysCount,
      weightChangePerWeekKg: 0,
      avgDailyCalories: 0,
      differenceFromStatic: 0,
    };
  }

  const entriesWithWeight = validEntries.filter(e => e.weight !== undefined && e.weight > 0);
  const entriesWithCalories = validEntries.filter(e => e.calories !== undefined && e.calories > 0);

  if (entriesWithWeight.length < 2 || entriesWithCalories.length < 5) {
    return {
      adaptiveTDEE: staticTDEE,
      confidenceLevel: 'insufficient',
      confidenceLabel: 'Требуется больше замеров веса и калорий',
      dataDaysCount,
      weightChangePerWeekKg: 0,
      avgDailyCalories: 0,
      differenceFromStatic: 0,
    };
  }

  const totalCalories = entriesWithCalories.reduce((sum, e) => sum + (e.calories || 0), 0);
  const avgDailyCalories = Math.round(totalCalories / entriesWithCalories.length);

  // EWMA trend smoothing for accurate start and end body mass
  const ewmaTrends = calculateEWMATrend(entriesWithWeight, 0.15);
  const firstWeight = ewmaTrends.length > 0 ? ewmaTrends[0].weightTrend : entriesWithWeight[0].weight!;
  const lastWeight = ewmaTrends.length > 0 ? ewmaTrends[ewmaTrends.length - 1].weightTrend : entriesWithWeight[entriesWithWeight.length - 1].weight!;
  
  const startDate = new Date(entriesWithWeight[0].date).getTime();
  const endDate = new Date(entriesWithWeight[entriesWithWeight.length - 1].date).getTime();
  const daysDiff = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));

  const totalWeightChange = lastWeight - firstWeight;
  const weightChangePerDay = totalWeightChange / daysDiff;
  const weightChangePerWeekKg = Math.round((weightChangePerDay * 7) * 100) / 100;

  const energySurplusOrDeficitPerDay = weightChangePerDay * 7700;
  const rawAdaptiveTDEE = Math.round(avgDailyCalories - energySurplusOrDeficitPerDay);

  let confidenceLevel: 'insufficient' | 'moderate' | 'high';
  let confidenceLabel: string;
  let finalTDEE: number;

  if (dataDaysCount >= 14) {
    confidenceLevel = 'high';
    confidenceLabel = `Высокая точность (${dataDaysCount} дн.)`;
    finalTDEE = rawAdaptiveTDEE;
  } else {
    confidenceLevel = 'moderate';
    confidenceLabel = `Средняя точность (${dataDaysCount} дн.)`;
    finalTDEE = Math.round(staticTDEE * 0.5 + rawAdaptiveTDEE * 0.5);
  }

  finalTDEE = Math.max(1000, Math.min(5000, finalTDEE));
  const differenceFromStatic = finalTDEE - staticTDEE;

  return {
    adaptiveTDEE: finalTDEE,
    confidenceLevel,
    confidenceLabel,
    dataDaysCount,
    weightChangePerWeekKg,
    avgDailyCalories,
    differenceFromStatic,
  };
};

export interface OneRepMaxMatrix {
  epley: number;
  brzycki: number;
  lander: number;
  mayhew: number;
  wathan: number;
  oconner: number;
  average: number;
  optimal: number;
  optimalFormulaName: string;
}

/**
 * Calculates 1RM across 6 scientific formulas and identifies optimal estimate.
 */
export const calculate1RMMatrix = (weight: number, reps: number): OneRepMaxMatrix => {
  if (weight <= 0 || reps <= 0) {
    return {
      epley: 0,
      brzycki: 0,
      lander: 0,
      mayhew: 0,
      wathan: 0,
      oconner: 0,
      average: 0,
      optimal: 0,
      optimalFormulaName: '—',
    };
  }

  if (reps === 1) {
    const w = Math.round(weight * 10) / 10;
    return {
      epley: w,
      brzycki: w,
      lander: w,
      mayhew: w,
      wathan: w,
      oconner: w,
      average: w,
      optimal: w,
      optimalFormulaName: 'Прямой вес (1 повтор)',
    };
  }

  const r = Math.min(30, reps);
  const w = weight;

  const epley = Math.round(w * (1 + r / 30) * 10) / 10;
  const brzycki = r >= 37 ? epley : Math.round(w * (36 / (37 - r)) * 10) / 10;
  const lander = Math.round(((100 * w) / (101.3 - 2.6712 * r)) * 10) / 10;
  const mayhew = Math.round(((100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r))) * 10) / 10;
  const wathan = Math.round(((100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r))) * 10) / 10;
  const oconner = Math.round(w * (1 + r / 40) * 10) / 10;

  const allFormulas = [epley, brzycki, lander, mayhew, wathan, oconner];
  const average = Math.round((allFormulas.reduce((s, v) => s + v, 0) / allFormulas.length) * 10) / 10;

  let optimal: number;
  let optimalFormulaName: string;

  if (r <= 4) {
    optimal = lander;
    optimalFormulaName = 'Lander (1-4 повтора)';
  } else if (r <= 10) {
    optimal = epley;
    optimalFormulaName = 'Epley (5-10 повторов)';
  } else {
    optimal = wathan;
    optimalFormulaName = 'Wathan (10+ повторов)';
  }

  return {
    epley,
    brzycki,
    lander,
    mayhew,
    wathan,
    oconner,
    average,
    optimal,
    optimalFormulaName,
  };
};

/**
 * Расчёт скорректированного 1RM с учетом запаса повторов (RIR - Reps in Reserve)
 * Epley-Tuchscherer formula: 1RM = Weight * (1 + (Reps + RIR) / 30)
 */
export const calculateAdjusted1RM = (weight: number, reps: number, rir: number = 0): number => {
  if (weight <= 0 || reps <= 0) return 0;
  const effectiveReps = Math.max(1, reps + Math.max(0, rir));
  return Math.round(weight * (1 + effectiveReps / 30) * 10) / 10;
};

/**
 * Расчет процента от 1RM по матрице RTS RPE (Mike Tuchscherer)
 */
export const getRpePercent1RM = (reps: number, rpe: number): number => {
  const rir = Math.max(0, 10 - rpe);
  const totalReps = reps + rir;
  const percent = 1 / (1 + 0.0333 * totalReps);
  return Math.round(percent * 1000) / 10;
};






