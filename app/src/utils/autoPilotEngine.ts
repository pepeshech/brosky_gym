import type { WorkoutSession, AthleteProfile } from '../types';

export interface AutoPilotRecommendation {
  recommendedWeight: number;
  recommendedReps: number;
  targetRir: number;
  confidence: number;
  reason: string;
  adjustmentFactor: number;
  protectionActive: boolean;
}

export function calculateAutoPilotRecommendation(
  exerciseId: string,
  workoutSessions: WorkoutSession[],
  profile: AthleteProfile,
  defaultReps: number = 8
): AutoPilotRecommendation {
  const aggressiveness = profile.autoPilotAggressiveness || 'balanced';
  const plateStep = profile.autoPilotPlateStep || 2.5;

  // Найти все прошлые сессии с заполненными подходами по данному упражнению
  const pastSessionsWithEx = (workoutSessions || [])
    .filter(s => s.logs && s.logs[exerciseId] && s.logs[exerciseId].sets.some(st => st.isCompleted && st.weight > 0 && st.reps > 0))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (pastSessionsWithEx.length === 0) {
    return {
      recommendedWeight: 20, // базовая пустая штанга / разминка
      recommendedReps: defaultReps,
      targetRir: 2,
      confidence: 70,
      reason: 'Первая тренировка упражнения — базовая разведка нагрузки с запасом RIR 2.',
      adjustmentFactor: 1.0,
      protectionActive: false,
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
    };
  }

  // Найти лучший рабочий сет (максимальный вес)
  const bestSet = completedSets.reduce((best, cur) => (cur.weight > best.weight ? cur : best), completedSets[0]);

  const lastWeight = bestSet.weight;
  const lastReps = bestSet.reps;
  const lastRir = bestSet.rir ?? 1;
  const domsScore = lastSession.domsScore || 'none';
  const stimulusScore = lastSession.stimulusScore || 'optimal';

  let targetWeight = lastWeight;
  let targetReps = lastReps > 0 ? lastReps : defaultReps;
  let targetRir = 2;
  let reason: string;
  let protectionActive = false;
  let adjustmentFactor = 1.0;

  // 1. Проверка травмобезопасности фасций (Фактор DOMS)
  if (domsScore === 'severe') {
    protectionActive = true;
    adjustmentFactor = 0.85; // Снижение нагрузки на 15% для защиты фасций
    targetWeight = Math.max(0, lastWeight * adjustmentFactor);
    targetRir = 3;
    reason = 'Зафиксирована сильная боль (DOMS) с прошлой сессии. Движок разгружает вес на -15% для восстановления связок.';
  } else if (domsScore === 'mild') {
    adjustmentFactor = 0.97;
    targetWeight = lastWeight;
    targetReps = Math.max(1, targetReps);
    targetRir = 2;
    reason = 'Умеренная свежесть мышц. Движок сохраняет прошлый рабочий вес для консолидации формы.';
  } else {
    // domsScore === 'none' (Оптимальное восстановление)
    if (lastRir >= 2) {
      if (aggressiveness === 'hardcore') {
        targetWeight = lastWeight + plateStep * 1.5;
        targetReps = defaultReps;
        targetRir = 1;
        reason = `Запас RIR ${lastRir} и полное восстановление — Автопилот накидывает +${plateStep * 1.5} кг!`;
      } else if (aggressiveness === 'conservative') {
        targetWeight = lastWeight + plateStep * 0.5;
        targetReps = defaultReps;
        targetRir = 2;
        reason = `Отличное восстановление — плавный плановый прирост веса +${plateStep * 0.5} кг с RIR 2.`;
      } else {
        targetWeight = lastWeight + plateStep;
        targetReps = defaultReps;
        targetRir = 2;
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
      // RIR === 0 (Работа до полного отказа)
      targetWeight = lastWeight;
      targetReps = Math.max(1, lastReps);
      targetRir = 2;
      reason = 'Прошлый сет был в отказ (RIR 0). ИИ фиксирует рабочий вес и закладывает контролируемый сет RIR 2.';
    }
  }

  // Округление веса под настроенный шаг блинов пользователя
  const step = plateStep > 0 ? plateStep : 2.5;
  targetWeight = Math.round(targetWeight / step) * step;

  return {
    recommendedWeight: Math.max(0, Math.round(targetWeight * 10) / 10),
    recommendedReps: Math.max(1, targetReps),
    targetRir,
    confidence: pastSessionsWithEx.length >= 3 ? 95 : 85,
    reason,
    adjustmentFactor,
    protectionActive,
  };
}
