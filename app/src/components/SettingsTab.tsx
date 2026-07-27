import React, { useState, useMemo } from 'react';
import { useGymStore } from '../store/gymStore';
import { BackupPanel } from './settings/BackupPanel';
import { AutoPilotConfigPanel } from './settings/AutoPilotConfigPanel';
import { LexiconPanel } from './settings/LexiconPanel';
import { 
  Info, 
  Activity, 
  Sparkles,
  BookOpen,
  Target,
  Flame,
  Dumbbell,
  Scale,
  Zap
} from './BroskyIcon';
import { 
  calculateLBM, 
  calculateBMR_Mifflin, 
  calculateBMR_Katch, 
  calculateNEAT, 
  calculateEAT, 
  calculateAdaptiveTDEE,
  GOAL_STEPS
} from '../utils/formulas';

export const SettingsTab: React.FC = () => {
  const profile = useGymStore(s => s.profile);
  const updateProfile = useGymStore(s => s.updateProfile);
  const progress = useGymStore(s => s.progress);
  const workoutSessions = useGymStore(s => s.workoutSessions);
  const nutritionLogs = useGymStore(s => s.nutritionLogs);
  const workoutTemplates = useGymStore(s => s.workoutTemplates);
  const personalRecords = useGymStore(s => s.personalRecords);

  const safeGoal = (profile && profile.selectedGoal && profile.selectedGoal in GOAL_STEPS) ? profile.selectedGoal : 'maintenance';
  const safeWeight = profile?.weight || 70;
  const safeFat = profile?.fatPercent || 15;
  const safeHeight = profile?.height || 175;
  const safeAge = profile?.age || 25;
  const safeGender = profile?.gender || 'male';

  // Состояние интерактивного симулятора
  const [simWeight, setSimWeight] = useState<number>(safeWeight);
  const [simFat, setSimFat] = useState<number>(safeFat);
  const [simSteps, setSimSteps] = useState<number>(GOAL_STEPS[safeGoal] || 9000);
  const [simGoal, setSimGoal] = useState<'recomp' | 'maintenance' | 'bulk' | 'cut'>(safeGoal);
  const [simIsWorkout, setSimIsWorkout] = useState<boolean>(true);

  // Подсчет BMR и TDEE на основе текущего профиля для справочного раздела
  const currentLbm = useMemo(() => calculateLBM(safeWeight, safeFat), [safeWeight, safeFat]);
  const currentBmrMifflin = useMemo(() => calculateBMR_Mifflin(safeWeight, safeHeight, safeAge, safeGender), [safeWeight, safeHeight, safeAge, safeGender]);
  const currentBmrKatch = useMemo(() => calculateBMR_Katch(currentLbm), [currentLbm]);
  const currentBmrAverage = useMemo(() => Math.round((currentBmrMifflin + currentBmrKatch) / 2), [currentBmrMifflin, currentBmrKatch]);
  
  // Адаптивный TDEE на основе истории замеров веса и лога калорий
  const adaptiveTdeeResult = useMemo(() => {
    const staticTdee = Math.round((currentBmrAverage + calculateNEAT(GOAL_STEPS[safeGoal] || 9000, safeWeight)) * 1.10);
    return calculateAdaptiveTDEE(progress || [], nutritionLogs || [], staticTdee);
  }, [progress, nutritionLogs, currentBmrAverage, safeGoal, safeWeight]);

  const simDietPlan = useMemo(() => {
    // Считаем БЖУ для симулятора (используем Ainsworth MET формулу для шагов)
    const simulatedNeat = Math.round(calculateNEAT(simSteps, simWeight));
    const simulatedEat = Math.round(calculateEAT(simWeight));
    
    const bmrLbm = calculateLBM(simWeight, simFat);
    const bmrMiff = calculateBMR_Mifflin(simWeight, profile.height, profile.age, profile.gender);
    const bmrKat = calculateBMR_Katch(bmrLbm);
    const bmrAvg = Math.round((bmrMiff + bmrKat) / 2);
    
    const tdeeRest = Math.round((bmrAvg + simulatedNeat) * 1.10);
    const tdeeTrain = Math.round((bmrAvg + simulatedNeat + simulatedEat) * 1.10);
    
    // Бюджет калорий
    let targetCalories: number;
    let proteinRatio: number;
    
    if (simGoal === 'cut') {
      targetCalories = simIsWorkout ? Math.round(tdeeTrain * 0.80) : Math.round(tdeeRest * 0.85);
      proteinRatio = simIsWorkout ? 2.5 : 2.4;
    } else if (simGoal === 'bulk') {
      targetCalories = simIsWorkout ? Math.round(tdeeTrain * 1.10) : Math.round(tdeeRest * 1.05);
      proteinRatio = simIsWorkout ? 2.2 : 2.0;
    } else if (simGoal === 'recomp') {
      targetCalories = simIsWorkout ? Math.round(tdeeTrain * 0.95) : Math.round(tdeeRest * 0.90);
      proteinRatio = simIsWorkout ? 2.2 : 2.0;
    } else {
      targetCalories = simIsWorkout ? tdeeTrain : tdeeRest;
      proteinRatio = simIsWorkout ? 2.2 : 2.0;
    }
    
    // Раскладываем БЖУ
    const proteinGrams = Math.round(simWeight * proteinRatio * 10) / 10;
    const proteinCalories = Math.round(proteinGrams * 4);
    
    const fatPercentVal = simGoal === 'cut' ? 25 : (simIsWorkout ? 25 : 30);
    const fatCalories = Math.round(targetCalories * (fatPercentVal / 100));
    const fatGrams = Math.round((fatCalories / 9) * 10) / 10;
    
    const carbsCalories = Math.round(targetCalories - proteinCalories - fatCalories);
    const carbsGrams = Math.round((carbsCalories / 4) * 10) / 10;

    return {
      calories: targetCalories,
      protein: proteinGrams,
      fat: fatGrams,
      carbs: carbsGrams,
      proteinKcal: proteinCalories,
      fatKcal: fatCalories,
      carbsKcal: carbsCalories,
      bmr: bmrAvg,
      neat: simulatedNeat,
      eat: simulatedEat
    };
  }, [simWeight, simFat, simSteps, simGoal, simIsWorkout, profile.gender, profile.age, profile.height]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
      {/* ЛЕВАЯ КОЛОНКА (Интерактивная физиология) */}
      <div className="xl:col-span-2 space-y-6 sm:space-y-8 min-w-0">
        
        {/* База физиологических расчетов */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 sm:space-y-6 border border-white/60">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2.5 text-gym-accent font-display">
            <Info size={20} className="flex-shrink-0" />
            <span>Как рассчитывается ваш рацион?</span>
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* BMR */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl space-y-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-2 text-xs sm:text-sm">
                <span className="w-2 h-2 rounded-full bg-gym-accent flex-shrink-0"></span>
                <span>1. Базовый обмен веществ (BMR)</span>
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Энергия, сжигаемая телом в состоянии полного покоя. Считается как среднее арифметическое формул Миффлина (для массы) и Кэтча-МакАрдла (для чистых мышц).
              </p>
              <div className="bg-gray-100/70 p-3 sm:p-3.5 rounded-xl text-xs space-y-2 font-medium text-gray-700">
                <div className="flex justify-between items-center gap-2 min-w-0">
                  <span className="truncate">Сухая масса тела (ЧМТ):</span>
                  <span className="font-bold text-gray-900 flex-shrink-0">{currentLbm.toFixed(1)} кг</span>
                </div>
                <div className="flex justify-between items-center gap-2 min-w-0">
                  <span className="truncate">Формула Mifflin-St Jeor:</span>
                  <span className="font-bold text-gray-950 flex-shrink-0">{currentBmrMifflin} ккал</span>
                </div>
                <div className="flex justify-between items-center gap-2 min-w-0">
                  <span className="truncate">Формула Katch-McArdle:</span>
                  <span className="font-bold text-gray-950 flex-shrink-0">{currentBmrKatch} ккал</span>
                </div>
                <div className="border-t border-gym-border/60 my-1"></div>
                <div className="flex justify-between items-center gap-2 text-gym-accent font-bold min-w-0">
                  <span className="truncate">Ваш BMR (средний):</span>
                  <span className="flex-shrink-0 text-sm">{currentBmrAverage} ккал</span>
                </div>
              </div>
            </div>

            {/* Расход за сутки (TDEE) */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl space-y-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-2 text-xs sm:text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                <span>2. Дополнительная активность</span>
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Ваша внетренировочная активность (NEAT) с шагов по стандарту MET и средний расход на одну силовую тренировку (EAT).
              </p>
              <div className="bg-gray-100/70 p-3 sm:p-3.5 rounded-xl text-xs space-y-2 font-medium text-gray-700">
                <div className="flex justify-between items-center gap-2 min-w-0">
                  <span className="truncate">Шаги ({GOAL_STEPS[safeGoal] || 9000}):</span>
                  <span className="font-bold text-gray-900 flex-shrink-0">+{Math.round(calculateNEAT(GOAL_STEPS[safeGoal] || 9000, safeWeight))} ккал</span>
                </div>
                <div className="flex justify-between items-center gap-2 min-w-0">
                  <span className="truncate">Силовая тренировка:</span>
                  <span className="font-bold text-gray-900 flex-shrink-0">+{Math.round(calculateEAT(safeWeight))} ккал</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic leading-normal border-t border-gym-border/40 pt-1.5">
                  * Энергорасход шагов автоматически масштабируется при изменении веса атлета.
                </p>
              </div>
            </div>

            {/* Адаптивный TDEE (Adaptive Expenditure Engine) */}
            <div className="col-span-1 lg:col-span-2 glass-card p-4 sm:p-5 rounded-2xl space-y-3.5 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-white border border-gym-accent/25">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 text-xs sm:text-sm">
                  <Sparkles size={16} className="text-gym-accent flex-shrink-0" />
                  <span className="break-words">Динамический Адаптивный TDEE (Adaptive Expenditure Engine)</span>
                </h4>
                <span className={`text-[10px] sm:text-[11px] font-extrabold px-2.5 py-1 rounded-full border shadow-2xs flex-shrink-0 self-start sm:self-auto ${
                  adaptiveTdeeResult.confidenceLevel === 'high'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : adaptiveTdeeResult.confidenceLevel === 'moderate'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  {adaptiveTdeeResult.confidenceLabel}
                </span>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Рассчитывает ваш реальный метаболический расход энергии (MacroFactor EMA модель) на основе ежедневных замеров массы тела и залогированного питания за последние 14–30 дней.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white/90 p-3 rounded-xl border border-gym-border/60 text-center space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Реальный TDEE</span>
                  <span className="text-base sm:text-lg font-black text-gym-accent font-display block">
                    {adaptiveTdeeResult.adaptiveTDEE} ккал/день
                  </span>
                  <span className="text-[10px] text-gray-400 block font-medium">
                    {adaptiveTdeeResult.differenceFromStatic >= 0 ? `+${adaptiveTdeeResult.differenceFromStatic}` : adaptiveTdeeResult.differenceFromStatic} ккал от формулы
                  </span>
                </div>

                <div className="bg-white/90 p-3 rounded-xl border border-gym-border/60 text-center space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Среднее питание</span>
                  <span className="text-base sm:text-lg font-black text-gray-800 font-display block">
                    {adaptiveTdeeResult.avgDailyCalories > 0 ? `${adaptiveTdeeResult.avgDailyCalories} ккал` : '—'}
                  </span>
                  <span className="text-[10px] text-gray-400 block font-medium">в день по логу</span>
                </div>

                <div className="bg-white/90 p-3 rounded-xl border border-gym-border/60 text-center space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Тренд веса</span>
                  <span className="text-base sm:text-lg font-black text-gray-800 font-display block">
                    {adaptiveTdeeResult.weightChangePerWeekKg > 0 ? `+${adaptiveTdeeResult.weightChangePerWeekKg}` : adaptiveTdeeResult.weightChangePerWeekKg} кг/нед
                  </span>
                  <span className="text-[10px] text-gray-400 block font-medium">скорость динамики</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Режимы и шаблоны питания (КБЖУ) */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 sm:space-y-6 border border-white/60">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2.5 text-gym-accent font-display">
            <BookOpen size={20} className="flex-shrink-0" />
            <span>Справочник режимов и шаблонов КБЖУ</span>
          </h3>
          
          <div className="space-y-4 text-xs leading-relaxed text-gray-600">
            <p>
              В приложении Brosky Gym вы можете управлять посуточным рационом с помощью гибких пресетов. Это позволяет отходить от стандартных формул при нестандартных днях или при следовании индивидуальным указаниям тренера.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Автоматический расчет */}
              <div className="bg-gray-100/60 p-3.5 sm:p-4 rounded-xl space-y-1.5 border border-gym-border/50">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-gym-accent flex-shrink-0"></span>
                  <span>Авто (Расчет по умолчанию)</span>
                </h4>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                  Базовый динамический режим. Формулы Mifflin-St Jeor и Katch-McArdle вычисляют ваш TDEE. В тренировочные дни калорийность автоматически увеличивается на основе выполненного силового объема (поднятого тоннажа).
                </p>
              </div>

              {/* Углеводный рефид */}
              <div className="bg-gray-100/60 p-3.5 sm:p-4 rounded-xl space-y-1.5 border border-gym-border/50">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 flex-shrink-0"></span>
                  <span>Углеводный рефид (Refeed)</span>
                </h4>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                  Динамический формульный пресет для загрузочных дней. Увеличивает калорийность на +10% от текущего TDEE, максимизирует белки (2.2 г/кг) и урезает жиры до 15% в пользу углеводов для восполнения гликогена.
                </p>
              </div>

              {/* Кето-день */}
              <div className="bg-gray-100/60 p-3.5 sm:p-4 rounded-xl space-y-1.5 border border-gym-border/50">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 flex-shrink-0"></span>
                  <span>Кето-день (LCHF)</span>
                </h4>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                  Фиксированный низкоуглеводный шаблон. Устанавливает строгие лимиты: 20г углеводов, 130г белков и 120г жиров (примерно 2000 ккал). Оптимален для стимуляции липолиза и кето-адаптации.
                </p>
              </div>

              {/* Разгрузочный день */}
              <div className="bg-gray-100/60 p-3.5 sm:p-4 rounded-xl space-y-1.5 border border-gym-border/50">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0"></span>
                  <span>Разгрузочный день (Fast)</span>
                </h4>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                  Фиксированный низкокалорийный рацион. Устанавливает фиксированные 1300 ккал (100г белков, 40г жиров, 135г углеводов) для разгрузки ЖКТ, оздоровления организма и преодоления плато.
                </p>
              </div>
            </div>

            <div className="bg-blue-50/60 border border-blue-100 p-3.5 sm:p-4 rounded-xl space-y-1.5">
              <h4 className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-600 flex-shrink-0" />
                <span>Кастомные шаблоны пользователя</span>
              </h4>
              <p className="text-[11px] sm:text-xs text-blue-950/80 leading-relaxed">
                Вы можете создавать собственные пресеты КБЖУ любой сложности во вкладке питания. Конструктор поддерживает фиксированный ввод (для планов от тренера) и формульный расчет (задающий процент отклонения от TDEE и долю белков/жиров на кг веса).
              </p>
            </div>

            <div className="border-t border-gym-border/40 pt-5 space-y-4">
              <h4 className="font-bold text-gray-800 text-xs flex items-center gap-2 uppercase tracking-wider">
                <Target size={15} className="text-gym-accent flex-shrink-0" />
                <span>Спортивные цели атлета (Базовый авто-расчет)</span>
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-500">
                При выборе одной из четырех целей в профиле, приложение автоматически настраивает дефицит/профицит калорий и макронутриенты для дней тренировок и отдыха:
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
                {([
                  {
                    id: 'recomp',
                    title: 'Рекомпозиция (Recomp)',
                    steps: '11 000 шагов',
                    IconComponent: Zap,
                    bgColor: 'bg-purple-50/60',
                    borderInactive: 'border-purple-100/80 hover:border-purple-300',
                    borderActive: 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/20 shadow-md shadow-purple-500/10 scale-[1.01]',
                    titleColor: 'text-purple-900',
                    badgeBg: 'bg-purple-100 text-purple-700',
                    tTrain: '-5% от TDEE, белки 2.2 г/кг, жиры 25%',
                    tRest: '-10% от TDEE, белки 2.0 г/кг, жиры 30%',
                    desc: 'Оптимальна для одновременного сжигания жира и роста мышц.'
                  },
                  {
                    id: 'maintenance',
                    title: 'Поддержание (Maintenance)',
                    steps: '9 000 шагов',
                    IconComponent: Scale,
                    bgColor: 'bg-blue-50/60',
                    borderInactive: 'border-blue-100/80 hover:border-blue-300',
                    borderActive: 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 shadow-md shadow-blue-500/10 scale-[1.01]',
                    titleColor: 'text-blue-900',
                    badgeBg: 'bg-blue-100 text-blue-700',
                    tTrain: '100% TDEE (в балансе), белки 2.2 г/кг, жиры 25%',
                    tRest: '100% TDEE (в балансе), белки 2.0 г/кг, жиры 30%',
                    desc: 'Используется для удержания веса и стабилизации формы.'
                  },
                  {
                    id: 'bulk',
                    title: 'Набор массы (Bulk)',
                    steps: '7 000 шагов',
                    IconComponent: Dumbbell,
                    bgColor: 'bg-emerald-50/60',
                    borderInactive: 'border-emerald-100/80 hover:border-emerald-300',
                    borderActive: 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10 scale-[1.01]',
                    titleColor: 'text-emerald-900',
                    badgeBg: 'bg-emerald-100 text-emerald-700',
                    tTrain: '+10% к TDEE (профицит), белки 2.2 г/кг, жиры 25%',
                    tRest: '+5% к TDEE (профицит), белки 2.0 г/кг, жиры 30%',
                    desc: 'Для максимального набора сухой мышечной массы с тяжелыми весами.'
                  },
                  {
                    id: 'cut',
                    title: 'Сушка (Cut)',
                    steps: '13 000 шагов',
                    IconComponent: Flame,
                    bgColor: 'bg-rose-50/60',
                    borderInactive: 'border-rose-100/80 hover:border-rose-300',
                    borderActive: 'border-rose-500 bg-rose-50 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/10 scale-[1.01]',
                    titleColor: 'text-rose-900',
                    badgeBg: 'bg-rose-100 text-rose-700',
                    tTrain: '-20% от TDEE (дефицит), белки 2.5 г/кг, жиры 25%',
                    tRest: '-15% от TDEE (дефицит), белки 2.4 г/кг, жиры 30%',
                    desc: 'Для эффективного жиросжигания с максимальным сохранением мышц.'
                  }
                ] as const).map(g => {
                  const isActive = profile.selectedGoal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => updateProfile({ selectedGoal: g.id })}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 text-left cursor-pointer space-y-2 ${
                        isActive ? g.borderActive : `${g.bgColor} ${g.borderInactive} hover:scale-[1.008]`
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 text-xs font-bold">
                        <span className={`flex items-center gap-1.5 ${g.titleColor} truncate`}>
                          <g.IconComponent size={16} className="flex-shrink-0" />
                          <span>{g.title}</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isActive && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-white text-gray-900 px-1.5 py-0.5 rounded-md border border-gray-200 shadow-2xs flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Активна
                            </span>
                          )}
                          <span className={`font-mono text-[9px] ${g.badgeBg} px-1.5 py-0.5 rounded-md font-extrabold`}>
                            {g.steps}
                          </span>
                        </div>
                      </div>
                      <ul className="list-disc pl-4 text-[11px] sm:text-xs text-gray-700 space-y-1 font-medium">
                        <li><strong>Тренировка:</strong> {g.tTrain}</li>
                        <li><strong>Отдых:</strong> {g.tRest}</li>
                        <li className="text-gray-500 italic pt-0.5">{g.desc}</li>
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Симулятор изменения формы */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 sm:space-y-6 border border-white/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gym-border/40">
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2.5 text-gym-accent font-display">
              <Activity size={20} className="flex-shrink-0" />
              <span>Симулятор изменения формы</span>
            </h3>
            
            {/* Переключатель режима дня */}
            <div className="flex bg-gray-100/90 p-1 rounded-xl text-xs font-bold self-start">
              <button 
                type="button"
                onClick={() => setSimIsWorkout(true)}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${simIsWorkout ? 'bg-white shadow-xs text-gym-accent' : 'text-gray-500 hover:text-gray-800'}`}
              >
                День тренировки
              </button>
              <button 
                type="button"
                onClick={() => setSimIsWorkout(false)}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${!simIsWorkout ? 'bg-white shadow-xs text-gym-accent' : 'text-gray-500 hover:text-gray-800'}`}
              >
                День отдыха
              </button>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 leading-relaxed">
            Подвигайте ползунки, чтобы смоделировать изменения веса, активности или спортивной цели и мгновенно увидеть прогнозируемые нормы КБЖУ для будущей формы. Данные профиля при этом не изменятся.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            {/* Инпуты симулятора */}
            <div className="space-y-4">
              {/* Вес */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>Моделируемый вес</span>
                  <span className="text-gym-accent font-extrabold">{simWeight} кг</span>
                </div>
                <label htmlFor="simWeightRange" className="sr-only">Моделируемый вес</label>
                <input
                  id="simWeightRange"
                  type="range"
                  min="45"
                  max="140"
                  step="1"
                  value={simWeight}
                  onChange={(e) => setSimWeight(Number(e.target.value))}
                  className="w-full accent-gym-accent cursor-pointer"
                />
              </div>

              {/* Процент жира */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>Процент жира в теле</span>
                  <span className="text-gym-accent font-extrabold">{simFat} %</span>
                </div>
                <label htmlFor="simFatRange" className="sr-only">Процент жира в теле</label>
                <input
                  id="simFatRange"
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={simFat}
                  onChange={(e) => setSimFat(Number(e.target.value))}
                  className="w-full accent-gym-accent cursor-pointer"
                />
              </div>

              {/* Шаги */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>Внетренировочные шаги</span>
                  <span className="text-gym-accent font-extrabold">{simSteps.toLocaleString()} шагов</span>
                </div>
                <label htmlFor="simStepsRange" className="sr-only">Внетренировочные шаги</label>
                <input
                  id="simStepsRange"
                  type="range"
                  min="2000"
                  max="20000"
                  step="500"
                  value={simSteps}
                  onChange={(e) => setSimSteps(Number(e.target.value))}
                  className="w-full accent-gym-accent cursor-pointer"
                />
              </div>

              {/* Цель */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700">Моделируемая цель</span>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Интерактивный свитчер</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  {([
                    { id: 'cut', label: 'Сушка', delta: '-20% ккал', IconComponent: Flame, activeStyle: 'border-rose-500 bg-rose-50/80 text-rose-700 shadow-md shadow-rose-500/10 ring-2 ring-rose-500/20' },
                    { id: 'recomp', label: 'Рекомпозиция', delta: '-5% ккал', IconComponent: Zap, activeStyle: 'border-purple-500 bg-purple-50/80 text-purple-700 shadow-md shadow-purple-500/10 ring-2 ring-purple-500/20' },
                    { id: 'maintenance', label: 'Поддержание', delta: '100% TDEE', IconComponent: Scale, activeStyle: 'border-blue-500 bg-blue-50/80 text-blue-700 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20' },
                    { id: 'bulk', label: 'Набор', delta: '+10% ккал', IconComponent: Dumbbell, activeStyle: 'border-emerald-500 bg-emerald-50/80 text-emerald-700 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20' }
                  ] as const).map(g => {
                    const isActive = simGoal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSimGoal(g.id)}
                        className={`relative p-3 border rounded-xl transition-all duration-200 text-left cursor-pointer flex flex-col justify-between overflow-hidden ${
                          isActive 
                            ? `${g.activeStyle} scale-[1.02]` 
                            : 'border-gym-border bg-white/70 hover:bg-white hover:border-gray-300 text-gray-700 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full min-w-0">
                          <span className="font-extrabold text-xs flex items-center gap-1.5 truncate">
                            <g.IconComponent size={15} className="flex-shrink-0" />
                            <span className="truncate">{g.label}</span>
                          </span>
                          {isActive && (
                            <span className="h-2 w-2 rounded-full bg-current animate-pulse flex-shrink-0"></span>
                          )}
                        </div>
                        <span className={`text-[10px] font-mono font-bold mt-1.5 block ${isActive ? 'opacity-90' : 'text-gray-400'}`}>
                          {g.delta}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Вывод результатов симулятора */}
            <div className="bg-gradient-to-br from-white to-gray-50/90 border border-gym-border/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Целевой рацион</span>
                <span className="text-2xl sm:text-3xl font-black font-display text-gray-900 leading-none">
                  {simDietPlan.calories} <span className="text-xs sm:text-sm font-semibold text-gray-500">ккал</span>
                </span>
              </div>

              {/* Полосы БЖУ */}
              <div className="w-full space-y-3 pt-2 text-xs font-bold text-gray-700">
                {/* Белки */}
                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600 flex-wrap gap-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span> Белки
                    </span>
                    <span>{simDietPlan.protein}г <span className="text-[10px] text-gray-400 font-normal">({simDietPlan.proteinKcal} ккал)</span></span>
                  </div>
                  <div className="w-full bg-gray-200/80 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, (simDietPlan.proteinKcal / simDietPlan.calories) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Жиры */}
                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600 flex-wrap gap-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Жиры
                    </span>
                    <span>{simDietPlan.fat}г <span className="text-[10px] text-gray-400 font-normal">({simDietPlan.fatKcal} ккал)</span></span>
                  </div>
                  <div className="w-full bg-gray-200/80 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-yellow-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, (simDietPlan.fatKcal / simDietPlan.calories) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Углеводы */}
                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600 flex-wrap gap-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Углеводы
                    </span>
                    <span>{simDietPlan.carbs}г <span className="text-[10px] text-gray-400 font-normal">({simDietPlan.carbsKcal} ккал)</span></span>
                  </div>
                  <div className="w-full bg-gray-200/80 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, (simDietPlan.carbsKcal / simDietPlan.calories) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Мини-сводка по метаболизму */}
              <div className="w-full border-t border-gym-border/50 pt-3.5 flex justify-around text-[10px] sm:text-xs font-bold text-gray-500">
                <div>
                  <span className="block text-gray-900 text-xs sm:text-sm font-black">{simDietPlan.bmr}</span>
                  Базовый BMR
                </div>
                <div>
                  <span className="block text-gray-900 text-xs sm:text-sm font-black">+{simDietPlan.neat}</span>
                  Шаги NEAT
                </div>
                {simIsWorkout && (
                  <div>
                    <span className="block text-gray-900 text-xs sm:text-sm font-black">+{simDietPlan.eat}</span>
                    Тренировка
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Анатомический Атлас — Расшифровка цветов ── */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-xl space-y-6 border border-white/60">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2.5 text-gym-accent font-display">
            <BookOpen size={20} className="flex-shrink-0" />
            <span>Анатомический Атлас — расшифровка цветов</span>
          </h3>

          <div className="space-y-6">
            {/* Объем за 7 дней */}
            <div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                Объем за 7 дней (Карта нагрузки)
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80 border border-gym-border/40 min-w-0">
                  <span className="mt-1 w-4 h-4 rounded flex-shrink-0 border border-slate-600" style={{background:'#334155'}}></span>
                  <div className="min-w-0 space-y-0.5">
                    <span className="font-bold text-gray-900 text-xs sm:text-sm block">Покой</span>
                    <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">0 подходов за неделю. Мышца не тренировалась совсем.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-200/40 min-w-0">
                  <span className="mt-1 w-4 h-4 rounded flex-shrink-0 border border-blue-400" style={{background:'#93c5fd'}}></span>
                  <div className="min-w-0 space-y-0.5">
                    <span className="font-bold text-blue-700 text-xs sm:text-sm block">Тонус — MEV (минимальный эффективный объём)</span>
                    <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">Нагрузка есть, но её недостаточно для роста. Только поддержание мышечной массы.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-50/50 border border-violet-200/40 min-w-0">
                  <span className="mt-1 w-4 h-4 rounded flex-shrink-0 border border-violet-500" style={{background:'#8b5cf6'}}></span>
                  <div className="min-w-0 space-y-0.5">
                    <span className="font-bold text-violet-700 text-xs sm:text-sm block">Рост — MAV (максимальный адаптивный объём)</span>
                    <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">Оптимальная зона по д-ру Майку Израэтелю (Renaissance Periodization). Максимальный рост мышц.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-pink-50/50 border border-pink-200/40 min-w-0">
                  <span className="mt-1 w-4 h-4 rounded flex-shrink-0 border border-pink-500" style={{background:'#ec4899'}}></span>
                  <div className="min-w-0 space-y-0.5">
                    <span className="font-bold text-pink-700 text-xs sm:text-sm block">Предел — MRV (максимальный восстанавливаемый объём)</span>
                    <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">Мышца работает на пределе. Рост замедляется, риск накопления усталости. Отслеживай восстановление.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50/50 border border-red-200/40 min-w-0">
                  <span className="mt-1 w-4 h-4 rounded flex-shrink-0 border border-red-500" style={{background:'#ef4444'}}></span>
                  <div className="min-w-0 space-y-0.5">
                    <span className="font-bold text-red-700 text-xs sm:text-sm block">Перегрузка — превышен MRV</span>
                    <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">Объём превышает возможности восстановления. Высокий риск перетренированности. Нужна разгрузка (Deload).</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2.5 pl-1">* Основные мышцы упражнения получают 100% подходов, вспомогательные — 50%.</p>
            </div>

            <div className="border-t border-gym-border/30" />

            {/* Утомляемость мышц */}
            <div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                Утомляемость мышц (Кривая восстановления)
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80 border border-gym-border/40 min-w-0">
                  <span className="mt-1 w-4 h-4 rounded flex-shrink-0 border border-slate-600" style={{background:'#334155'}}></span>
                  <div className="min-w-0 space-y-0.5">
                    <span className="font-bold text-gray-900 text-xs sm:text-sm block">Восстановлена — 0–9%</span>
                    <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">Мышца полностью отдохнула. Отличный момент для тяжелой работы.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50/50 border border-green-200/40 min-w-0">
                  <span className="mt-1 w-4 h-4 rounded flex-shrink-0 border border-green-500" style={{background:'#86efac'}}></span>
                  <div className="min-w-0 space-y-0.5">
                    <span className="font-bold text-green-700 text-xs sm:text-sm block">Готова к работе — 10–39%</span>
                    <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">Лёгкое остаточное утомление. Окно суперкомпенсации открыто — лучший момент для тренировки.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-50/50 border border-yellow-200/40 min-w-0">
                  <span className="mt-1 w-4 h-4 rounded flex-shrink-0 border border-yellow-400" style={{background:'#fef08a'}}></span>
                  <div className="min-w-0 space-y-0.5">
                    <span className="font-bold text-yellow-700 text-xs sm:text-sm block">Восстанавливается — 40–69%</span>
                    <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">Мышца ещё в процессе восстановления. Тяжелая нагрузка нежелательна.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50/50 border border-red-200/40 min-w-0">
                  <span className="mt-1 w-4 h-4 rounded flex-shrink-0 border border-red-400" style={{background:'#fca5a5'}}></span>
                  <div className="min-w-0 space-y-0.5">
                    <span className="font-bold text-red-700 text-xs sm:text-sm block">Утомлена — 70–100%</span>
                    <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">Мышца не восстановилась. Требуется полный отдых от 24 до 48 часов.</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2.5 pl-1">* Расчёт кривой восстановления: до 3 подх. → 24 ч, 4–6 подх. → 48 ч, более 6 подх. → 72 ч.</p>
            </div>

            <div className="border-t border-gym-border/30" />

            {/* Математические алгоритмы и формулы (Реализованные модули) */}
            <div>
              <div className="text-[10px] font-black text-gym-accent uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Sparkles size={14} className="flex-shrink-0" />
                <span>Реализованные математические алгоритмы</span>
              </div>
              <div className="space-y-3">
                {/* 1. RPE / RIR */}
                <div className="p-3.5 sm:p-4 bg-blue-50/40 border border-blue-100/80 rounded-2xl space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 min-w-0">
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">1. Авторегуляция RPE / RIR (Запас повторов)</span>
                    <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-md self-start sm:self-auto max-w-full truncate">
                      1RM = W × (1 + (R + RIR)/30)
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                    Формула Эпли-Тачшерера (*RTS System*). Учитывает субъективный запас повторений (RIR) в каждом подходе. Позволяет точно рассчитывать реальный одноповторный максимум (1RM) без травмоопасной работы до отказа.
                  </p>
                </div>

                {/* 2. EWMA Trend & TDEE */}
                <div className="p-3.5 sm:p-4 bg-indigo-50/40 border border-indigo-100/80 rounded-2xl space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 min-w-0">
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">2. Сглаживание массы EWMA & Адаптивный TDEE</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-md self-start sm:self-auto flex-shrink-0">
                      EWMA (α = 0.25)
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                    Экспоненциально взвешенное скользящее среднее по алгоритму NIH (*Dr. Kevin Hall*). Отфильтровывает водно-солевые скачки веса и рассчитывает физиологический метаболизм (TDEE) за 28-дневный цикл.
                  </p>
                </div>

                {/* 3. Anabolic Ceiling Fallacy */}
                <div className="p-3.5 sm:p-4 bg-amber-50/40 border border-amber-100/80 rounded-2xl space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 min-w-0">
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">3. Снятие лимита усвоения белка</span>
                    <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-100/60 px-2 py-0.5 rounded-md self-start sm:self-auto flex-shrink-0">
                      Trommelen et al. (2024)
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                    Опровергнут лимит в 30г белка за прием пищи. Крупные порции белка (до 100г+) усваиваются полностью и стимулируют анаболизм 12+ часов.
                  </p>
                </div>

                {/* 4. DOMS vs Stimulus Score */}
                <div className="p-3.5 sm:p-4 bg-rose-50/40 border border-rose-100/80 rounded-2xl space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 min-w-0">
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">4. Оценка Стимула & Переосмысление боли (DOMS)</span>
                    <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-md self-start sm:self-auto flex-shrink-0">
                      Schoenfeld & Damas (2025)
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                    Сильная мышечная боль (DOMS) отражает травму фасций, а не стимул роста. Приложение измеряет уровень глубокого пампа для оптимального восстановления.
                  </p>
                </div>

                {/* 5. AI Auto-Pilot Load Predictor */}
                <div className="p-3.5 sm:p-4 bg-emerald-50/40 border border-emerald-100/80 rounded-2xl space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 min-w-0">
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">5. Автопилот Прогрессии Нагрузок</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-md self-start sm:self-auto flex-shrink-0">
                      Neural Load Matrix
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                    Многофакторный алгоритм расчёта рабочих весов. Сводит в единую матрицу прошлый RIR, отклик DOMS-боли, тренд массы EWMA и закладывает безопасный шаг веса.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 9. ГЛОССАРИЙ И СПРАВОЧНИК ТЕРМИНОВ (RIR, RPE, TDEE, BMR, MEV, MRV и др.) */}
          <LexiconPanel />
        </div>
      </div>

      {/* ПРАВАЯ КОЛОНКА (Настройки, Данные, Бэкап и Статистика) */}
      <div className="space-y-6 min-w-0">
        <AutoPilotConfigPanel />
        <BackupPanel />
        
        {/* Статистика базы данных */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 border border-white/60">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2.5 text-emerald-600 font-display">
            <Sparkles size={18} className="flex-shrink-0" />
            <span>Ваша статистика</span>
          </h3>

          <div className="space-y-2.5 text-xs font-semibold text-gray-700">
            {/* Проведенные тренировки */}
            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-gym-border/40 min-w-0 gap-2">
              <span className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span className="truncate">Тренировочных сессий</span>
              </span>
              <span className="text-gray-950 font-bold bg-white px-2 py-1 rounded-lg border border-gym-border shadow-2xs flex-shrink-0">{workoutSessions.length}</span>
            </div>

            {/* Логи питания */}
            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-gym-border/40 min-w-0 gap-2">
              <span className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>
                <span className="truncate">Дней логов питания</span>
              </span>
              <span className="text-gray-950 font-bold bg-white px-2 py-1 rounded-lg border border-gym-border shadow-2xs flex-shrink-0">{nutritionLogs.length}</span>
            </div>

            {/* Замеры */}
            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-gym-border/40 min-w-0 gap-2">
              <span className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"></span>
                <span className="truncate">Внесено замеров веса</span>
              </span>
              <span className="text-gray-950 font-bold bg-white px-2 py-1 rounded-lg border border-gym-border shadow-2xs flex-shrink-0">{progress.length}</span>
            </div>

            {/* Шаблоны */}
            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-gym-border/40 min-w-0 gap-2">
              <span className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></span>
                <span className="truncate">Шаблонов тренировок</span>
              </span>
              <span className="text-gray-950 font-bold bg-white px-2 py-1 rounded-lg border border-gym-border shadow-2xs flex-shrink-0">{workoutTemplates.length}</span>
            </div>

            {/* Рекорды */}
            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-gym-border/40 min-w-0 gap-2">
              <span className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                <span className="truncate">Личных силовых рекордов</span>
              </span>
              <span className="text-gray-950 font-bold bg-white px-2 py-1 rounded-lg border border-gym-border shadow-2xs flex-shrink-0">{personalRecords.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
