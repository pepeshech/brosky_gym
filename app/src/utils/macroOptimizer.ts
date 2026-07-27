export interface MacroTarget {
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbsGrams: number;
}

export interface MacroCurrent {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface MacroDeficit {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  isFulfilled: boolean;
}

export interface FoodCandidate {
  name: string;
  calories: number; // kcal per baseWeight (usually 100g)
  protein: number;  // g per baseWeight
  fat: number;      // g per baseWeight
  carbs: number;    // g per baseWeight
  baseWeight: number;
}

export interface RecommendedItem {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface OptimizationResult {
  deficit: MacroDeficit;
  items: RecommendedItem[];
  totalProvided: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  score: number;
  adviceText: string;
}

/**
 * Calculates current remaining macro deficit
 */
export const calculateMacroDeficit = (
  target: MacroTarget,
  current: MacroCurrent
): MacroDeficit => {
  const calories = Math.max(0, Math.round(target.calories - current.calories));
  const protein = Math.max(0, Math.round((target.proteinGrams - current.protein) * 10) / 10);
  const fat = Math.max(0, Math.round((target.fatGrams - current.fat) * 10) / 10);
  const carbs = Math.max(0, Math.round((target.carbsGrams - current.carbs) * 10) / 10);

  // Consider target fulfilled if deficit is insignificant (<3g protein, <3g fat, <5g carbs, <40 kcal)
  const isFulfilled = protein < 3 && fat < 3 && carbs < 5 && calories < 40;

  return {
    calories,
    protein,
    fat,
    carbs,
    isFulfilled,
  };
};

/**
 * Determines realistic maximum portion size (in grams) for different food types.
 * Prevents unrealistic recommendations like drinking 200g of olive oil or eating 250g of protein powder.
 */
export const getMaxPortionForFood = (name: string): number => {
  const lower = name.toLowerCase();
  if (lower.includes('масло')) return 20; // Max 20g for oils (1-2 tablespoons)
  if (lower.includes('протеин')) return 40; // Max 40g for protein powder (approx 1 scoop)
  if (lower.includes('орех') || lower.includes('паста') || lower.includes('миндаль') || lower.includes('кешью')) return 40; // Max 40g for nuts/spreads
  if (lower.includes('сыр')) return 60; // Max 60g for cheese
  if (lower.includes('хлебцы') || lower.includes('хлебец')) return 40;
  return 250; // Default max portion for whole foods (cottage cheese, meat, fish, carbs)
};

/**
 * Combinatorial Greedy Portion Solver.
 * Finds optimal food portions (rounded to 5g steps) to fulfill remaining deficit with minimal error.
 */
export const recommendOptimalFoodCombination = (
  deficit: MacroDeficit,
  foods: FoodCandidate[],
  maxItems = 3
): RecommendedItem[] => {
  if (deficit.isFulfilled || foods.length === 0) {
    return [];
  }

  // Filter out invalid foods
  const validFoods = foods.filter(f => f.baseWeight > 0 && f.calories > 0);
  if (validFoods.length === 0) return [];

  // Helper to calculate macros for a given gram portion
  const calcPortion = (food: FoodCandidate, grams: number): RecommendedItem => {
    const factor = grams / food.baseWeight;
    return {
      name: food.name,
      grams,
      calories: Math.round(food.calories * factor),
      protein: Math.round(food.protein * factor * 10) / 10,
      fat: Math.round(food.fat * factor * 10) / 10,
      carbs: Math.round(food.carbs * factor * 10) / 10,
    };
  };

  // Score function: lower is better
  const evaluateCombo = (items: RecommendedItem[]) => {
    const totKcal = items.reduce((s, i) => s + i.calories, 0);
    const totP = items.reduce((s, i) => s + i.protein, 0);
    const totF = items.reduce((s, i) => s + i.fat, 0);
    const totC = items.reduce((s, i) => s + i.carbs, 0);

    const pErr = Math.abs(totP - deficit.protein) * 4.0; // High priority on protein
    const fErr = Math.abs(totF - deficit.fat) * 2.5;
    const cErr = Math.abs(totC - deficit.carbs) * 2.0;
    const kErr = Math.abs(totKcal - deficit.calories) * 0.5;

    // Penalty for exceeding calories too much
    const overKcalPenalty = totKcal > deficit.calories + 50 ? (totKcal - deficit.calories) * 1.5 : 0;

    return pErr + fErr + cErr + kErr + overKcalPenalty;
  };

  let bestCombo: RecommendedItem[] = [];
  let bestScore = Infinity;

  // Strategy 1: Single product fit
  for (const food of validFoods) {
    let idealGrams: number;
    if (deficit.protein > 5 && food.protein > 2) {
      idealGrams = (deficit.protein / food.protein) * food.baseWeight;
    } else if (deficit.carbs > 10 && food.carbs > 5) {
      idealGrams = (deficit.carbs / food.carbs) * food.baseWeight;
    } else if (deficit.fat > 5 && food.fat > 3) {
      idealGrams = (deficit.fat / food.fat) * food.baseWeight;
    } else {
      idealGrams = (deficit.calories / food.calories) * food.baseWeight;
    }

    const maxPortion = getMaxPortionForFood(food.name);
    const clampedGrams = Math.max(10, Math.min(maxPortion, Math.round(idealGrams / 5) * 5));
    const item = calcPortion(food, clampedGrams);
    const score = evaluateCombo([item]);

    if (score < bestScore) {
      bestScore = score;
      bestCombo = [item];
    }
  }

  // Strategy 2: 2-Product Combination (e.g. Protein Source + Carb or Fat Source)
  if (maxItems >= 2) {
    const proteinFoods = validFoods.filter(f => (f.protein / f.calories) * 100 > 8 && !f.name.toLowerCase().includes('масло'));
    const otherFoods = validFoods.filter(f => f.carbs > 5 || f.fat > 5);

    for (const pFood of proteinFoods) {
      const pMax = getMaxPortionForFood(pFood.name);
      for (const oFood of otherFoods) {
        if (pFood.name === oFood.name) continue;
        const oMax = getMaxPortionForFood(oFood.name);

        for (let pGrams = 20; pGrams <= pMax; pGrams += 10) {
          for (let oGrams = 10; oGrams <= oMax; oGrams += 10) {
            const item1 = calcPortion(pFood, pGrams);
            const item2 = calcPortion(oFood, oGrams);
            const combo = [item1, item2];
            const score = evaluateCombo(combo);

            if (score < bestScore) {
              bestScore = score;
              bestCombo = combo;
            }
          }
        }
      }
    }
  }

  return bestCombo;
};

/**
 * Formats advice text. If Chrome Prompt API (window.ai) is available, uses it asynchronously,
 * otherwise falls back to deterministic structured advice.
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
Напиши краткий, вдохновляющий и полезный совет (2-3 предложения) на русском языке о том, как этот вечерний перекус поможет в восстановлении мышц.`;
      
      const response = await session.prompt(prompt);
      if (response && response.trim().length > 10) {
        return response.trim();
      }
    } catch {
      // Fallback to template if window.ai fails
    }
  }

  // Deterministic Expert Fallback Template
  const itemsText = recommendedItems.map(i => `• ${i.name}: ${i.grams}г (${i.protein}г белка, ${i.fat}г жира, ${i.carbs}г углей — ${i.calories} ккал)`).join('\n');
  
  let keyBenefit = 'закроет остаток калорийности и обеспечит качественное восстановление.';
  if (deficit.protein > 15) {
    keyBenefit = 'обеспечит синтез белка в ночное время и предотвратит катаболизм мышц.';
  } else if (deficit.carbs > 30) {
    keyBenefit = 'пополнит гликоген в мышцах перед завтрашней тренировкой без отложения в жировую ткань.';
  }

  let note = '';
  if (deficit.calories > 600) {
    note = '\n\nУ вас остался крупный дефицит. Мы подобрали разумную порцию здорового перекуса в пределах адекватных норм питания.';
  }

  return `Для идеального закрытия остатка КБЖУ рекомендуем следующий перекус:\n\n${itemsText}\n\nСовет нутрициолога: Такой порционный добор ${keyBenefit}${note}`;
};
