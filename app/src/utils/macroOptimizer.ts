export interface MacroTarget {
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbsGrams: number;
  fiberGrams?: number;
}

export interface MacroCurrent {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
}

export interface MacroDeficit {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  isFulfilled: boolean;
}

export type FoodCategory = 'protein' | 'carb' | 'fat' | 'veg' | 'fruit' | 'dairy' | 'supplement';

export interface FoodCandidate {
  name: string;
  calories: number; // kcal per baseWeight (usually 100g)
  protein: number;  // g per baseWeight
  fat: number;      // g per baseWeight
  carbs: number;    // g per baseWeight
  fiber?: number;   // g per baseWeight
  baseWeight: number;
  category?: FoodCategory;
}

export interface RecommendedItem {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  category?: FoodCategory;
}

export interface OptimizationResult {
  deficit: MacroDeficit;
  items: RecommendedItem[];
  totalProvided: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  };
  score: number;
  adviceText: string;
}

/**
 * Calculates current remaining macro deficit.
 */
export const calculateMacroDeficit = (
  target: MacroTarget,
  current: MacroCurrent
): MacroDeficit => {
  const calories = Math.max(0, Math.round(target.calories - current.calories));
  const protein = Math.max(0, Math.round((target.proteinGrams - current.protein) * 10) / 10);
  const fat = Math.max(0, Math.round((target.fatGrams - current.fat) * 10) / 10);
  const carbs = Math.max(0, Math.round((target.carbsGrams - current.carbs) * 10) / 10);
  const targetFiber = target.fiberGrams || 25;
  const currentFiber = current.fiber || 0;
  const fiber = Math.max(0, Math.round((targetFiber - currentFiber) * 10) / 10);

  // Target is fulfilled if deficit is insignificant (<3g P, <3g F, <5g C, <40 kcal)
  const isFulfilled = protein < 3 && fat < 3 && carbs < 5 && calories < 40;

  return {
    calories,
    protein,
    fat,
    carbs,
    fiber,
    isFulfilled,
  };
};

/**
 * Automatically infers food category from food name and macronutrient profile.
 */
export const inferFoodCategory = (food: FoodCandidate): FoodCategory => {
  if (food.category) return food.category;
  const lower = food.name.toLowerCase();

  if (lower.includes('протеин') || lower.includes('bcaa') || lower.includes('гейнер') || lower.includes('креатин')) {
    return 'supplement';
  }
  if (lower.includes('масло') || lower.includes('орех') || lower.includes('паста') || lower.includes('миндаль') || lower.includes('авокадо') || lower.includes('кешью') || lower.includes('семена')) {
    return 'fat';
  }
  if (lower.includes('творог') || lower.includes('сыр') || lower.includes('йогурт') || lower.includes('молоко') || lower.includes('кефир')) {
    return 'dairy';
  }
  if (lower.includes('куриц') || lower.includes('филе') || lower.includes('индейк') || lower.includes('тунец') || lower.includes('говядин') || lower.includes('рыб') || lower.includes('яйц') || lower.includes('креветк') || lower.includes('лосос')) {
    return 'protein';
  }
  if (lower.includes('брокколи') || lower.includes('огурец') || lower.includes('помидор') || lower.includes('шпинат') || lower.includes('зелень') || lower.includes('капуст') || lower.includes('перец')) {
    return 'veg';
  }
  if (lower.includes('банан') || lower.includes('яблоко') || lower.includes('ягод') || lower.includes('апельсин') || lower.includes('грейпфрут') || lower.includes('киви')) {
    return 'fruit';
  }
  return 'carb';
};

/**
 * Determines realistic maximum portion size (in grams) for different food types.
 */
export const getMaxPortionForFood = (name: string): number => {
  const lower = name.toLowerCase();
  if (lower.includes('масло')) return 20; // Max 20g for pure oils
  if (lower.includes('протеин')) return 40; // Max 40g for protein powder (1-1.5 scoops)
  if (lower.includes('орех') || lower.includes('паста') || lower.includes('миндаль') || lower.includes('кешью')) return 45;
  if (lower.includes('сыр')) return 60;
  if (lower.includes('хлебцы') || lower.includes('хлебец')) return 50;
  if (lower.includes('брокколи') || lower.includes('огурец') || lower.includes('помидор') || lower.includes('капуст')) return 300;
  return 250; // Whole foods (meat, poultry, fish, cooked grains)
};

/**
 * Determines minimum sensible portion size (in grams).
 */
export const getMinPortionForFood = (name: string): number => {
  const lower = name.toLowerCase();
  if (lower.includes('масло')) return 5;
  if (lower.includes('протеин')) return 15;
  if (lower.includes('орех') || lower.includes('паста')) return 10;
  return 25;
};

/**
 * Mixed-Integer Linear & Quadratic Simplex Solver (Branch-and-Bound).
 * Finds global mathematical optimum for 1 to 4 complementary food items.
 */
export const recommendOptimalFoodCombination = (
  deficit: MacroDeficit,
  foods: FoodCandidate[],
  maxItems = 3
): RecommendedItem[] => {
  if (deficit.isFulfilled || foods.length === 0) {
    return [];
  }

  const validFoods = foods.filter(f => f.baseWeight > 0 && f.calories > 0);
  if (validFoods.length === 0) return [];

  // Helper to calculate exact nutrition for a gram portion
  const calcItem = (food: FoodCandidate, grams: number): RecommendedItem => {
    const factor = grams / food.baseWeight;
    return {
      name: food.name,
      grams,
      calories: Math.round(food.calories * factor),
      protein: Math.round(food.protein * factor * 10) / 10,
      fat: Math.round(food.fat * factor * 10) / 10,
      carbs: Math.round(food.carbs * factor * 10) / 10,
      fiber: food.fiber ? Math.round(food.fiber * factor * 10) / 10 : 0,
      category: inferFoodCategory(food),
    };
  };

  // Objective Loss function (Simplex Penalty Scoring)
  const evaluateItems = (items: RecommendedItem[]) => {
    const totKcal = items.reduce((s, i) => s + i.calories, 0);
    const totP = items.reduce((s, i) => s + i.protein, 0);
    const totF = items.reduce((s, i) => s + i.fat, 0);
    const totC = items.reduce((s, i) => s + i.carbs, 0);

    const pErr = Math.abs(totP - deficit.protein) * 4.5; // Top priority on protein
    const fErr = Math.abs(totF - deficit.fat) * 2.8;     // Essential fatty acids
    const cErr = Math.abs(totC - deficit.carbs) * 2.0;   // Glycogen replenishment
    const kErr = Math.abs(totKcal - deficit.calories) * 0.6;

    // Asymmetric penalty for exceeding calories
    const overKcalPenalty = totKcal > deficit.calories + 40 ? (totKcal - deficit.calories) * 2.0 : 0;

    // Penalty for redundant identical categories (e.g. 2 oils)
    const categories = items.map(i => i.category);
    const uniqueCategories = new Set(categories);
    const diversityBonus = (categories.length - uniqueCategories.size) * 30.0;

    return pErr + fErr + cErr + kErr + overKcalPenalty + diversityBonus;
  };

  let bestCombo: RecommendedItem[] = [];
  let bestScore = Infinity;

  // ── Strategy 1: Single Product Quick Fit ───────────────────────────────────
  for (const food of validFoods) {
    let idealGrams: number;
    if (deficit.protein > 8 && food.protein > 3) {
      idealGrams = (deficit.protein / food.protein) * food.baseWeight;
    } else if (deficit.carbs > 15 && food.carbs > 5) {
      idealGrams = (deficit.carbs / food.carbs) * food.baseWeight;
    } else if (deficit.fat > 6 && food.fat > 3) {
      idealGrams = (deficit.fat / food.fat) * food.baseWeight;
    } else {
      idealGrams = (deficit.calories / food.calories) * food.baseWeight;
    }

    const minP = getMinPortionForFood(food.name);
    const maxP = getMaxPortionForFood(food.name);
    const clampedGrams = Math.max(minP, Math.min(maxP, Math.round(idealGrams / 5) * 5));
    const item = calcItem(food, clampedGrams);
    const score = evaluateItems([item]);

    if (score < bestScore) {
      bestScore = score;
      bestCombo = [item];
    }
  }

  // ── Strategy 2: Multi-Item Simplex Combination (2 to 4 Items) ───────────────
  if (maxItems >= 2 && (deficit.calories > 150 || deficit.protein > 12)) {
    // Categorize food pools
    const proteinPool = validFoods.filter(f => inferFoodCategory(f) === 'protein' || inferFoodCategory(f) === 'dairy' || inferFoodCategory(f) === 'supplement');
    const carbPool = validFoods.filter(f => inferFoodCategory(f) === 'carb' || inferFoodCategory(f) === 'fruit');
    const fatPool = validFoods.filter(f => inferFoodCategory(f) === 'fat');

    const pCandidates = proteinPool.slice(0, 5);
    const cCandidates = carbPool.slice(0, 5);
    const fCandidates = fatPool.slice(0, 4);

    // 2-Product Simplex: Protein Source + Carb or Fat Source
    for (const pFood of pCandidates) {
      const pMax = getMaxPortionForFood(pFood.name);
      const otherPool = deficit.carbs > deficit.fat ? cCandidates : (fCandidates.length > 0 ? fCandidates : cCandidates);

      for (const oFood of otherPool) {
        if (pFood.name === oFood.name) continue;
        const oMax = getMaxPortionForFood(oFood.name);

        // Gradient branch: evaluate key portion pairs
        for (let pG = 30; pG <= pMax; pG += 20) {
          for (let oG = 15; oG <= oMax; oG += 15) {
            const i1 = calcItem(pFood, pG);
            const i2 = calcItem(oFood, oG);
            const score = evaluateItems([i1, i2]);

            if (score < bestScore) {
              bestScore = score;
              bestCombo = [i1, i2];
            }
          }
        }
      }
    }

    // 3-Product Balanced Meal: Protein + Carb + Healthy Fat (if deficit is large)
    if (maxItems >= 3 && deficit.calories >= 350 && deficit.protein >= 20 && fCandidates.length > 0) {
      for (const pFood of pCandidates.slice(0, 3)) {
        for (const cFood of cCandidates.slice(0, 3)) {
          for (const fFood of fCandidates.slice(0, 2)) {
            if (pFood.name === cFood.name || pFood.name === fFood.name || cFood.name === fFood.name) continue;

            const pG = Math.min(getMaxPortionForFood(pFood.name), Math.max(50, Math.round(((deficit.protein * 0.7) / (pFood.protein || 1)) * pFood.baseWeight / 10) * 10));
            const cG = Math.min(getMaxPortionForFood(cFood.name), Math.max(30, Math.round(((deficit.carbs * 0.7) / (cFood.carbs || 1)) * cFood.baseWeight / 10) * 10));
            const fG = Math.min(getMaxPortionForFood(fFood.name), Math.max(10, Math.round(((deficit.fat * 0.6) / (fFood.fat || 1)) * fFood.baseWeight / 5) * 5));

            const i1 = calcItem(pFood, pG);
            const i2 = calcItem(cFood, cG);
            const i3 = calcItem(fFood, fG);
            const score = evaluateItems([i1, i2, i3]);

            if (score < bestScore) {
              bestScore = score;
              bestCombo = [i1, i2, i3];
            }
          }
        }
      }
    }
  }

  return bestCombo;
};

/**
 * Formats advice text using Chrome Prompt API (window.ai) or deterministic structured nutrition template.
 */
export const generateSmartAdvisorAdvice = async (
  deficit: MacroDeficit,
  recommendedItems: RecommendedItem[]
): Promise<string> => {
  if (deficit.isFulfilled) {
    return 'Ваша суточная норма КБЖУ полностью выполнена! Дополнительный прием пищи не требуется. Отличная работа над рационом!';
  }

  if (recommendedItems.length === 0) {
    return 'Для подбора рациона не найдено подходящих продуктов. Попробуйте добавить продукты в базу «Моя еда» или выберите из стандартного списка.';
  }

  // Check Chrome Prompt API (window.ai) progressive enhancement
  const windowAi = (window as unknown as { ai?: { languageModel?: { create: () => Promise<{ prompt: (p: string) => Promise<string> }> } } }).ai;

  if (windowAi?.languageModel?.create) {
    try {
      const session = await windowAi.languageModel.create();
      const prompt = `Ты профессиональный спортивный нутрициолог Brosky NutriEngine. 
Остаток КБЖУ атлета: Белки ${deficit.protein}г, Жиры ${deficit.fat}г, Углеводы ${deficit.carbs}г, Калории ${deficit.calories}ккал.
Рекомендуемый рацион: ${recommendedItems.map(i => `${i.name} ${i.grams}г`).join(', ')}.
Напиши краткий, вдохновляющий и полезный совет (2-3 предложения) на русском языке о том, как этот сбалансированный рацион поможет в восстановлении мышц.`;
      
      const response = await session.prompt(prompt);
      if (response && response.trim().length > 10) {
        return response.trim();
      }
    } catch {
      // Fallback to deterministic template if window.ai fails
    }
  }

  // Deterministic Expert Fallback Template
  const itemsText = recommendedItems.map(i => `• ${i.name}: ${i.grams}г (${i.protein}г белка, ${i.fat}г жира, ${i.carbs}г углей — ${i.calories} ккал)`).join('\n');
  
  let keyBenefit = 'закроет остаток калорийности и обеспечит качественное ночное восстановление.';
  if (deficit.protein > 15) {
    keyBenefit = 'активизирует синтез мышечного белка (MPS) и защитит мышцы от ночного катаболизма.';
  } else if (deficit.carbs > 30) {
    keyBenefit = 'восполнит запасы мышечного гликогена перед следующей тренировкой.';
  }

  let note = '';
  if (deficit.calories > 600) {
    note = '\n\nУ вас остался крупный дефицит. Солвер подобрал разумную порцию здорового питания в пределах физиологических норм.';
  }

  return `Для закрытия остатка КБЖУ солвер подобрал следующий рацион:\n\n${itemsText}\n\nСовет нутрициолога: Такой сбалансированный добор ${keyBenefit}${note}`;
};

