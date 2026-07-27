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
  mev: number;   // Minimum Effective Volume
  mavMin: number;// Minimum Adaptive Volume
  mavMax: number;// Maximum Adaptive Volume
  mrv: number;   // Maximum Recoverable Volume
  halfLifeHours: number; // T1/2 half life of DOMS / fatigue decay
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
  lastTrainedDate: string | null;
  lastTrainedHoursAgo: number | null;
  hoursUntilFullRecovery: number;
  statusCategory: 'exhausted' | 'recovering' | 'optimal' | 'rested';
  colorHex: string;
}

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
 * Calculates 7-day muscle fatigue decay and recovery status across all muscle groups.
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
  const lastTrainedMsMap: Record<string, number> = {};

  Object.keys(MUSCLE_RECOVERY_CONFIG).forEach(muscle => {
    fatigueMap[muscle] = 0;
    sets7DaysMap[muscle] = 0;
    volume7DaysMap[muscle] = 0;
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
        const rpe = set.rpe || (set.rir !== undefined ? 10 - set.rir : 8);
        const rpeFactor = Math.min(1.2, Math.max(0.5, rpe / 10));
        const tonnage = weight * set.reps;

        affectedMuscles.forEach(muscle => {
          if (!(muscle in MUSCLE_RECOVERY_CONFIG)) return;

          const isPrimary = muscle === primaryMuscle;
          const muscleLoadFactor = isPrimary ? 1.0 : 0.5; // Secondary muscles take 50% load

          const threshold = MUSCLE_RECOVERY_CONFIG[muscle];
          const lambda = Math.LN2 / threshold.halfLifeHours;
          const setFatigue = muscleLoadFactor * rpeFactor * Math.exp(-lambda * hoursAgo);

          fatigueMap[muscle] += setFatigue;
          sets7DaysMap[muscle] += muscleLoadFactor;
          volume7DaysMap[muscle] += tonnage * muscleLoadFactor;

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
      lastTrainedDate,
      lastTrainedHoursAgo: hoursAgo,
      hoursUntilFullRecovery: hoursUntilFull,
      statusCategory,
      colorHex: getRecoveryColorHex(recoveryPercent),
    };
  });

  return result;
}
