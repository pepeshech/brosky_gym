import type { Exercise, WorkoutTemplate, WorkoutTemplateExercise } from '../types';
import { defaultExercises, MUSCLE_COLORS } from '../store/staticData';

export interface WorkoutGeneratorParams {
  name?: string;
  goal: 'hypertrophy' | 'strength' | 'cut' | 'quick';
  targetMuscles: string[];
  equipment: string[];
  durationMinutes: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface GeneratedWorkoutResult {
  template: WorkoutTemplate;
  adviceText: string;
  estimatedDuration: number;
  totalSets: number;
  targetMusclesText: string;
}

/**
 * Science-based Smart Workout Generator Engine.
 * Generates custom workout templates from exercise database balancing compound & isolation movements.
 */
export const generateSmartWorkoutTemplate = async (
  params: WorkoutGeneratorParams,
  availableExercises: Exercise[] = defaultExercises
): Promise<GeneratedWorkoutResult> => {
  const { goal, targetMuscles, equipment, durationMinutes, experienceLevel } = params;

  const muscles = targetMuscles.length > 0 ? targetMuscles : ['Грудь', 'Трицепс'];
  const allowedEquipment = equipment.length > 0 ? equipment : ['Штанга', 'Гантели', 'Блок', 'Тренажёр', 'Вес тела'];

  const matchingExercises = availableExercises.filter(ex => {
    const matchesEquipment = allowedEquipment.includes(ex.equipment);
    const matchesMuscle = muscles.some(m =>
      ex.muscleGroup === m || (ex.muscleGroups && ex.muscleGroups.includes(m))
    );
    return matchesEquipment && matchesMuscle;
  });

  const pool = matchingExercises.length >= 3 ? matchingExercises : availableExercises;

  let defaultSets = 3;
  let defaultReps: number | string = '8-12';
  let restSec = 90;

  if (goal === 'strength') {
    defaultSets = experienceLevel === 'advanced' ? 5 : 4;
    defaultReps = '4-6';
    restSec = 180;
  } else if (goal === 'cut') {
    defaultSets = 3;
    defaultReps = '12-15';
    restSec = 60;
  } else if (goal === 'quick') {
    defaultSets = 3;
    defaultReps = '10-12';
    restSec = 60;
  } else {
    defaultSets = experienceLevel === 'beginner' ? 3 : 4;
    defaultReps = '8-12';
    restSec = 90;
  }

  const targetExerciseCount = durationMinutes <= 30 ? 3 : durationMinutes <= 45 ? 4 : 6;

  const selected: Exercise[] = [];
  const usedIds = new Set<string>();

  for (const muscle of muscles) {
    if (selected.length >= targetExerciseCount) break;

    const musclePool = pool.filter(ex => !usedIds.has(ex.id) && (ex.muscleGroup === muscle || ex.muscleGroups?.includes(muscle)));
    if (musclePool.length > 0) {
      const compound = musclePool.find(ex => ex.equipment === 'Штанга' || ex.equipment === 'Гантели') || musclePool[0];
      selected.push(compound);
      usedIds.add(compound.id);
    }
  }

  for (const ex of pool) {
    if (selected.length >= targetExerciseCount) break;
    if (!usedIds.has(ex.id)) {
      selected.push(ex);
      usedIds.add(ex.id);
    }
  }

  const templateExercises: WorkoutTemplateExercise[] = selected.map((ex, idx) => ({
    exerciseId: ex.id,
    sets: defaultSets,
    reps: defaultReps,
    restSec,
    order: idx + 1,
  }));

  const primaryColor = MUSCLE_COLORS[muscles[0]] || '#466bf7';
  const goalNames: Record<string, string> = {
    hypertrophy: 'Гипертрофия & Масса',
    strength: 'Силовая Мощь',
    cut: 'Рельеф & Жиросжигание',
    quick: 'Экспресс 30 мин',
  };

  const generatedName = params.name && params.name.trim().length > 0
    ? params.name
    : `Смарт: ${muscles.slice(0, 2).join(' + ')} (${goalNames[goal] || 'Тренировка'})`;

  const template: WorkoutTemplate = {
    id: `ai-template-${Date.now()}`,
    name: generatedName,
    description: `Сгенерировано Смарт для цели «${goalNames[goal]}». Инвентарь: ${allowedEquipment.join(', ')}.`,
    color: primaryColor,
    exercises: templateExercises,
    isCustom: true,
  };

  const totalSets = templateExercises.reduce((sum, e) => sum + e.sets, 0);
  const estimatedDuration = Math.round((totalSets * 1.2) + (totalSets * (restSec / 60)));

  let adviceText = '';
  const windowAi = (window as unknown as { ai?: { languageModel?: { create: () => Promise<{ prompt: (p: string) => Promise<string> }> } } }).ai;

  if (windowAi?.languageModel?.create) {
    try {
      const session = await windowAi.languageModel.create();
      const prompt = `Ты главный тренер Brosky Gym Engine. 
Сгенерирована программа: "${generatedName}".
Цель: ${goalNames[goal]}, Мышцы: ${muscles.join(', ')}, Подходов: ${totalSets}, Пауза: ${restSec}сек.
Напиши краткое профессиональное напутствие (2-3 предложения) на русском языке о том, как правильно прогрессировать в этой тренировке.`;

      const response = await session.prompt(prompt);
      if (response && response.trim().length > 10) {
        adviceText = response.trim();
      }
    } catch {
      // Fallback
    }
  }

  if (!adviceText) {
    if (goal === 'strength') {
      adviceText = `**Совет тренера:** Делайте акцент на максимальную концентрацию в первых подступах. Отдыхайте честные ${restSec} секунд между подходами для восстановления АТФ и нервной системы.`;
    } else if (goal === 'hypertrophy') {
      adviceText = `**Совет тренера:** Работайте в диапазоне ${defaultReps} повторений с паузой 1 секунда в пиковом сокращении. Оставляйте 1-2 повтора в запасе (RPE 8) до последнего подхода.`;
    } else if (goal === 'quick') {
      adviceText = `**Совет тренера:** Держите короткие паузы отдыха (${restSec} сек) для поддержания повышенного пульса и высокой плотности нагрузки.`;
    } else {
      adviceText = `**Совет тренера:** Держите короткие паузы отдыха (${restSec} сек) для поддержания повышенного пульса и высокой плотности нагрузки.`;
    }
  }

  return {
    template,
    adviceText,
    estimatedDuration,
    totalSets,
    targetMusclesText: muscles.join(', '),
  };
};
