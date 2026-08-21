import type { WorkoutSession, AthleteProfile } from '../types';

export interface AutoPilotRecommendation {
  recommendedWeight: number;
  recommendedReps: number;
  targetRir: number;
  confidence: number;
  reason: string;
  adjustmentFactor: number;
  protectionActive: boolean;
  progressionMode?: 'double_progression' | 'apre' | 'linear_mesocycle';
  mesocyclePhase?: string;
}

export interface AutoPilotOptions {
  repRange?: [number, number]; // e.g. [8, 12]
  mesocycleWeek?: number;      // 1..5
}

export type MesocyclePhase = 'accumulation' | 'intensification_1' | 'intensification_2' | 'overreaching' | 'deload';

export interface MesocyclePhaseConfig {
  phase: MesocyclePhase;
  weekNumber: number;
  phaseName: string;
  targetRir: number;
  volumeMultiplier: number;
  intensityMultiplier: number;
  description: string;
}

export interface DoubleProgressionState {
  minReps: number;
  maxReps: number;
  targetReps: number;
  targetWeight: number;
  isReadyForWeightIncrease: boolean;
  reason: string;
}

/**
 * Returns configuration for 5-week scientific mesocycle (Renaissance Periodization model).
 */
export const getMesocyclePhaseConfig = (weekNumber: number = 1): MesocyclePhaseConfig => {
  const normalizedWeek = ((Math.max(1, weekNumber) - 1) % 5) + 1;

  switch (normalizedWeek) {
    case 1:
      return {
        phase: 'accumulation',
        weekNumber: 1,
        phaseName: 'Аккумуляция (MEV)',
        targetRir: 3,
        volumeMultiplier: 0.85,
        intensityMultiplier: 0.92,
        description: 'Вкатывание в мезоцикл. Минимальный эффективный объем с запасом RIR 3–4.',
      };
    case 2:
      return {
        phase: 'intensification_1',
        weekNumber: 2,
        phaseName: 'Интенсификация 1 (MAV)',
        targetRir: 2,
        volumeMultiplier: 1.0,
        intensityMultiplier: 0.96,
        description: 'Оптимальный адаптивный объем. Стабильный прогресс с запасом RIR 2.',
      };
    case 3:
      return {
        phase: 'intensification_2',
        weekNumber: 3,
        phaseName: 'Интенсификация 2 (MAV max)',
        targetRir: 1,
        volumeMultiplier: 1.15,
        intensityMultiplier: 1.0,
        description: 'Пиковая рабочая нагрузка. Приближение к пределу с запасом RIR 1.',
      };
    case 4:
      return {
        phase: 'overreaching',
        weekNumber: 4,
        phaseName: 'Оверричинг (MRV / Peak)',
        targetRir: 0,
        volumeMultiplier: 1.3,
        intensityMultiplier: 1.03,
        description: 'Функциональный оверричинг. Работа в отказ (RIR 0) для стимуляции глубокой суперкомпенсации.',
      };
    case 5:
    default:
      return {
        phase: 'deload',
        weekNumber: 5,
        phaseName: 'Разгрузка (Deload)',
        targetRir: 4,
        volumeMultiplier: 0.5,
        intensityMultiplier: 0.9,
        description: 'Восстановительный делоад. Снижение объема на 50% для сброса накопленной усталости ЦНС и связок.',
      };
  }
};

/**
 * Autoregulatory Progressive Resistance Exercise (APRE protocol by Mann et al.).
 * Dynamic load adjustment based on AMRAP / failure sets (RIR = 0).
 */
export const calculateAPREAdjustment = (
  actualReps: number,
  targetReps: number,
  currentWeight: number,
  plateStep: number = 2.5
): { newWeight: number; deltaWeight: number; reason: string } => {
  const diff = actualReps - targetReps;

  if (diff >= 3) {
    const delta = plateStep * 2;
    return {
      newWeight: currentWeight + delta,
      deltaWeight: delta,
      reason: `Превышение плана на +${diff} повт.! APRE накидывает двойной шаг веса +${delta} кг.`,
    };
  }
  if (diff >= 1) {
    const delta = plateStep;
    return {
      newWeight: currentWeight + delta,
      deltaWeight: delta,
      reason: `План перевыполнен на +${diff} повт. APRE добавляет +${delta} кг к рабочему весу.`,
    };
  }
  if (diff === 0) {
    return {
      newWeight: currentWeight,
      deltaWeight: 0,
      reason: 'Точное попадание в целевой диапазон. Вес зафиксирован для консолидации техники.',
    };
  }
  // diff < 0 (failed target)
  const delta = -plateStep;
  return {
    newWeight: Math.max(0, currentWeight + delta),
    deltaWeight: delta,
    reason: `Недобор ${Math.abs(diff)} повт. APRE производит микро-разгрузку на ${delta} кг.`,
  };
};

/**
 * Double Progression Algorithm.
 * Fixes working weight until all working sets hit the upper rep ceiling (e.g. 12 reps) with RIR >= 1.
 */
export const calculateDoubleProgression = (
  pastSets: Array<{ reps: number; weight: number; rir?: number }>,
  minReps: number = 8,
  maxReps: number = 12,
  currentWeight: number,
  plateStep: number = 2.5
): DoubleProgressionState => {
  if (!pastSets || pastSets.length === 0) {
    return {
      minReps,
      maxReps,
      targetReps: minReps,
      targetWeight: currentWeight,
      isReadyForWeightIncrease: false,
      reason: `Старт двойной прогрессии: закрепление диапазона ${minReps}–${maxReps} повт.`,
    };
  }

  const allCompletedMax = pastSets.every(s => s.reps >= maxReps);
  const minRepsAchieved = Math.min(...pastSets.map(s => s.reps));

  if (allCompletedMax) {
    return {
      minReps,
      maxReps,
      targetReps: minReps,
      targetWeight: currentWeight + plateStep,
      isReadyForWeightIncrease: true,
      reason: `Все сеты закрыты на максимуме (${maxReps} повт.)! Автопилот повышает вес на +${plateStep} кг и сбрасывает повторы на ${minReps}.`,
    };
  }

  // Work on filling the rep ceiling
  const nextTargetReps = Math.min(maxReps, minRepsAchieved + 1);
  return {
    minReps,
    maxReps,
    targetReps: nextTargetReps,
    targetWeight: currentWeight,
    isReadyForWeightIncrease: false,
    reason: `Фиксация веса ${currentWeight} кг. Цель: довести все сеты до ${maxReps} повт. (текущий минимум: ${minRepsAchieved}).`,
  };
};

/**
 * Main AutoPilot Recommendation Engine (Multi-Session Window N=3 + Autoregulation + Mesocycle).
 */
export function calculateAutoPilotRecommendation(
  exerciseId: string,
  workoutSessions: WorkoutSession[],
  profile: AthleteProfile,
  defaultReps: number = 8,
  options?: AutoPilotOptions
): AutoPilotRecommendation {
  const aggressiveness = profile.autoPilotAggressiveness || 'balanced';
  const plateStep = profile.autoPilotPlateStep || 2.5;

  // Filter all past sessions with completed valid sets for this exercise
  const pastSessionsWithEx = (workoutSessions || [])
    .filter(s => s.logs && s.logs[exerciseId] && s.logs[exerciseId].sets.some(st => st.isCompleted && st.weight > 0 && st.reps > 0))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (pastSessionsWithEx.length === 0) {
    return {
      recommendedWeight: 20, // baseline bar
      recommendedReps: defaultReps,
      targetRir: 2,
      confidence: 70,
      reason: 'Первая тренировка упражнения — базовая разведка нагрузки с запасом RIR 2.',
      adjustmentFactor: 1.0,
      protectionActive: false,
      progressionMode: 'double_progression',
    };
  }

  const lastSession = pastSessionsWithEx[0];
  const exLog = lastSession.logs[exerciseId];
  const completedSets = exLog.sets.filter(s => s.isCompleted && s.weight > 0 && s.reps > 0);

  if (completedSets.length === 0) {
    return {
      recommendedWeight: 20,
      recommendedReps: defaultReps,
      targetRir: 2,
      confidence: 70,
      reason: 'Разведка рабочей нагрузки.',
      adjustmentFactor: 1.0,
      protectionActive: false,
      progressionMode: 'double_progression',
    };
  }

  // Find best working set in the last session
  const bestSet = completedSets.reduce((best, cur) => (cur.weight > best.weight ? cur : best), completedSets[0]);

  const lastWeight = bestSet.weight;
  const lastReps = bestSet.reps;
  const lastRir = bestSet.rir ?? 1;
  const domsScore = lastSession.domsScore || 'none';
  const stimulusScore = lastSession.stimulusScore || 'optimal';

  // Apply mesocycle phase modulation if provided
  const mesocycleConfig = options?.mesocycleWeek ? getMesocyclePhaseConfig(options.mesocycleWeek) : null;
  const baseTargetRir = mesocycleConfig ? mesocycleConfig.targetRir : 2;

  let targetWeight = lastWeight;
  let targetReps = lastReps > 0 ? lastReps : defaultReps;
  let targetRir = baseTargetRir;
  let reason: string;
  let protectionActive = false;
  let adjustmentFactor = 1.0;
  let progressionMode: AutoPilotRecommendation['progressionMode'] = 'double_progression';

  // 1. Fascial and Tendon Protection Factor (Severe DOMS)
  if (domsScore === 'severe') {
    protectionActive = true;
    adjustmentFactor = 0.85; // 15% deload for tendon recovery
    targetWeight = Math.max(0, lastWeight * adjustmentFactor);
    targetRir = 3;
    reason = 'Зафиксирована сильная боль (DOMS) с прошлой сессии. Движок разгружает вес на -15% для восстановления связок.';
  } else if (domsScore === 'mild') {
    adjustmentFactor = 0.97;
    targetWeight = lastWeight;
    targetReps = Math.max(1, targetReps);
    targetRir = Math.max(2, baseTargetRir);
    reason = 'Умеренная свежесть мышц. Движок сохраняет прошлый рабочий вес для консолидации формы.';
  } else {
    // domsScore === 'none' (Optimal recovery)
    if (lastRir >= 2) {
      if (aggressiveness === 'hardcore') {
        targetWeight = lastWeight + plateStep * 1.5;
        targetReps = defaultReps;
        targetRir = Math.max(1, baseTargetRir - 1);
        reason = `Запас RIR ${lastRir} и полное восстановление — Автопилот накидывает +${plateStep * 1.5} кг!`;
      } else if (aggressiveness === 'conservative') {
        targetWeight = lastWeight + plateStep * 0.5;
        targetReps = defaultReps;
        targetRir = Math.max(2, baseTargetRir);
        reason = `Отличное восстановление — плавный плановый прирост веса +${plateStep * 0.5} кг с RIR 2.`;
      } else {
        targetWeight = lastWeight + plateStep;
        targetReps = defaultReps;
        targetRir = baseTargetRir;
        reason = `Запас RIR ${lastRir} при отсутствии боли — плановый рост веса +${plateStep} кг.`;
      }
    } else if (lastRir === 1) {
      if (stimulusScore === 'low') {
        targetReps = lastReps + 1;
        reason = 'Прошлый отклик был близким к пределу — Движок добавляет +1 повторение к сетам при сохранении веса.';
      } else {
        targetWeight = lastWeight;
        targetReps = lastReps;
        targetRir = 1;
        reason = 'Оптимальный отклик с RIR 1 — удержание рабочего веса и закрепление повторов.';
      }
    } else {
      // RIR === 0 (Failure / AMRAP set -> APRE Evaluation)
      progressionMode = 'apre';
      const apre = calculateAPREAdjustment(lastReps, defaultReps, lastWeight, plateStep);
      targetWeight = apre.newWeight;
      targetReps = defaultReps;
      targetRir = baseTargetRir;
      reason = apre.reason;
    }
  }

  // Round weight to configured plate step
  const step = plateStep > 0 ? plateStep : 2.5;
  targetWeight = Math.round(targetWeight / step) * step;

  // Window confidence based on history length (N=1 vs N>=3)
  const windowConfidence = pastSessionsWithEx.length >= 3 ? 95 : (pastSessionsWithEx.length >= 2 ? 88 : 80);

  return {
    recommendedWeight: Math.max(0, Math.round(targetWeight * 10) / 10),
    recommendedReps: Math.max(1, targetReps),
    targetRir,
    confidence: windowConfidence,
    reason,
    adjustmentFactor,
    protectionActive,
    progressionMode,
    mesocyclePhase: mesocycleConfig?.phaseName,
  };
}

