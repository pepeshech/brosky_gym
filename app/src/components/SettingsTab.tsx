import React, { useState, useMemo } from 'react';
import { useGymStore } from '../store/gymStore';
import { BackupPanel } from './settings/BackupPanel';
import { DevicePairing } from './settings/DevicePairing';
import { 
  Info, 
  Activity, 
  Sparkles,
  BookOpen,
  Target
} from './BroskyIcon';
import { 
  calculateLBM, 
  calculateBMR_Mifflin, 
  calculateBMR_Katch, 
  calculateNEAT, 
  calculateEAT, 
  GOAL_STEPS
} from '../utils/formulas';

export const SettingsTab: React.FC = () => {
  const profile = useGymStore(s => s.profile);
  const progress = useGymStore(s => s.progress);
  const workoutSessions = useGymStore(s => s.workoutSessions);
  const nutritionLogs = useGymStore(s => s.nutritionLogs);
  const workoutTemplates = useGymStore(s => s.workoutTemplates);
  const personalRecords = useGymStore(s => s.personalRecords);

  // Состояние интерактивного симулятора
  const [simWeight, setSimWeight] = useState<number>(profile.weight);
  const [simFat, setSimFat] = useState<number>(profile.fatPercent);
  const [simSteps, setSimSteps] = useState<number>(GOAL_STEPS[profile.selectedGoal]);
  const [simGoal, setSimGoal] = useState<'recomp' | 'maintenance' | 'bulk' | 'cut'>(profile.selectedGoal);
  const [simIsWorkout, setSimIsWorkout] = useState<boolean>(true);

  // Подсчет BMR и TDEE на основе текущего профиля для справочного раздела
  const currentLbm = useMemo(() => calculateLBM(profile.weight, profile.fatPercent), [profile.weight, profile.fatPercent]);
  const currentBmrMifflin = useMemo(() => calculateBMR_Mifflin(profile.weight, profile.height, profile.age, profile.gender), [profile.weight, profile.height, profile.age, profile.gender]);
  const currentBmrKatch = useMemo(() => calculateBMR_Katch(currentLbm), [currentLbm]);
  const currentBmrAverage = useMemo(() => Math.round((currentBmrMifflin + currentBmrKatch) / 2), [currentBmrMifflin, currentBmrKatch]);
  
  // Расчет TDEE и диеты для симулятора в реальном времени
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
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* ЛЕВАЯ КОЛОНКА (Интерактивная физиология) */}
      <div className="xl:col-span-2 space-y-8">
        
        {/* База физиологических расчетов */}
        <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gym-accent font-display">
            <Info size={20} />
            Как рассчитывается ваш рацион?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BMR */}
            <div className="glass-card p-5 rounded-xl space-y-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-1.5 text-sm">
                <span className="w-2 h-2 rounded-full bg-gym-accent"></span>
                1. Базовый обмен веществ (BMR)
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Энергия, сжигаемая телом в состоянии полного покоя. Считается как среднее арифметическое формул Миффлина (для массы) и Кэтча-МакАрдла (для чистых мышц).
              </p>
              <div className="bg-gray-100/60 p-3 rounded-lg text-xs space-y-1.5 font-medium text-gray-700">
                <div className="grid gap-x-3" style={{gridTemplateColumns:'1fr auto'}}>
                  <span>Сухая масса тела (ЧМТ):</span>
                  <span className="font-bold text-gray-900 text-right whitespace-nowrap">{currentLbm.toFixed(1)} кг</span>
                </div>
                <div className="grid gap-x-3" style={{gridTemplateColumns:'1fr auto'}}>
                  <span>Формула Mifflin-St Jeor:</span>
                  <span className="font-bold text-gray-950 text-right whitespace-nowrap">{currentBmrMifflin} ккал</span>
                </div>
                <div className="grid gap-x-3" style={{gridTemplateColumns:'1fr auto'}}>
                  <span>Формула Katch-McArdle:</span>
                  <span className="font-bold text-gray-950 text-right whitespace-nowrap">{currentBmrKatch} ккал</span>
                </div>
                <div className="border-t border-gym-border/60 my-1"></div>
                <div className="grid gap-x-3 text-gym-accent font-bold" style={{gridTemplateColumns:'1fr auto'}}>
                  <span>Ваш BMR (средний):</span>
                  <span className="text-right whitespace-nowrap">{currentBmrAverage} ккал</span>
                </div>
              </div>
            </div>

            {/* Расход за сутки (TDEE) */}
            <div className="glass-card p-5 rounded-xl space-y-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-1.5 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                2. Дополнительная активность
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Ваша внетренировочная активность (NEAT) с шагов по стандарту MET и средний расход на одну силовую тренировку (EAT).
              </p>
              <div className="bg-gray-100/60 p-3 rounded-lg text-xs space-y-1.5 font-medium text-gray-700">
                <div className="grid gap-x-3" style={{gridTemplateColumns:'1fr auto'}}>
                  <span>Шаги ({GOAL_STEPS[profile.selectedGoal]}):</span>
                  <span className="font-bold text-gray-900 text-right whitespace-nowrap">+{Math.round(calculateNEAT(GOAL_STEPS[profile.selectedGoal], profile.weight))} ккал</span>
                </div>
                <div className="grid gap-x-3" style={{gridTemplateColumns:'1fr auto'}}>
                  <span>Силовая тренировка:</span>
                  <span className="font-bold text-gray-900 text-right whitespace-nowrap">+{Math.round(calculateEAT(profile.weight))} ккал</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic leading-tight">
                  * Энергорасход шагов автоматически масштабируется при изменении веса атлета.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Режимы и шаблоны питания (КБЖУ) */}
        <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gym-accent font-display">
            <BookOpen size={20} />
            Справочник режимов и шаблонов КБЖУ
          </h3>
          
          <div className="space-y-4 text-xs leading-relaxed text-gray-600">
            <p>
              В приложении Brosky Gym вы можете управлять посуточным рационом с помощью гибких пресетов. Это позволяет отходить от стандартных формул при нестандартных днях или при следовании индивидуальным указаниям тренера.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Автоматический расчет */}
              <div className="bg-gray-100/50 p-4 rounded-xl space-y-2 border border-gym-border/40">
                <h4 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-gym-accent"></span>
                  Авто (Расчет по умолчанию)
                </h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Базовый динамический режим. Формулы Mifflin-St Jeor и Katch-McArdle вычисляют ваш TDEE. В тренировочные дни калорийность автоматически увеличивается на основе выполненного силового объема (поднятого тоннажа).
                </p>
              </div>

              {/* Углеводный рефид */}
              <div className="bg-gray-100/50 p-4 rounded-xl space-y-2 border border-gym-border/40">
                <h4 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                  Углеводный рефид (Refeed)
                </h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Динамический формульный пресет для загрузочных дней. Увеличивает калорийность на +10% от текущего TDEE, максимизирует белки (2.2 г/кг) и урезает жиры до 15% в пользу углеводов для восполнения запасов гликогена.
                </p>
              </div>

              {/* Кето-день */}
              <div className="bg-gray-100/50 p-4 rounded-xl space-y-2 border border-gym-border/40">
                <h4 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  Кето-день (LCHF)
                </h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Фиксированный низкоуглеводный шаблон. Устанавливает строгие лимиты: 20г углеводов, 130г белков и 120г жиров (примерно 2000 ккал). Оптимален для стимуляции липолиза и кето-адаптации.
                </p>
              </div>

              {/* Разгрузочный день */}
              <div className="bg-gray-100/50 p-4 rounded-xl space-y-2 border border-gym-border/40">
                <h4 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Разгрузочный день (Fast)
                </h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Фиксированный низкокалорийный рацион. Устанавливает фиксированные 1300 ккал (100г белков, 40г жиров, 135г углеводов) для разгрузки ЖКТ, оздоровления организма и быстрого преодоления плато в снижении веса.
                </p>
              </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-1.5">
              <h4 className="font-bold text-indigo-900 text-xs flex items-center gap-1">
                <Sparkles size={14} className="text-indigo-600" />
                Кастомные шаблоны пользователя
              </h4>
              <p className="text-[11px] text-indigo-950/80 leading-normal">
                Вы можете создавать собственные пресеты КБЖУ любой сложности во вкладке питания. Конструктор поддерживает фиксированный ввод (для планов от тренера) и формульный расчет (задающий процент отклонения от TDEE и долю белков/жиров на кг веса).
              </p>
            </div>

            <div className="border-t border-gym-border/40 pt-5 space-y-4">
              <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Target size={14} className="text-gym-accent" /> Спортивные цели атлета (Базовый авто-расчет)
              </h4>
              <p className="text-[11px] text-gray-500">
                При выборе одной из четырех целей в профиле, приложение автоматически настраивает дефицит/профицит калорий и макронутриенты для дней тренировок и отдыха:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Рекомпозиция */}
                <div className="bg-purple-50/40 p-3.5 rounded-xl border border-purple-100/50 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-purple-900">
                    <span>Рекомпозиция (Recomp)</span>
                    <span className="font-mono text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md">11 000 шагов</span>
                  </div>
                  <ul className="list-disc pl-4 text-[10px] text-purple-950/80 space-y-0.5">
                    <li><strong>Тренировка:</strong> -5% от TDEE, белки 2.2 г/кг, жиры 25%</li>
                    <li><strong>Отдых:</strong> -10% от TDEE, белки 2.0 г/кг, жиры 30%</li>
                    <li>Оптимальна для одновременного сжигания жира и роста мышц.</li>
                  </ul>
                </div>

                {/* Поддержание */}
                <div className="bg-blue-50/40 p-3.5 rounded-xl border border-blue-100/50 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-blue-900">
                    <span>Поддержание (Maintenance)</span>
                    <span className="font-mono text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">9 000 шагов</span>
                  </div>
                  <ul className="list-disc pl-4 text-[10px] text-blue-950/80 space-y-0.5">
                    <li><strong>Тренировка:</strong> 100% TDEE (в балансе), белки 2.2 г/кг, жиры 25%</li>
                    <li><strong>Отдых:</strong> 100% TDEE (в балансе), белки 2.0 г/кг, жиры 30%</li>
                    <li>Используется для удержания веса и стабилизации формы.</li>
                  </ul>
                </div>

                {/* Набор массы */}
                <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100/50 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-900">
                    <span>Набор массы (Bulk)</span>
                    <span className="font-mono text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">7 000 шагов</span>
                  </div>
                  <ul className="list-disc pl-4 text-[10px] text-emerald-950/80 space-y-0.5">
                    <li><strong>Тренировка:</strong> +10% к TDEE (профицит), белки 2.2 г/кг, жиры 25%</li>
                    <li><strong>Отдых:</strong> +5% к TDEE (профицит), белки 2.0 г/кг, жиры 30%</li>
                    <li>Для максимального набора сухой мышечной массы с тяжелыми весами.</li>
                  </ul>
                </div>

                {/* Сушка */}
                <div className="bg-rose-50/40 p-3.5 rounded-xl border border-rose-100/50 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-rose-900">
                    <span>Сушка (Cut)</span>
                    <span className="font-mono text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md">13 000 шагов</span>
                  </div>
                  <ul className="list-disc pl-4 text-[10px] text-rose-950/80 space-y-0.5">
                    <li><strong>Тренировка:</strong> -20% от TDEE (дефицит), белки 2.5 г/кг, жиры 25%</li>
                    <li><strong>Отдых:</strong> -15% от TDEE (дефицит), белки 2.4 г/кг, жиры 30%</li>
                    <li>Для эффективного жиросжигания с максимальным сохранением мышц.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Симулятор изменения формы */}
        <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-indigo-600 font-display">
              <Activity size={20} />
              Симулятор изменения формы
            </h3>
            
            {/* Переключатель режима дня */}
            <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-bold self-start">
              <button 
                onClick={() => setSimIsWorkout(true)}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${simIsWorkout ? 'bg-white shadow-xs text-gym-accent' : 'text-gray-500 hover:text-gray-800'}`}
              >
                День тренировки
              </button>
              <button 
                onClick={() => setSimIsWorkout(false)}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${!simIsWorkout ? 'bg-white shadow-xs text-gym-accent' : 'text-gray-500 hover:text-gray-800'}`}
              >
                День отдыха
              </button>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 leading-relaxed">
            Подвигайте ползунки, чтобы смоделировать изменения веса, активности или спортивной цели и мгновенно увидеть прогнозируемые нормы КБЖУ для будущей формы. Данные профиля при этом не изменятся.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Инпуты симулятора */}
            <div className="space-y-4">
              {/* Вес */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>Моделируемый вес</span>
                  <span className="text-gym-accent">{simWeight} кг</span>
                </div>
                <input 
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
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>Процент жира в теле</span>
                  <span className="text-gym-accent">{simFat} %</span>
                </div>
                <input 
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
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>Внетренировочные шаги</span>
                  <span className="text-gym-accent">{simSteps.toLocaleString()} шагов</span>
                </div>
                <input 
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
                <span className="text-xs font-bold text-gray-700 block">Моделируемая цель</span>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  {([
                    { id: 'cut', label: 'Сушка (-15% калорий)' },
                    { id: 'recomp', label: 'Рекомпозиция' },
                    { id: 'maintenance', label: 'Поддержание' },
                    { id: 'bulk', label: 'Набор (+10% калорий)' }
                  ] as const).map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSimGoal(g.id)}
                      className={`p-2 border rounded-xl transition-all text-left cursor-pointer ${simGoal === g.id ? 'border-gym-accent bg-gym-accent/5 text-gym-accent' : 'border-gym-border hover:bg-gray-50 text-gray-600'}`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Вывод результатов симулятора */}
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gym-border/80 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Целевой рацион</span>
                <span className="text-3xl font-extrabold font-display text-gray-900 leading-none">
                  {simDietPlan.calories} <span className="text-sm font-semibold text-gray-500">ккал</span>
                </span>
              </div>

              {/* Полосы БЖУ */}
              <div className="w-full space-y-3 pt-2 text-xs font-bold text-gray-700">
                {/* Белки */}
                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Белки
                    </span>
                    <span>{simDietPlan.protein}г <span className="text-[10px] text-gray-400 font-normal">({simDietPlan.proteinKcal} ккал)</span></span>
                  </div>
                  <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (simDietPlan.proteinKcal / simDietPlan.calories) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Жиры */}
                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Жиры
                    </span>
                    <span>{simDietPlan.fat}г <span className="text-[10px] text-gray-400 font-normal">({simDietPlan.fatKcal} ккал)</span></span>
                  </div>
                  <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (simDietPlan.fatKcal / simDietPlan.calories) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Углеводы */}
                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Углеводы
                    </span>
                    <span>{simDietPlan.carbs}г <span className="text-[10px] text-gray-400 font-normal">({simDietPlan.carbsKcal} ккал)</span></span>
                  </div>
                  <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (simDietPlan.carbsKcal / simDietPlan.calories) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Мини-сводка по метаболизму */}
              <div className="w-full border-t border-gym-border/40 pt-4 flex justify-around text-[10px] font-bold text-gray-400">
                <div>
                  <span className="block text-gray-800 text-sm font-extrabold">{simDietPlan.bmr}</span>
                  Базовый BMR
                </div>
                <div>
                  <span className="block text-gray-800 text-sm font-extrabold">+{simDietPlan.neat}</span>
                  Шаги NEAT
                </div>
                {simIsWorkout && (
                  <div>
                    <span className="block text-gray-800 text-sm font-extrabold">+{simDietPlan.eat}</span>
                    Тренировка
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ПРАВАЯ КОЛОНКА (Данные, Бэкап и Статистика) */}
      <div className="space-y-6">
        <DevicePairing />
        <BackupPanel />
        
        {/* Статистика базы данных */}
        <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-emerald-600 font-display">
            <Sparkles size={18} />
            Ваша статистика
          </h3>

          <div className="space-y-3 text-xs font-semibold text-gray-700">
            {/* Проведенные тренировки */}
            <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Тренировочных сессий
              </span>
              <span className="text-gray-950 font-bold bg-white px-2 py-0.5 rounded border border-gym-border">{workoutSessions.length}</span>
            </div>

            {/* Логи питания */}
            <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Дней логов питания
              </span>
              <span className="text-gray-950 font-bold bg-white px-2 py-0.5 rounded border border-gym-border">{nutritionLogs.length}</span>
            </div>

            {/* Замеры */}
            <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Внесено замеров веса
              </span>
              <span className="text-gray-950 font-bold bg-white px-2 py-0.5 rounded border border-gym-border">{progress.length}</span>
            </div>

            {/* Шаблоны */}
            <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Шаблонов тренировок
              </span>
              <span className="text-gray-950 font-bold bg-white px-2 py-0.5 rounded border border-gym-border">{workoutTemplates.length}</span>
            </div>

            {/* Рекорды */}
            <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Личных силовых рекордов
              </span>
              <span className="text-gray-950 font-bold bg-white px-2 py-0.5 rounded border border-gym-border">{personalRecords.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
