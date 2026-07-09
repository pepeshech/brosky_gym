import React, { useState, useMemo } from 'react';
import { useGymStore } from '../store/gymStore';
import { calculateTDEE, generateDietPlans } from '../utils/formulas';
import { Shield, Activity, Flame, Droplet, Dumbbell, Coffee, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileText, Calendar, Footprints, Sparkles } from './BroskyIcon';
import { ReportsModal } from './ReportsModal';
import { AnatomyModel } from './AnatomyModel';

const generateWorkoutId = () => 'workout-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);

export const ProfileTab: React.FC = () => {
  const profile = useGymStore(s => s.profile);
  const workoutSessions = useGymStore(s => s.workoutSessions);
  const deleteWorkoutSession = useGymStore(s => s.deleteWorkoutSession);
  const saveWorkoutSession = useGymStore(s => s.saveWorkoutSession);
  const progress = useGymStore(s => s.progress);
  const exercises = useGymStore(s => s.exercises);

  // Состояния
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMetaDetails, setShowMetaDetails] = useState(false);

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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const [isReportsOpen, setIsReportsOpen] = useState(false);

  // Использование актуальных замеров прогресса для расчета КБЖУ
  const latestProgress = progress.length > 0 ? progress[progress.length - 1] : null;
  const initialProgress = progress.length > 0 ? progress[0] : null;

  // Вычисляем количество тренировок за текущую календарную неделю (Пн - Вс) по календарю
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

  // Данные за СЕГОДНЯ (динамически рассчитываются с учетом сегодняшнего тоннажа тренировки)
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
    return generateDietPlans(activeProfileForCalc, totalVolumeToday);
  }, [activeProfileForCalc, totalVolumeToday]);

  const todayPlan = isTodayWorkout 
    ? todayPlans[profile.selectedGoal].trainingDay 
    : todayPlans[profile.selectedGoal].restDay;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

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
  const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Понедельник = 0

  return (
    <>
      <ReportsModal isOpen={isReportsOpen} onClose={() => setIsReportsOpen(false)} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
          {/* 4. Объединенный блок: Физический профиль атлета */}
          <div className="lg:col-span-5 order-1 lg:order-2 glass-panel rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gym-accent border-b border-gym-border pb-3">
              <Shield size={20} />
              Физический профиль атлета
            </h3>

            {/* Параметры */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-3 rounded-xl border border-gym-border/30 text-center">
                <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">Стартовый вес</span>
                <span className="text-lg font-extrabold text-gray-800">
                  {profile.weight}
                  <span className="text-xs font-normal text-gray-400 ml-0.5">кг</span>
                </span>
              </div>

              <div className="glass-card p-3 rounded-xl border border-gym-border/30 text-center">
                <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">Стартовый жир</span>
                <span className="text-lg font-extrabold text-gray-800">
                  {profile.fatPercent}
                  <span className="text-xs font-normal text-gray-400 ml-0.5">%</span>
                </span>
              </div>

              <div className="glass-card p-3 rounded-xl border border-gym-border/30 text-center">
                <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">Рост</span>
                <span className="text-lg font-extrabold text-gray-800">
                  {profile.height}
                  <span className="text-xs font-normal text-gray-400 ml-0.5">см</span>
                </span>
              </div>

              <div className="glass-card p-3 rounded-xl border border-gym-border/30 text-center">
                <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">Возраст</span>
                <span className="text-lg font-extrabold text-gray-800">
                  {profile.age}
                  <span className="text-xs font-normal text-gray-400 ml-0.5">лет</span>
                </span>
              </div>
            </div>

            {/* Стартовые обмеры */}
            {initialProgress && (initialProgress.chest != null || initialProgress.waist != null || initialProgress.hips != null || initialProgress.thigh != null || initialProgress.biceps != null) && (
              <div className="border-t border-gym-border/30 pt-4 mt-2">
                <span className="text-[10px] text-gray-400 block uppercase font-bold mb-2.5">Стартовые обмеры</span>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {initialProgress.chest != null && (
                    <div className="flex justify-between items-center py-1 border-b border-gym-border/10">
                      <span className="text-gray-400">Грудь</span>
                      <span className="font-bold text-gray-700">{initialProgress.chest} см</span>
                    </div>
                  )}
                  {initialProgress.waist != null && (
                    <div className="flex justify-between items-center py-1 border-b border-gym-border/10">
                      <span className="text-gray-400">Талия</span>
                      <span className="font-bold text-gray-700">{initialProgress.waist} см</span>
                    </div>
                  )}
                  {initialProgress.hips != null && (
                    <div className="flex justify-between items-center py-1 border-b border-gym-border/10">
                      <span className="text-gray-400">Бёдра</span>
                      <span className="font-bold text-gray-700">{initialProgress.hips} см</span>
                    </div>
                  )}
                  {initialProgress.thigh != null && (
                    <div className="flex justify-between items-center py-1 border-b border-gym-border/10">
                      <span className="text-gray-400">Бедро</span>
                      <span className="font-bold text-gray-700">{initialProgress.thigh} см</span>
                    </div>
                  )}
                  {initialProgress.biceps != null && (
                    <div className="flex justify-between items-center py-1 border-b border-gym-border/10">
                      <span className="text-gray-400">Бицепс</span>
                      <span className="font-bold text-gray-700">{initialProgress.biceps} см</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Отчеты */}
            <div className="border-t border-gym-border pt-5 mt-5">
              <button 
                onClick={() => setIsReportsOpen(true)}
                className="w-full py-3 bg-gym-accent hover:bg-gym-accent/90 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-gym-accent/15 hover:scale-[1.01] active:scale-[0.99] border border-gym-accent"
              >
                <FileText size={15} />
                Создать отчет
              </button>
            </div>
          </div>

          {/* 3. Анатомический атлас нагрузок */}
          <div className="lg:col-span-5 order-2 lg:order-4 glass-panel rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-gym-border pb-3">
              <Dumbbell size={14} className="text-gym-accent" />
              Анатомический атлас нагрузок за 7 дней
            </h3>
            
            <div className="bg-white/40 border border-gym-border/30 rounded-2xl p-4 shadow-sm">
              <AnatomyModel
                activeMain={null}
                activeSecondary={[]}
                mode="heatmap"
                weeklyLoads={weeklyLoads}
              />
            </div>

            <div className="text-[11px] text-gray-500 leading-relaxed font-medium bg-gray-50/50 p-3 rounded-xl border border-gym-border/30">
              <Sparkles size={14} className="inline-block text-gym-accent mr-1 align-text-bottom" /> <strong>Карта нагрузок</strong> отображает суммарный объем выполненных рабочих подходов за последние 7 дней. Основные мышцы получают 100% объема, вспомогательные (синергисты) — 50%. Нажмите на мышцу для подсветки.
            </div>
          </div>

          {/* 1. План питания и активности на сегодня */}
          <div className="lg:col-span-7 order-3 lg:order-1 glass-panel rounded-2xl p-6 shadow-xl border border-emerald-500/10 space-y-4">
            <div className="flex justify-between items-center border-b border-gym-border pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Activity size={20} className="text-emerald-500" />
                  План питания и активности на сегодня
                </h3>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full font-mono uppercase tracking-wider ${
                isTodayWorkout ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200' : 'bg-blue-500/10 text-blue-600 border border-blue-200'
              }`}>
                {isTodayWorkout ? 'День тренировки' : 'День отдыха'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-4 rounded-xl text-center border border-gym-border/45 flex flex-col justify-center">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Калории</span>
                <span className="text-2xl font-black text-gray-800">{todayPlan.calories} <span className="text-xs font-bold text-gray-400">ккал</span></span>
              </div>
              
              <div className="glass-card p-4 rounded-xl text-center border border-gym-border/45 md:col-span-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Макронутриенты (план)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/80 p-2 rounded-lg border border-gym-border/40">
                    <span className="text-[10px] text-gray-400 block">Белки</span>
                    <span className="text-sm font-extrabold text-orange-500">{todayPlan.protein.grams}г</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-gym-border/40">
                    <span className="text-[10px] text-gray-400 block">Жиры</span>
                    <span className="text-sm font-extrabold text-yellow-500">{todayPlan.fat.grams}г</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-gym-border/40">
                    <span className="text-[10px] text-gray-400 block">Углеводы</span>
                    <span className="text-sm font-extrabold text-cyan-500">{todayPlan.carbs.grams}г</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-2 justify-center items-center text-xs text-gray-500 pt-4 border-t border-gym-border/20 mt-4 font-semibold">
              <span className="flex items-center gap-1"><Droplet size={14} className="text-blue-500/80" /> Вода: {todayPlan.water} мл</span>
              <span className="flex items-center gap-1"><Footprints size={14} className="text-emerald-500/85" /> Цель шагов: {todayPlan.steps.toLocaleString()}</span>
            </div>

            {/* Выдвигающийся аккордеон с общими ориентирами КБЖУ и TDEE */}
            <div className="border-t border-gym-border/20 pt-4">
              <button
                onClick={() => setShowMetaDetails(!showMetaDetails)}
                className="w-full flex justify-between items-center py-2 px-3 text-xs font-bold text-gray-500 hover:text-gym-accent transition-all cursor-pointer bg-gray-50/50 rounded-xl border border-gym-border/20"
              >
                <span className="flex items-center gap-2">
                  <Activity size={15} className="text-gym-accent" />
                  Подробнее о целях КБЖУ и TDEE расчете
                </span>
                {showMetaDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
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
                        <div className="flex justify-between items-center py-1.5 border-b border-gym-border/45">
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

          {/* 2. Календарь тренировок */}
          <div className="lg:col-span-7 order-4 lg:order-3 glass-panel rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-gym-border/40 pb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gym-accent">
                  <Dumbbell size={20} />
                  Календарь тренировок
                </h3>
                <span className="text-xs bg-gym-accent/10 text-gym-accent font-bold px-2.5 py-1 rounded-lg">
                  За неделю: {workoutsThisWeek}
                </span>
              </div>
              <div className="flex items-center bg-white/50 border border-gym-border/60 rounded-xl shadow-xs h-9">
                <button 
                  onClick={handlePrevMonth} 
                  className="h-9 w-9 flex items-center justify-center hover:bg-gray-150 transition-all cursor-pointer text-gray-500 rounded-l-xl border-r border-gym-border/30 btn-interactive btn-interactive-nav-left"
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 select-none h-9 justify-center min-w-[110px]">
                  <Calendar size={14} className="text-gym-accent" />
                  <span className="text-center">
                    {monthNames[month]} {year}
                  </span>
                </div>
                <button 
                  onClick={handleNextMonth} 
                  className="h-9 w-9 flex items-center justify-center hover:bg-gray-150 transition-all cursor-pointer text-gray-500 rounded-r-xl border-l border-gym-border/30 btn-interactive btn-interactive-nav-right"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-gray-400 mb-1">
              <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Пустые ячейки в начале месяца */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square h-auto min-h-[36px]"></div>
              ))}

              {/* Ячейки дней месяца */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = getFormattedDate(dayNum);
                const hasWorkout = workoutSessions.some(s => s.date === dateStr);
                const isToday = dateStr === todayStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDayClick(dateStr)}
                    className={`aspect-square h-auto min-h-[36px] py-1 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer border text-xs font-semibold ${
                      hasWorkout 
                        ? 'bg-gym-accent text-white border-gym-accent shadow-sm shadow-blue-500/10' 
                        : 'bg-white/50 hover:bg-white text-gray-700 border-gym-border/40'
                    } ${isToday ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}`}
                  >
                    <span>{dayNum}</span>
                    {hasWorkout && (
                      <span className="absolute bottom-1 w-1 h-1 bg-white rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="text-[10px] text-gray-400 flex gap-4 pt-2 border-t border-gym-border/30">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-gym-accent rounded-md inline-block"></span> Тренировка</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-white border border-gym-border/40 rounded-md inline-block"></span> День отдыха</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border-2 border-emerald-500 rounded-md inline-block"></span> Сегодня</span>
            </div>
          </div>

      </div>
    </>
  );
};
