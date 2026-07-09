import React, { useMemo } from 'react';
import { useGymStore } from '../store/gymStore';
import {
  Dumbbell, Trophy, Layers, Flame, Zap, Coffee, Shield, Star, Activity, Medal, TrendingUp,
} from './BroskyIcon';

// ── Achievement Definitions ────────────────────────────────────────────────

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;       // tailwind text-color
  bgColor: string;     // tailwind bg for unlocked state
  borderColor: string; // tailwind border for unlocked
  check: (ctx: AchievementContext) => boolean;
}

interface AchievementContext {
  totalSessions: number;
  totalTonnage: number;
  totalPRs: number;
  maxConsecutiveNutritionDays: number;
  maxConsecutiveWeeksWithTraining: number;
  daysWithBothWorkoutAndNutrition: number;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_step',
    name: 'Первый шаг',
    description: 'Записана 1-я тренировка',
    icon: Dumbbell,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    check: (ctx) => ctx.totalSessions >= 1,
  },
  {
    id: 'marathoner',
    name: 'Марафонец',
    description: '10+ тренировок',
    icon: Trophy,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    check: (ctx) => ctx.totalSessions >= 10,
  },
  {
    id: 'ton_of_steel',
    name: 'Тонна стали',
    description: 'Суммарный тоннаж ≥ 1 000 кг',
    icon: Layers,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    check: (ctx) => ctx.totalTonnage >= 1_000,
  },
  {
    id: '10_tons',
    name: '10 тонн',
    description: 'Суммарный тоннаж ≥ 10 000 кг',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    check: (ctx) => ctx.totalTonnage >= 10_000,
  },
  {
    id: '100_tons',
    name: '100 тонн',
    description: 'Суммарный тоннаж ≥ 100 000 кг',
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    check: (ctx) => ctx.totalTonnage >= 100_000,
  },
  {
    id: 'nutrition_master',
    name: 'КБЖУ Мастер',
    description: '7+ дней подряд питание заполнено',
    icon: Coffee,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    check: (ctx) => ctx.maxConsecutiveNutritionDays >= 7,
  },
  {
    id: 'iron_will',
    name: 'Стальная воля',
    description: '4 недели подряд ≥ 3 тренировок',
    icon: Shield,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    check: (ctx) => ctx.maxConsecutiveWeeksWithTraining >= 4,
  },
  {
    id: 'record_breaker',
    name: 'Рекордсмен',
    description: 'Установлено 5+ личных рекордов',
    icon: Star,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    check: (ctx) => ctx.totalPRs >= 5,
  },
  {
    id: 'full_control',
    name: 'Полный контроль',
    description: 'Тренировка + питание в 1 день 10+ раз',
    icon: Activity,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    check: (ctx) => ctx.daysWithBothWorkoutAndNutrition >= 10,
  },
  {
    id: 'super_centurion',
    name: 'Гладиатор',
    description: 'Записано 50+ тренировок',
    icon: Trophy,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    check: (ctx) => ctx.totalSessions >= 50,
  },
  {
    id: 'legendary_centurion',
    name: 'Железный центурион',
    description: 'Записано 100+ тренировок',
    icon: Medal,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    check: (ctx) => ctx.totalSessions >= 100,
  },
  {
    id: 'titan_force',
    name: 'Сила титана',
    description: 'Суммарный тоннаж ≥ 250 000 кг',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    check: (ctx) => ctx.totalTonnage >= 250_000,
  },
  {
    id: 'nutrition_guru',
    name: 'Гуру КБЖУ',
    description: '30+ дней подряд питание заполнено',
    icon: Coffee,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    check: (ctx) => ctx.maxConsecutiveNutritionDays >= 30,
  },
  {
    id: 'iron_will_gold',
    name: 'Олимпиец',
    description: '12 недель подряд ≥ 3 тренировок',
    icon: Shield,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    check: (ctx) => ctx.maxConsecutiveWeeksWithTraining >= 12,
  },
  {
    id: 'record_hero',
    name: 'Коллекционер рекордов',
    description: 'Установлено 15+ личных рекордов',
    icon: Star,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    check: (ctx) => ctx.totalPRs >= 15,
  },
  {
    id: 'monk_lifestyle',
    name: 'Образ жизни: Монах',
    description: 'Тренировка + питание в 1 день 30+ раз',
    icon: Activity,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    check: (ctx) => ctx.daysWithBothWorkoutAndNutrition >= 30,
  },
];

// ── Athlete Level System ───────────────────────────────────────────────────

interface AthleteLevel {
  name: string;
  minTonnage: number;
  color: string;
  bgGradient: string;
  textColor: string;
}

const LEVELS: AthleteLevel[] = [
  { name: 'Новичок',    minTonnage: 0,       color: '#9ca3af', bgGradient: 'from-gray-100 to-gray-200',     textColor: 'text-gray-600'    },
  { name: 'Любитель',   minTonnage: 1_000,   color: '#3b82f6', bgGradient: 'from-blue-50 to-blue-100',     textColor: 'text-blue-600'    },
  { name: 'Спортсмен',  minTonnage: 10_000,  color: '#10b981', bgGradient: 'from-emerald-50 to-emerald-100', textColor: 'text-emerald-600' },
  { name: 'Атлет',      minTonnage: 50_000,  color: '#f59e0b', bgGradient: 'from-amber-50 to-amber-100',   textColor: 'text-amber-600'   },
  { name: 'Мастер',     minTonnage: 100_000, color: '#8b5cf6', bgGradient: 'from-purple-50 to-purple-100', textColor: 'text-purple-600'  },
  { name: 'Легенда',    minTonnage: 500_000, color: '#ef4444', bgGradient: 'from-rose-50 to-rose-100',     textColor: 'text-rose-600'    },
];

function getAthleteLevel(tonnage: number): { current: AthleteLevel; next: AthleteLevel | null; progress: number } {
  let currentIdx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (tonnage >= LEVELS[i].minTonnage) {
      currentIdx = i;
      break;
    }
  }
  const current = LEVELS[currentIdx];
  const next = currentIdx < LEVELS.length - 1 ? LEVELS[currentIdx + 1] : null;
  const progress = next
    ? Math.min(1, (tonnage - current.minTonnage) / (next.minTonnage - current.minTonnage))
    : 1;
  return { current, next, progress };
}

// ── Helper: Calculate Consecutive Weeks with ≥3 Workouts ───────────────────

function calcMaxConsecutiveWeeks(sessionDates: string[]): number {
  if (sessionDates.length === 0) return 0;
  
  const dates = sessionDates.map(d => new Date(d));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Get Monday of minDate's week
  const startMonday = new Date(minDate);
  const day = startMonday.getDay();
  startMonday.setDate(startMonday.getDate() - (day === 0 ? 6 : day - 1));
  startMonday.setHours(0, 0, 0, 0);
  
  const weeks: number[] = [];
  const cursor = new Date(startMonday);
  
  while (cursor <= maxDate) {
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const count = dates.filter(d => d >= cursor && d <= weekEnd).length;
    weeks.push(count);
    
    cursor.setDate(cursor.getDate() + 7);
  }
  
  let maxStreak = 0;
  let streak = 0;
  for (const w of weeks) {
    if (w >= 3) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 0;
    }
  }
  return maxStreak;
}

// ── Helper: Calculate Current Streak (consecutive weeks with ≥3 workouts, ending now) ─

function calcCurrentStreak(sessionDates: string[]): number {
  if (sessionDates.length === 0) return 0;

  const now = new Date();
  const day = now.getDay();
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  thisMonday.setHours(0, 0, 0, 0);

  const dates = sessionDates.map(d => new Date(d));
  let streak = 0;
  const cursor = new Date(thisMonday);

  while (true) {
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const count = dates.filter(d => d >= cursor && d <= weekEnd).length;
    if (count >= 3) {
      streak++;
    } else {
      // Allow current (incomplete) week to not break streak if it just started
      if (cursor.getTime() !== thisMonday.getTime()) break;
    }
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

// ── Helper: Consecutive Nutrition Days ─────────────────────────────────────

function calcMaxConsecutiveNutritionDays(nutritionDates: string[]): number {
  if (nutritionDates.length === 0) return 0;
  const sorted = [...nutritionDates].sort();
  let max = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffMs = curr.getTime() - prev.getTime();
    if (diffMs === 86_400_000) {
      current++;
      max = Math.max(max, current);
    } else if (diffMs > 86_400_000) {
      current = 1;
    }
  }
  return max;
}

// ── Main Component ─────────────────────────────────────────────────────────

export const AchievementsPanel: React.FC = () => {
  const workoutSessions = useGymStore(s => s.workoutSessions);
  const nutritionLogs = useGymStore(s => s.nutritionLogs);
  const personalRecords = useGymStore(s => s.personalRecords);
  const exercises = useGymStore(s => s.exercises);

  // ── Compute metrics ──────────────────────────────────────────────────────

  const totalTonnage = useMemo(() => {
    let vol = 0;
    for (const session of workoutSessions) {
      if (!session.logs) continue;
      for (const log of Object.values(session.logs)) {
        for (const set of log.sets) {
          if (set.isCompleted && set.weight > 0 && set.reps > 0) {
            vol += set.weight * set.reps;
          }
        }
      }
    }
    return Math.round(vol);
  }, [workoutSessions]);

  const sessionDates = useMemo(() => workoutSessions.map(s => s.date), [workoutSessions]);
  const nutritionDates = useMemo(() => nutritionLogs.filter(n => n.calories > 0).map(n => n.date), [nutritionLogs]);

  const ctx: AchievementContext = useMemo(() => ({
    totalSessions: workoutSessions.length,
    totalTonnage,
    totalPRs: personalRecords.length,
    maxConsecutiveNutritionDays: calcMaxConsecutiveNutritionDays(nutritionDates),
    maxConsecutiveWeeksWithTraining: calcMaxConsecutiveWeeks(sessionDates),
    daysWithBothWorkoutAndNutrition: (() => {
      const wDates = new Set(sessionDates);
      return nutritionDates.filter(d => wDates.has(d)).length;
    })(),
  }), [workoutSessions, totalTonnage, personalRecords, nutritionDates, sessionDates]);

  const unlockedCount = useMemo(() => ACHIEVEMENTS.filter(a => a.check(ctx)).length, [ctx]);
  const level = useMemo(() => getAthleteLevel(totalTonnage), [totalTonnage]);
  const currentStreak = useMemo(() => calcCurrentStreak(sessionDates), [sessionDates]);

  // Top PRs for info cards
  const topPRs = useMemo(() => {
    return personalRecords
      .map(pr => ({
        ...pr,
        exerciseName: exercises.find(e => e.id === pr.exerciseId)?.name || pr.exerciseId,
      }))
      .sort((a, b) => b.weight1rm - a.weight1rm)
      .slice(0, 4);
  }, [personalRecords, exercises]);

  const formatTonnage = (kg: number): string => {
    if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)}M`;
    if (kg >= 1_000) return `${(kg / 1_000).toFixed(1)}K`;
    return `${kg}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── Level & Streak Hero Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

        {/* Athlete Level Card */}
        <div className={`glass-panel rounded-2xl p-4 sm:p-5 shadow-xl bg-gradient-to-br ${level.current.bgGradient} border border-white/60`}>
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{ background: level.current.color }}
            >
              <Medal size={18} className="text-white sm:hidden" />
              <Medal size={20} className="text-white hidden sm:block" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Уровень атлета</p>
              <p className={`text-base sm:text-lg font-black ${level.current.textColor} leading-tight truncate`}>{level.current.name}</p>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-gray-500">
              <span>Тоннаж: {formatTonnage(totalTonnage)} кг</span>
              {level.next && <span>{formatTonnage(level.next.minTonnage)} кг</span>}
            </div>
            <div className="w-full h-2 sm:h-2.5 bg-white/60 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(level.progress * 100, 2)}%`,
                  background: `linear-gradient(90deg, ${level.current.color}, ${level.current.color}dd)`,
                }}
              />
            </div>
            {level.next && (
              <p className="text-[8px] sm:text-[9px] text-gray-400 text-right">
                До «{level.next.name}»: {formatTonnage(level.next.minTonnage - totalTonnage)} кг
              </p>
            )}
          </div>
        </div>

        {/* Streak Card */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-xl border border-white/60">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${
              currentStreak > 0 ? 'bg-orange-500' : 'bg-gray-300'
            }`}>
              <Flame size={18} className="text-white sm:hidden" />
              <Flame size={20} className="text-white hidden sm:block" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Стрик регулярности</p>
              <p className={`text-base sm:text-lg font-black leading-tight ${currentStreak > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                {currentStreak > 0 ? `${currentStreak} ${currentStreak === 1 ? 'неделя' : currentStreak < 5 ? 'недели' : 'недель'}` : 'Нет стрика'}
              </p>
            </div>
          </div>
          <p className="text-[9px] sm:text-[10px] text-gray-400 leading-relaxed">
            {currentStreak > 0
              ? `Вы тренируетесь ≥3 раз в неделю уже ${currentStreak} ${currentStreak === 1 ? 'неделю' : currentStreak < 5 ? 'недели' : 'недель'} подряд. Не ломайте серию!`
              : 'Тренируйтесь минимум 3 раза в неделю, чтобы зажечь стрик.'}
          </p>
          {currentStreak > 0 && (
            <div className="flex gap-1 mt-2 sm:mt-2.5 flex-wrap">
              {Array.from({ length: Math.min(currentStreak, 12) }).map((_, i) => (
                <div
                  key={i}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, #f97316, #ef4444)`,
                    opacity: 0.5 + (i / Math.min(currentStreak, 12)) * 0.5,
                  }}
                >
                  <Flame size={8} className="text-white" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Achievements Grid ─────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-gray-800 flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Trophy size={12} className="text-amber-500 sm:hidden" />
              <Trophy size={14} className="text-amber-500 hidden sm:block" />
            </div>
            Достижения
          </h3>
          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full">
            {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = ach.check(ctx);
            const Icon = ach.icon;
            return (
              <div
                key={ach.id}
                className={`relative rounded-xl p-3 sm:p-3.5 border transition-all select-none ${
                  unlocked
                    ? `${ach.bgColor} ${ach.borderColor} shadow-sm`
                    : 'bg-gray-50/60 border-gray-100 opacity-50'
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-2.5">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    unlocked ? `${ach.bgColor} ${ach.color}` : 'bg-gray-100 text-gray-300'
                  }`}>
                    <Icon size={14} className="sm:hidden" />
                    <Icon size={16} className="hidden sm:block" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[11px] sm:text-xs font-bold leading-tight ${unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                      {ach.name}
                    </p>
                    <p className={`text-[9px] sm:text-[10px] mt-0.5 leading-snug ${unlocked ? 'text-gray-500' : 'text-gray-300'}`}>
                      {ach.description}
                    </p>
                  </div>
                </div>
                {unlocked && (
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/30">
                      <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Personal Records Info Cards ────────────────────────────────── */}
      {topPRs.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
          <h3 className="text-xs sm:text-sm font-black text-gray-800 flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <Star size={12} className="text-purple-500 sm:hidden" />
              <Star size={14} className="text-purple-500 hidden sm:block" />
            </div>
            Личные рекорды
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {topPRs.map((pr) => (
              <div
                key={pr.exerciseId}
                className="rounded-xl p-3 sm:p-3.5 bg-gradient-to-br from-white to-gray-50/80 border border-gym-border/40 shadow-xs flex items-center gap-2.5 sm:gap-3"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gym-accent/10 text-gym-accent flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={14} className="sm:hidden" />
                  <TrendingUp size={16} className="hidden sm:block" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs font-bold text-gray-800 truncate">{pr.exerciseName}</p>
                  <div className="flex items-baseline gap-1 sm:gap-1.5 mt-0.5">
                    <span className="text-xs sm:text-sm font-black text-gym-accent tabular-nums">{pr.weight1rm}</span>
                    <span className="text-[9px] sm:text-[10px] text-gray-400">кг 1RM</span>
                    {pr.actualWeight && (
                      <span className="text-[8px] sm:text-[9px] text-gray-300 ml-auto tabular-nums">
                        {pr.actualWeight}×{pr.actualReps}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[8px] sm:text-[9px] text-gray-300 font-mono tabular-nums flex-shrink-0 hidden xs:block">{pr.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats Summary Footer ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="glass-panel rounded-xl p-2.5 sm:p-3 text-center shadow-sm">
          <p className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-wider">Тренировок</p>
          <p className="text-base sm:text-lg font-black text-gray-800 tabular-nums">{workoutSessions.length}</p>
        </div>
        <div className="glass-panel rounded-xl p-2.5 sm:p-3 text-center shadow-sm">
          <p className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-wider">Тоннаж</p>
          <p className="text-base sm:text-lg font-black text-gray-800 tabular-nums">{formatTonnage(totalTonnage)}<span className="text-[10px] sm:text-xs font-normal text-gray-400 ml-0.5">кг</span></p>
        </div>
        <div className="glass-panel rounded-xl p-2.5 sm:p-3 text-center shadow-sm">
          <p className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-wider">Рекордов</p>
          <p className="text-base sm:text-lg font-black text-gray-800 tabular-nums">{personalRecords.length}</p>
        </div>
      </div>
    </div>
  );
};
