import type { WorkoutSession, Exercise } from '../types';
import { defaultExercises } from '../store/staticData';

export type MuscleGroupKey =
  | 'Грудь'
  | 'Широчайшие'
  | 'Трапеции'
  | 'Поясница'
  | 'Плечи'
  | 'Бицепс'
  | 'Трицепс'
  | 'Предплечья'
  | 'Квадрицепс'
  | 'Бицепс бедра'
  | 'Ягодицы'
  | 'Икры'
  | 'Пресс'
  | 'Шея'
  | 'Приводящие'
  | 'Абдукторы'
  | 'Зубчатые';

export interface MuscleRecoveryThreshold {
  mev: number;   // Minimum Effective Volume (sets/week)
  mavMin: number;// Minimum Adaptive Volume
  mavMax: number;// Maximum Adaptive Volume
  mrv: number;   // Maximum Recoverable Volume
  halfLifeHours: number; // T1/2 half life of DOMS / local fatigue decay
}

export const MUSCLE_RECOVERY_CONFIG: Record<string, MuscleRecoveryThreshold> = {
  'Грудь': { mev: 8, mavMin: 10, mavMax: 18, mrv: 22, halfLifeHours: 32 },
  'Широчайшие': { mev: 10, mavMin: 12, mavMax: 20, mrv: 24, halfLifeHours: 36 },
  'Поясница': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18, halfLifeHours: 36 },
  'Трапеции': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18, halfLifeHours: 24 },
  'Плечи': { mev: 8, mavMin: 10, mavMax: 18, mrv: 22, halfLifeHours: 28 },
  'Бицепс': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18, halfLifeHours: 22 },
  'Трицепс': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18, halfLifeHours: 24 },
  'Предплечья': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18, halfLifeHours: 20 },
  'Квадрицепс': { mev: 8, mavMin: 10, mavMax: 16, mrv: 20, halfLifeHours: 36 },
  'Бицепс бедра': { mev: 8, mavMin: 10, mavMax: 16, mrv: 20, halfLifeHours: 32 },
  'Ягодицы': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18, halfLifeHours: 32 },
  'Икры': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18, halfLifeHours: 24 },
  'Пресс': { mev: 4, mavMin: 6, mavMax: 12, mrv: 16, halfLifeHours: 20 },
  'Шея': { mev: 4, mavMin: 6, mavMax: 12, mrv: 16, halfLifeHours: 20 },
  'Приводящие': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18, halfLifeHours: 28 },
  'Абдукторы': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18, halfLifeHours: 24 },
  'Зубчатые': { mev: 4, mavMin: 6, mavMax: 12, mrv: 16, halfLifeHours: 20 },
};

export interface MuscleRecoveryState {
  muscleGroup: string;
  recoveryPercent: number; // 0..100%
  fatigueScore: number;    // Weighted active fatigue points
  totalSets7Days: number;
  totalVolume7Days: number;// Total tonnage (kg)
  effectiveReps7Days: number; // Hypertrophic mechanical tension stimulus (Chris Beardsley)
  inol7Days: number;       // Accumulated INOL intensity score
  lastTrainedDate: string | null;
  lastTrainedHoursAgo: number | null;
  hoursUntilFullRecovery: number;
  statusCategory: 'exhausted' | 'recovering' | 'optimal' | 'rested';
  colorHex: string;
}

export interface BanisterImpulseState {
  fitness: number;      // Chronic Training Load (CTL, ~35-42 days)
  fatigue: number;      // Acute Training Load (ATL, ~7 days)
  readiness: number;    // Training Stress Balance / Readiness (TSB = Fitness - k * Fatigue)
  supercompensationPeakHours: number;
  status: 'fresh' | 'optimal' | 'fatigued' | 'overreaching';
}

export interface INOLAnalysis {
  inol: number;
  status: 'light' | 'optimal' | 'heavy' | 'overreaching';
  recommendation: string;
}

/**
 * Calculates effective reps (hypertrophic mechanical tension stimulus).
 * By Chris Beardsley / Schoenfeld: high-threshold motor units are recruited primarily in the last ~5 reps before failure.
 */
export const calculateEffectiveReps = (reps: number, rir: number = 2): number => {
  if (reps <= 0) return 0;
  const clampedRir = Math.max(0, rir);
  const effectiveInSet = Math.max(0, 5 - clampedRir);
  return Math.min(reps, effectiveInSet);
};

/**
 * Calculates Intensity Number of Lifts (INOL) by Boris Sheiko / Hany Rambod.
 * INOL = Reps / (100 - %1RM)
 */
export const calculateSetINOL = (reps: number, percent1RM: number): number => {
  if (reps <= 0 || percent1RM <= 0) return 0;
  const intensity = Math.min(99, Math.max(30, percent1RM));
  return Number((reps / (100 - intensity)).toFixed(3));
};

/**
 * Evaluates session or exercise INOL load.
 */
export const evaluateINOL = (totalINOL: number): INOLAnalysis => {
  const inol = Number(totalINOL.toFixed(2));
  if (inol < 1.0) {
    return { inol, status: 'light', recommendation: 'Легкая тренировка / Разгрузка. Быстрое восстановление.' };
  }
  if (inol <= 2.0) {
    return { inol, status: 'optimal', recommendation: 'Оптимальный развивающий объем. Идеальный баланс стимула и адаптации.' };
  }
  if (inol <= 3.0) {
    return { inol, status: 'heavy', recommendation: 'Тяжелая сессия. Требуется не менее 48–72 часов восстановления.' };
  }
  return { inol, status: 'overreaching', recommendation: 'Предельная перегрузка! Высокий риск накопления системного утомления ЦНС.' };
};

/**
 * Maps recovery percentage (0..100) to procedural hex color for 3D shader and badges.
 */
export function getRecoveryColorHex(percent: number): string {
  if (percent <= 35) return '#e11d48'; // Crimson / Exhausted (DOMS)
  if (percent <= 65) return '#f59e0b'; // Amber / Recovering
  if (percent <= 85) return '#10b981'; // Emerald / Supercompensation optimal
  return '#64748b';                    // Slate / Fully Rested
}

/**
 * Two-Factor Banister Impulse-Response Fitness-Fatigue Model.
 * Performance(t) = Fitness(t) - k * Fatigue(t)
 */
export function calculateBanisterModel(
  sessions: WorkoutSession[],
  currentDate: Date = new Date(),
  tauFitnessDays: number = 35,
  tauFatigueDays: number = 7,
  kFatigue: number = 2.2
): BanisterImpulseState {
  const nowMs = currentDate.getTime();
  const FORTY_TWO_DAYS_MS = 42 * 24 * 60 * 60 * 1000;

  const validSessions = (sessions || []).filter(session => {
    const sessionTime = new Date(session.date).getTime();
    return nowMs - sessionTime <= FORTY_TWO_DAYS_MS && sessionTime <= nowMs;
  });

  if (validSessions.length === 0) {
    return {
      fitness: 0,
      fatigue: 0,
      readiness: 100,
      supercompensationPeakHours: 0,
      status: 'fresh',
    };
  }

  let totalFitness = 0;
  let totalFatigue = 0;

  validSessions.forEach(session => {
    const sessionTime = new Date(session.date).getTime();
    const daysAgo = Math.max(0, (nowMs - sessionTime) / (1000 * 60 * 60 * 24));

    // Calculate session training impulse (TRIMP ~ Tonnage * RPE Factor / 100)
    let sessionImpulse = 0;
    if (session.logs) {
      Object.values(session.logs).forEach(log => {
        if (!log.isCompleted || !log.sets) return;
        log.sets.forEach(set => {
          if (!set.isCompleted || set.reps <= 0) return;
          const weight = set.weight || 0;
          const rir = set.rir ?? (set.rpe ? 10 - set.rpe : 2);
          const intensityMultiplier = 1.0 + 0.15 * Math.max(0, 5 - rir);
          sessionImpulse += (weight * set.reps * intensityMultiplier) / 150;
        });
      });
    }

    const lambdaFitness = 1 / tauFitnessDays;
    const lambdaFatigue = 1 / tauFatigueDays;

    totalFitness += sessionImpulse * Math.exp(-lambdaFitness * daysAgo);
    totalFatigue += sessionImpulse * Math.exp(-lambdaFatigue * daysAgo);
  });

  const fitness = Math.round(totalFitness * 10) / 10;
  const fatigue = Math.round(totalFatigue * 10) / 10;
  
  // TSB (Training Stress Balance) mapped to 0..100 Readiness scale
  const rawBalance = fitness - kFatigue * fatigue;
  const readiness = Math.round(Math.max(10, Math.min(100, 70 + rawBalance * 0.5)));

  let supercompHours = 0;
  if (fatigue > 5) {
    // Peak readiness occurs when derivative d(Performance)/dt = 0
    const tOptimalDays = Math.log((kFatigue * (1 / tauFatigueDays)) / (1 / tauFitnessDays)) / ((1 / tauFatigueDays) - (1 / tauFitnessDays));
    supercompHours = Math.max(0, Math.round(tOptimalDays * 24));
  }

  let status: BanisterImpulseState['status'] = 'optimal';
  if (readiness >= 85) status = 'fresh';
  else if (readiness <= 35) status = 'overreaching';
  else if (readiness <= 60) status = 'fatigued';

  return {
    fitness,
    fatigue,
    readiness,
    supercompensationPeakHours: supercompHours,
    status,
  };
}

/**
 * Calculates 7-day muscle fatigue decay, INOL, Effective Reps, and recovery status across all muscle groups.
 */
export function calculateMuscleRecoveryMap(
  sessions: WorkoutSession[],
  allExercises: Exercise[] = defaultExercises,
  currentDate: Date = new Date()
): Record<string, MuscleRecoveryState> {
  const nowMs = currentDate.getTime();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  // Build exercise lookup map by ID
  const exerciseMap = new Map<string, Exercise>();
  allExercises.forEach(ex => exerciseMap.set(ex.id, ex));

  // Initialize tracking containers
  const result: Record<string, MuscleRecoveryState> = {};
  const fatigueMap: Record<string, number> = {};
  const sets7DaysMap: Record<string, number> = {};
  const volume7DaysMap: Record<string, number> = {};
  const effectiveRepsMap: Record<string, number> = {};
  const inolMap: Record<string, number> = {};
  const lastTrainedMsMap: Record<string, number> = {};

  Object.keys(MUSCLE_RECOVERY_CONFIG).forEach(muscle => {
    fatigueMap[muscle] = 0;
    sets7DaysMap[muscle] = 0;
    volume7DaysMap[muscle] = 0;
    effectiveRepsMap[muscle] = 0;
    inolMap[muscle] = 0;
    lastTrainedMsMap[muscle] = 0;
  });

  // Filter sessions within last 7 days
  const recentSessions = sessions.filter(session => {
    const sessionTime = new Date(session.date).getTime();
    return nowMs - sessionTime <= SEVEN_DAYS_MS && sessionTime <= nowMs;
  });

  recentSessions.forEach(session => {
    const sessionTime = new Date(session.date).getTime();
    const hoursAgo = Math.max(0, (nowMs - sessionTime) / (1000 * 60 * 60));

    if (!session.logs) return;

    Object.values(session.logs).forEach(log => {
      if (!log.isCompleted || !log.sets || log.sets.length === 0) return;

      const exercise = exerciseMap.get(log.exerciseId);
      if (!exercise) return;

      // Extract muscle groups involved
      const primaryMuscle = exercise.muscleGroup;
      const secondaryMuscles = exercise.muscleGroups || [];
      const affectedMuscles = Array.from(new Set([primaryMuscle, ...secondaryMuscles]));

      log.sets.forEach(set => {
        if (!set.isCompleted || set.reps <= 0) return;

        const weight = set.weight || 0;
        const rir = set.rir ?? (set.rpe !== undefined ? Math.max(0, 10 - set.rpe) : 2);
        
        // Power-law fatigue stimulus near failure: S = 1.0 + 0.35 * (10 - RIR)^1.6
        const rpe = set.rpe || (10 - rir);
        const rpeFactor = Math.min(1.4, Math.max(0.5, 0.4 + 0.6 * Math.pow(rpe / 10, 1.6)));
        const tonnage = weight * set.reps;
        const effReps = calculateEffectiveReps(set.reps, rir);

        // Approximate %1RM from Epley: %1RM = 100 / (1 + Reps/30)
        const approxPercent1RM = 100 / (1 + (set.reps + rir) / 30);
        const setINOL = calculateSetINOL(set.reps, approxPercent1RM);

        affectedMuscles.forEach(muscle => {
          if (!(muscle in MUSCLE_RECOVERY_CONFIG)) return;

          const isPrimary = muscle === primaryMuscle;
          // Biomechanical synergist matrix: Primary takes 1.0, Secondary takes 0.5
          const muscleLoadFactor = isPrimary ? 1.0 : 0.5;

          const threshold = MUSCLE_RECOVERY_CONFIG[muscle];
          const lambda = Math.LN2 / threshold.halfLifeHours;
          const setFatigue = muscleLoadFactor * rpeFactor * Math.exp(-lambda * hoursAgo);

          fatigueMap[muscle] += setFatigue;
          sets7DaysMap[muscle] += muscleLoadFactor;
          volume7DaysMap[muscle] += tonnage * muscleLoadFactor;
          effectiveRepsMap[muscle] += effReps * muscleLoadFactor;
          inolMap[muscle] += setINOL * muscleLoadFactor;

          if (sessionTime > lastTrainedMsMap[muscle]) {
            lastTrainedMsMap[muscle] = sessionTime;
          }
        });
      });
    });
  });

  // Finalize recovery states
  Object.keys(MUSCLE_RECOVERY_CONFIG).forEach(muscle => {
    const threshold = MUSCLE_RECOVERY_CONFIG[muscle];
    const rawFatigue = fatigueMap[muscle];
    
    // Scale fatigue relative to MRV (Maximum Recoverable Volume)
    const fatigueRatio = Math.min(1.0, rawFatigue / (threshold.mrv * 0.8));
    const recoveryPercent = Math.round(Math.max(0, Math.min(100, (1 - fatigueRatio) * 100)));

    const lastMs = lastTrainedMsMap[muscle];
    const lastTrainedDate = lastMs > 0 ? new Date(lastMs).toISOString().split('T')[0] : null;
    const hoursAgo = lastMs > 0 ? Math.round((nowMs - lastMs) / (1000 * 60 * 60)) : null;

    let hoursUntilFull = 0;
    if (recoveryPercent < 100 && rawFatigue > 0.05) {
      const lambda = Math.LN2 / threshold.halfLifeHours;
      // Solve for t where fatigue falls below 0.05
      const remainingHours = Math.log(rawFatigue / 0.05) / lambda;
      hoursUntilFull = Math.max(0, Math.round(remainingHours));
    }

    let statusCategory: MuscleRecoveryState['statusCategory'] = 'rested';
    if (recoveryPercent <= 35) statusCategory = 'exhausted';
    else if (recoveryPercent <= 65) statusCategory = 'recovering';
    else if (recoveryPercent <= 85) statusCategory = 'optimal';

    result[muscle] = {
      muscleGroup: muscle,
      recoveryPercent,
      fatigueScore: Number(rawFatigue.toFixed(2)),
      totalSets7Days: Math.round(sets7DaysMap[muscle]),
      totalVolume7Days: Math.round(volume7DaysMap[muscle]),
      effectiveReps7Days: Math.round(effectiveRepsMap[muscle]),
      inol7Days: Number(inolMap[muscle].toFixed(2)),
      lastTrainedDate,
      lastTrainedHoursAgo: hoursAgo,
      hoursUntilFullRecovery: hoursUntilFull,
      statusCategory,
      colorHex: getRecoveryColorHex(recoveryPercent),
    };
  });

  return result;
}

export interface DailyReadinessResult {
  readinessScore: number; // 0..100%
  status: 'peak' | 'optimal' | 'moderate' | 'fatigued' | 'recovery_needed';
  statusLabel: string;
  colorHex: string;
  centralReadiness: number;    // From Banister model
  peripheralReadiness: number; // Average freshness of muscle groups
  recommendation: string;
}

export type BanisterModelState = BanisterImpulseState;

/**
 * Computes composite Daily Athlete Readiness Score combining CNS Banister impulse-response,
 * peripheral muscular recovery state, and subjective DOMS feedback.
 */
export const calculateDailyReadinessScore = (
  banisterState: BanisterImpulseState,
  recoveryMap: Record<string, MuscleRecoveryState>,
  options?: { domsScore?: 'none' | 'mild' | 'severe'; sleepScore?: number }
): DailyReadinessResult => {
  const centralReadiness = banisterState.readiness;

  // Calculate average recovery across all non-100% or recently trained muscles
  const muscleList = Object.values(recoveryMap);
  const trainedMuscles = muscleList.filter(m => m.lastTrainedHoursAgo !== null && m.lastTrainedHoursAgo <= 72);
  const peripheralReadiness = trainedMuscles.length > 0
    ? Math.round(trainedMuscles.reduce((sum, m) => sum + m.recoveryPercent, 0) / trainedMuscles.length)
    : Math.round(muscleList.reduce((sum, m) => sum + m.recoveryPercent, 0) / muscleList.length);

  // Weighted integration: 60% Central (CNS) + 40% Peripheral (Muscles)
  let rawScore = centralReadiness * 0.6 + peripheralReadiness * 0.4;

  // DOMS subjective modifier
  if (options?.domsScore === 'severe') {
    rawScore *= 0.82; // -18% penalty for severe soreness
  } else if (options?.domsScore === 'mild') {
    rawScore *= 0.94;
  }

  // Sleep score modifier (e.g. 1..10, 8 is baseline)
  if (options?.sleepScore) {
    const sleepFactor = Math.min(1.08, Math.max(0.85, 0.7 + (options.sleepScore / 10) * 0.35));
    rawScore *= sleepFactor;
  }

  const readinessScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  let status: DailyReadinessResult['status'];
  let statusLabel: string;
  let colorHex: string;
  let recommendation: string;

  if (readinessScore >= 88) {
    status = 'peak';
    statusLabel = 'Пиковая готовность (Суперкомпенсация)';
    colorHex = '#10b981'; // Emerald
    recommendation = 'Идеальное состояние для установления личных рекордов (PR), тяжелых синглов или ударных сессий.';
  } else if (readinessScore >= 72) {
    status = 'optimal';
    statusLabel = 'Оптимальная форма';
    colorHex = '#3b82f6'; // Blue
    recommendation = 'Организм полностью готов к плановой тяжелой тренировочной нагрузке.';
  } else if (readinessScore >= 55) {
    status = 'moderate';
    statusLabel = 'Умеренное утомление';
    colorHex = '#f59e0b'; // Amber
    recommendation = 'Легкое накопление усталости. Рекомендуется стандартная тренировка с контролем RIR >= 2.';
  } else if (readinessScore >= 40) {
    status = 'fatigued';
    statusLabel = 'Высокое утомление';
    colorHex = '#f97316'; // Orange
    recommendation = 'ЦНС или связки перегружены. Снизьте рабочий тоннаж на 20-30% или проведите техническую сессию.';
  } else {
    status = 'recovery_needed';
    statusLabel = 'Критическое утомление / Требуется отдых';
    colorHex = '#e11d48'; // Crimson
    recommendation = 'Высокий риск перетренированности. Рекомендуется день активного отдыха, массаж, сон и восстановление.';
  }

  return {
    readinessScore,
    status,
    statusLabel,
    colorHex,
    centralReadiness,
    peripheralReadiness,
    recommendation,
  };
};


