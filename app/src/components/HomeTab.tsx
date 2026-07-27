import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useGymStore } from '../store/gymStore';
import { calculateTDEE, generateDietPlans } from '../utils/formulas';
import { Activity, Flame, Droplet, Dumbbell, Coffee, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar, Footprints } from './BroskyIcon';
import { AnatomyModel } from './AnatomyModel';
import { animateCounter } from '../utils/animationEngine';

const generateWorkoutId = () => 'workout-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);

export const HomeTab: React.FC = () => {
  const profile = useGymStore(s => s.profile);
  const workoutSessions = useGymStore(s => s.workoutSessions);
  const deleteWorkoutSession = useGymStore(s => s.deleteWorkoutSession);
  const saveWorkoutSession = useGymStore(s => s.saveWorkoutSession);
  const progress = useGymStore(s => s.progress);
  const exercises = useGymStore(s => s.exercises);

  // Состояния
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMetaDetails, setShowMetaDetails] = useState(false);
  const [atlasMode, setAtlasMode] = useState<'heatmap' | 'fatigue'>('heatmap');

  const weeklyLoads = useMemo(() => {
    const loads: Record<string, number> = {};
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentSessions = (workoutSessions || []).filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= sevenDaysAgo;
    });

    recentSessions.forEach(session => {
      if (!session.logs) return;
      Object.values(session.logs).forEach(log => {
        const completedSets = (log.sets || []).filter(s => s.isCompleted).length;
        if (completedSets === 0) return;

        const exercise = exercises.find(e => e.id === log.exerciseId);
        if (!exercise) return;

        const mainMuscle = exercise.muscleGroup;
        if (mainMuscle) {
          loads[mainMuscle] = (loads[mainMuscle] || 0) + completedSets;
        }

        if (exercise.muscleGroups && Array.isArray(exercise.muscleGroups)) {
          exercise.muscleGroups.forEach(subMuscle => {
            if (subMuscle !== mainMuscle) {
              loads[subMuscle] = (loads[subMuscle] || 0) + (completedSets * 0.5);
            }
          });
        }
      });
    });

    Object.keys(loads).forEach(k => {
      loads[k] = Math.round(loads[k] * 10) / 10;
    });

    return loads;
  }, [workoutSessions, exercises]);

  const fatigueLevels = useMemo(() => {
    const fatigue: Record<string, number> = {};
    const now = new Date();
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    const recentSessions = (workoutSessions || []).filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= threeDaysAgo;
    });

    const muscleWorkouts: Record<string, Array<{ hoursElapsed: number; sets: number }>> = {};

    recentSessions.forEach(session => {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(12, 0, 0, 0);
      
      const diffMs = now.getTime() - sessionDate.getTime();
      const hoursElapsed = Math.max(0, diffMs / (1000 * 60 * 60));

      if (!session.logs) return;

      Object.values(session.logs).forEach(log => {
        const completedSets = (log.sets || []).filter(s => s.isCompleted).length;
        if (completedSets === 0) return;

        const exercise = exercises.find(e => e.id === log.exerciseId);
        if (!exercise) return;

        const mainMuscle = exercise.muscleGroup;
        if (mainMuscle) {
          if (!muscleWorkouts[mainMuscle]) muscleWorkouts[mainMuscle] = [];
          muscleWorkouts[mainMuscle].push({ hoursElapsed, sets: completedSets });
        }

        if (exercise.muscleGroups && Array.isArray(exercise.muscleGroups)) {
          exercise.muscleGroups.forEach(subMuscle => {
            if (subMuscle !== mainMuscle) {
              if (!muscleWorkouts[subMuscle]) muscleWorkouts[subMuscle] = [];
              muscleWorkouts[subMuscle].push({ hoursElapsed, sets: completedSets * 0.5 });
            }
          });
        }
      });
    });

    Object.entries(muscleWorkouts).forEach(([muscle, workouts]) => {
      let maxFatigue = 0;
      workouts.forEach(w => {
        let recoveryTime = 24;
        if (w.sets > 3 && w.sets <= 6) {
          recoveryTime = 48;
        } else if (w.sets > 6) {
          recoveryTime = 72;
        }

        if (w.hoursElapsed < recoveryTime) {
          const f = (1 - w.hoursElapsed / recoveryTime) * 100;
          if (f > maxFatigue) {
            maxFatigue = f;
          }
        }
      });
      fatigue[muscle] = Math.round(maxFatigue);
    });

    return fatigue;
  }, [workoutSessions, exercises]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const latestProgress = progress.length > 0 ? progress[progress.length - 1] : null;

  const getWorkoutCountThisWeek = (): number => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return workoutSessions.filter(s => {
      const sDate = new Date(s.date);
      return sDate >= monday && sDate <= sunday;
    }).length;
  };

  const workoutsThisWeek = getWorkoutCountThisWeek();

  const activeProfileForCalc = useMemo(() => ({
    ...profile,
    weight: (latestProgress?.weight != null) ? latestProgress.weight : profile.weight,
    fatPercent: (latestProgress?.fatPercent != null) ? latestProgress.fatPercent : profile.fatPercent,
  }), [profile, latestProgress]);

  const t = useMemo(() => calculateTDEE(activeProfileForCalc), [activeProfileForCalc]);
  const plans = useMemo(() => generateDietPlans(activeProfileForCalc), [activeProfileForCalc]);
  const currentPlan = plans[profile.selectedGoal];

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isTodayWorkout = workoutSessions.some(s => s.date === todayStr);

  const totalVolumeToday = useMemo(() => {
    if (!isTodayWorkout) return 0;
    const sessionsToday = workoutSessions.filter(s => s.date === todayStr);
    let vol = 0;
    for (const session of sessionsToday) {
      if (!session.logs) continue;
      for (const exerciseLog of Object.values(session.logs)) {
        if (!exerciseLog.sets) continue;
        for (const set of exerciseLog.sets) {
          if (set.isCompleted && set.weight > 0 && set.reps > 0) {
            vol += set.weight * set.reps;
          }
        }
      }
    }
    return vol;
  }, [workoutSessions, todayStr, isTodayWorkout]);

  const todayPlans = useMemo(() => {
    return generateDietPlans(activeProfileForCalc, totalVolumeToday, isTodayWorkout);
  }, [activeProfileForCalc, totalVolumeToday, isTodayWorkout]);

  const todayPlan = isTodayWorkout 
    ? todayPlans[profile.selectedGoal].trainingDay 
    : todayPlans[profile.selectedGoal].restDay;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const calorieRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (calorieRef.current && todayPlan.calories > 0) {
      animateCounter(calorieRef.current, todayPlan.calories, 0.8, 0);
    }
  }, [todayPlan.calories]);

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getFormattedDate = (dayNum: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const handleDayClick = (dateStr: string) => {
    const existingSession = workoutSessions.find(s => s.date === dateStr);
    if (existingSession) {
      deleteWorkoutSession(existingSession.id);
    } else {
      const randomId = generateWorkoutId();
      saveWorkoutSession({
        id: randomId,
        date: dateStr,
        templateName: 'Быстрая тренировка',
        workoutType: 'Upper A',
        logs: {}
      });
    }
  };

  const monthNames = [
'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Левая колонка (План + Календарь) */}
      <div className="lg:col-span-7 flex flex-col gap-8 w-full">
        {/* 1. План питания и активности на сегодня */}
        <div 
          className="glass-panel rounded-2xl p-6 shadow-xl border border-emerald-500/10 space-y-4 animate-fadeInUp opacity-0"
          style={{ animationDelay: '0ms' }}
        >
          <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-between sm:items-center border-b border-gym-border pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <Activity size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight leading-tight">
                План на сегодня
              </h3>
            </div>
            <div className="self-start sm:self-auto">
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                isTodayWorkout ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200/80' : 'bg-blue-500/10 text-blue-600 border border-blue-200/80'
              }`}>
                {isTodayWorkout ? 'День тренировки' : 'День отдыха'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Круг калорий */}
            <div className="flex flex-col items-center justify-center p-4 bg-white/40 border border-gym-border/30 rounded-2xl relative">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Бюджет Калорий</span>
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#f1f3f9" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - Math.min(1, (todayPlan.calories / todayPlan.calories)))}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span ref={calorieRef} className="text-2xl font-black text-gray-800 font-display leading-none">{todayPlan.calories}</span>
                  <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">ккал</span>
                </div>
              </div>
            </div>

            {/* Макронутриенты */}
            <div className="flex flex-col justify-between gap-2.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Целевые макросы (г)</span>
              
              <div className="flex items-center justify-between p-3 bg-white/30 border border-gym-border/35 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
                  <span className="text-xs font-bold text-gray-600">Белки</span>
                </div>
                <span className="text-sm font-extrabold text-orange-500 font-display">{todayPlan.protein.grams}г</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/30 border border-gym-border/35 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0"></span>
                  <span className="text-xs font-bold text-gray-600">Жиры</span>
                </div>
                <span className="text-sm font-extrabold text-yellow-600 font-display">{todayPlan.fat.grams}г</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/30 border border-gym-border/35 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0"></span>
                  <span className="text-xs font-bold text-gray-600">Углеводы</span>
                </div>
                <span className="text-sm font-extrabold text-cyan-500 font-display">{todayPlan.carbs.grams}г</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap sm:flex-row sm:gap-6 gap-3 justify-center items-center text-xs text-gray-500 pt-4 border-t border-gym-border/20 mt-4 font-semibold">
            <span className="flex items-center gap-1">
              <Droplet size={14} className="text-blue-500/80" /> Вода: <span className="font-bold text-gray-700 font-display">{todayPlan.water}</span> мл
            </span>
            <span className="flex items-center gap-1"><Footprints size={14} className="text-emerald-500/85" /> Цель шагов: <span className="font-bold text-gray-700 font-display">{todayPlan.steps.toLocaleString()}</span></span>
          </div>

          {/* Выдвигающийся аккордеон с общими ориентирами КБЖУ и TDEE */}
          <div className="border-t border-gym-border/20 pt-4">
            <button
              type="button"
              onClick={() => setShowMetaDetails(!showMetaDetails)}
              className="w-full flex justify-between items-center py-2.5 px-3.5 text-xs font-bold text-gray-600 hover:text-gym-accent transition-all cursor-pointer bg-white/70 hover:bg-white rounded-xl border border-gym-border/30 shadow-xs"
            >
              <span className="flex items-center gap-2 text-left">
                <Activity size={16} className="text-gym-accent shrink-0" />
                <span>Подробнее о целях КБЖУ и TDEE расчете</span>
              </span>
              <div className="w-6 h-6 rounded-lg bg-gray-100/80 flex items-center justify-center shrink-0 text-gray-500">
                {showMetaDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                showMetaDetails ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-6 pt-2">
                {/* Общие КБЖУ ориентиры */}
                <div className="border-b border-gym-border/20 pb-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Flame size={14} className="text-rose-500" />
                    Общий КБЖУ-ориентир по цели
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Тренировка */}
                    <div className="glass-card rounded-xl p-4 border border-gym-border/40">
                      <div className="flex items-center justify-between border-b border-gym-border/40 pb-2 mb-3">
                        <span className="text-[10px] font-bold text-gray-700 tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          ТРЕНИРОВКА
                        </span>
                        <span className="text-xs font-extrabold text-gray-800">{currentPlan.trainingDay.calories} ккал</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Белки</span>
                          <span className="font-bold text-gray-800">{currentPlan.trainingDay.protein.grams}г</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Жиры</span>
                          <span className="font-bold text-gray-800">{currentPlan.trainingDay.fat.grams}г</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Углеводы</span>
                          <span className="font-bold text-gray-800">{currentPlan.trainingDay.carbs.grams}г</span>
                        </div>
                      </div>
                    </div>
                    {/* Отдых */}
                    <div className="glass-card rounded-xl p-4 border border-gym-border/40">
                      <div className="flex items-center justify-between border-b border-gym-border/40 pb-2 mb-3">
                        <span className="text-[10px] font-bold text-gray-700 tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          ДЕНЬ ОТДЫХА
                        </span>
                        <span className="text-xs font-extrabold text-gray-800">{currentPlan.restDay.calories} ккал</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Белки</span>
                          <span className="font-bold text-gray-800">{currentPlan.restDay.protein.grams}г</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Жиры</span>
                          <span className="font-bold text-gray-800">{currentPlan.restDay.fat.grams}г</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Углеводы</span>
                          <span className="font-bold text-gray-800">{currentPlan.restDay.carbs.grams}г</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Расчет TDEE */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Activity size={14} className="text-gym-accent" />
                    Расчет суточного расхода (TDEE) и метаболизма
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center py-1.5 border-b border-gym-border/45">
                        <span className="text-gray-500">Чистая масса тела (ЧМТ)</span>
                        <span className="font-semibold text-gray-800">{t.lbm} кг</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-gym-border/45">
                        <span className="text-gray-500">BMR Mifflin-St Jeor</span>
                        <span className="font-semibold text-gray-800">{t.bmrMifflin} ккал</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-gym-border/45 font-medium">
                        <span className="text-gym-accent">Базовый BMR (средний)</span>
                        <span className="font-bold text-gym-accent">{t.bmrAverage} ккал</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center py-1.5 border-b border-gym-border/45">
                        <span className="text-gray-500">Шаговая активность (NEAT)</span>
                        <span className="font-semibold text-emerald-600">+{t.neat} ккал</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-gym-border/45">
                        <span className="text-gray-500">Силовая тренировка (EAT)</span>
                        <span className="font-semibold text-emerald-600">+{t.eat} ккал</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-gym-border/45 font-medium">
                        <span className="text-gray-500">Пищевой термогенез (TEF)</span>
                        <span className="font-semibold text-gray-700">~10% TDEE</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                    <div className="glass-card p-3 rounded-xl flex items-center justify-between border border-gym-border/30 bg-white/40">
                      <div>
                        <span className="block text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">TDEE: День отдыха</span>
                        <span className="text-sm font-bold text-gray-800">{t.tdeeRest} <span className="text-[10px] font-semibold text-gray-400">ккал</span></span>
                      </div>
                      <div className="p-1 bg-gray-100 text-gray-500 rounded-lg">
                        <Coffee size={14} />
                      </div>
                    </div>

                    <div className="glass-card p-3 rounded-xl flex items-center justify-between border border-gym-border/30 bg-white/40">
                      <div>
                        <span className="block text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">TDEE: Трен. день</span>
                        <span className="text-sm font-bold text-gym-accent">{t.tdeeTrain} <span className="text-[10px] font-semibold text-gym-accent/50">ккал</span></span>
                      </div>
                      <div className="p-1 bg-blue-50 text-gym-accent rounded-lg">
                        <Dumbbell size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Календарь тренировок */}
        <div 
          className="glass-panel rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 animate-fadeInUp opacity-0"
          style={{ animationDelay: '120ms' }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gym-border/40 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gym-accent/10 text-gym-accent rounded-xl flex items-center justify-center shrink-0">
                <Dumbbell size={24} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight leading-tight">
                    Календарь тренировок
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold text-gym-accent bg-gym-accent/10 px-2 py-0.5 rounded-md w-max mt-0.5">
                  За неделю: {workoutsThisWeek}
                </span>
              </div>
            </div>
            
            {/* Переключатель месяца */}
            <div className="flex items-center bg-white/80 border border-gym-border/60 rounded-xl shadow-xs h-10 select-none overflow-hidden shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
              <button 
                type="button"
                onClick={handlePrevMonth} 
                className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 transition-all cursor-pointer text-gray-600 border-r border-gym-border/30 active:scale-95"
                title="Предыдущий месяц"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1.5 px-3 text-xs font-extrabold text-gray-800 justify-center min-w-[125px] whitespace-nowrap">
                <Calendar size={15} className="text-gym-accent shrink-0" />
                <span>
                  {monthNames[month]} {year}
                </span>
              </div>
              <button 
                type="button"
                onClick={handleNextMonth} 
                className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 transition-all cursor-pointer text-gray-600 border-l border-gym-border/30 active:scale-95"
                title="Следующий месяц"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-2.5 text-center text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1">
            <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square h-auto min-h-[38px]"></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = getFormattedDate(dayNum);
              const hasWorkout = workoutSessions.some(s => s.date === dateStr);
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDayClick(dateStr)}
                  className={`aspect-square h-auto min-h-[38px] p-1 rounded-xl flex flex-col items-center justify-between transition-all cursor-pointer text-xs font-bold leading-none select-none ${
                    isToday
                      ? 'border-2 border-emerald-500 text-emerald-700 bg-emerald-50/40 font-black shadow-xs'
                      : hasWorkout 
                        ? 'bg-gym-accent text-white border border-gym-accent shadow-sm hover:bg-gym-accent/90' 
                        : 'bg-white/60 hover:bg-white text-gray-700 border border-gym-border/40'
                  }`}
                >
                  <span className="mt-1">{dayNum}</span>
                  {hasWorkout ? (
                    <span className="w-1.5 h-1.5 bg-white rounded-full mb-1 shrink-0"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 opacity-0 mb-1"></span>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-gym-border/30 text-xs font-semibold text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-gym-accent rounded-md inline-block shadow-xs"></span> Тренировка
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-white border border-gym-border/60 rounded-md inline-block"></span> День отдыха
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-emerald-500 rounded-md inline-block"></span> Сегодня
            </span>
          </div>
        </div>
      </div>

      {/* Правая колонка (Анатомический атлас нагрузок) */}
      <div 
        className="lg:col-span-5 glass-panel rounded-2xl p-6 shadow-xl space-y-4 animate-fadeInUp opacity-0 lg:sticky lg:top-5"
        style={{ animationDelay: '60ms' }}
      >
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5 border-b border-gym-border pb-3">
          <Dumbbell size={14} className="text-gym-accent" />
          Анатомический атлас мышц
        </h3>

        {/* Сегментированный переключатель режимов */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold border border-slate-200/50 select-none">
          <button
            type="button"
            onClick={() => setAtlasMode('heatmap')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              atlasMode === 'heatmap'
                ? 'bg-gym-accent text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Объем 7 дней
          </button>
          <button
            type="button"
            onClick={() => setAtlasMode('fatigue')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              atlasMode === 'fatigue'
                ? 'bg-gym-accent text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Утомление
          </button>
        </div>
        
        <div className="bg-white/40 border border-gym-border/30 rounded-2xl p-4 shadow-sm">
          <AnatomyModel
            activeMain={null}
            activeSecondary={[]}
            mode={atlasMode}
            weeklyLoads={atlasMode === 'heatmap' ? weeklyLoads : fatigueLevels}
          />
        </div>

        <div className="text-[11px] text-gray-500 leading-relaxed font-medium bg-gray-50/50 p-3 rounded-xl border border-gym-border/30">
          {atlasMode === 'heatmap' ? (
            <>
              <strong>Карта нагрузок</strong> отображает суммарный объем выполненных подходов за 7 дней. Основные мышцы получают 100%, вспомогательные — 50%.
            </>
          ) : (
            <>
              <strong>Карта утомляемости</strong> показывает текущий уровень усталости мышц на основе времени и объема последних тренировок (кривая восстановления 24-72 ч).
            </>
          )}
        </div>

      </div>
    </div>
  );
};
