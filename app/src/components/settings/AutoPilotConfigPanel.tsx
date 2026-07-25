import React, { useState } from 'react';
import { useGymStore } from '../../store/gymStore';
import { Sparkles, Activity, Info, Zap, Shield, Flame, Check, RefreshCw, Layers } from '../BroskyIcon';
import { calculateAutoPilotRecommendation } from '../../utils/autoPilotEngine';

export const AutoPilotConfigPanel: React.FC = () => {
  const profile = useGymStore((s) => s.profile);
  const workoutSessions = useGymStore((s) => s.workoutSessions);
  const updateProfile = useGymStore((s) => s.updateProfile);

  const [hasPromptApi] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'ai' in window && !!(window as unknown as { ai?: { languageModel?: unknown } }).ai?.languageModel;
  });
  const [testResult, setTestResult] = useState<{
    engine: string;
    exercise: string;
    weight: number;
    reps: number;
    rir: number;
    reason: string;
    protectionActive: boolean;
  } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const isEnabled = profile.autoPilotEnabled ?? true;
  const aggressiveness = profile.autoPilotAggressiveness || 'balanced';
  const plateStep = profile.autoPilotPlateStep || 2.5;
  const mode = profile.autoPilotMode || 'hints';
  const useLlm = profile.useLocalLlm ?? true;
  const adviceDetail = profile.llmAdviceDetail || 'detailed';

  const handleTestEngine = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Симуляция расчета Автопилота
    setTimeout(() => {
      const demoRec = calculateAutoPilotRecommendation('demo_bench_press', workoutSessions, profile, 8);
      const engineStatus = hasPromptApi && useLlm ? 'Chrome Standard Engine' : 'TypeScript Math Engine (<1мс)';
      
      setTestResult({
        engine: engineStatus,
        exercise: 'Жим штанги лежа',
        weight: demoRec.recommendedWeight,
        reps: demoRec.recommendedReps,
        rir: demoRec.targetRir,
        reason: demoRec.reason,
        protectionActive: demoRec.protectionActive
      });
      setIsTesting(false);
    }, 400);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-xl space-y-6 border border-white/60">
      {/* 1. ШАПКА СЕКЦИИ И СТАТУСНЫЙ БЕЙДЖ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gym-border/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gym-accent/10 border border-gym-accent/20 flex items-center justify-center text-gym-accent shadow-xs flex-shrink-0 mt-0.5">
            <Sparkles size={20} className="text-gym-accent" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 font-display flex items-center gap-2">
              Настройки Автопилота и Модулей
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Управление автопилотом весов, агрессивностью и экспертными советами
            </p>
          </div>
        </div>

        {/* Интерактивный статус-бейдж */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-2 border shadow-xs transition-all duration-300 ${
            hasPromptApi 
              ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80 shadow-emerald-500/5' 
              : 'bg-gym-accent/10 text-gym-accent border-gym-accent/20 shadow-gym-accent/5'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasPromptApi ? 'bg-emerald-400' : 'bg-gym-accent'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${hasPromptApi ? 'bg-emerald-500' : 'bg-gym-accent'}`}></span>
            </span>
            <span className="truncate max-w-[200px] sm:max-w-none">
              {hasPromptApi ? 'Chrome Engine' : 'TypeScript Engine (<1мс)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. ГЛАВНЫЙ КАРТОЧНЫЙ ТУМБЛЕР ИИ-АВТОПИЛОТА */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isEnabled 
          ? 'bg-gradient-to-br from-gym-accent/10 via-purple-500/5 to-white/90 border-gym-accent/30 shadow-md ring-1 ring-gym-accent/15' 
          : 'bg-white/40 border-gym-border/80 hover:bg-white/60'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            isEnabled ? 'bg-gym-accent text-white shadow-sm' : 'bg-gray-100 text-gray-400'
          }`}>
            <Activity size={18} />
          </div>
          <div className="space-y-0.5">
            <label htmlFor="toggleAutoPilot" className="text-sm font-bold text-gray-900 flex items-center gap-2 cursor-pointer select-none">
              ИИ-Автопилот Прогрессии Весов
            </label>
            <p className="text-xs text-gray-500 leading-normal max-w-xl">
              Авторасчет рабочих весов, повторов и RIR с автоматической защитой суставов при мышчной боли (DOMS)
            </p>
          </div>
        </div>

        <button
          id="toggleAutoPilot"
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={() => updateProfile({ autoPilotEnabled: !isEnabled })}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gym-accent self-end sm:self-center ${
            isEnabled ? 'bg-gym-accent' : 'bg-gray-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-out flex items-center justify-center ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          >
            {isEnabled && <Check size={12} className="text-gym-accent stroke-[3]" />}
          </span>
        </button>
      </div>

      {isEnabled && (
        <div className="space-y-6 pt-1 animate-fadeIn">
          {/* 3. РЕЖИМ АГРЕССИВНОСТИ (Neural Rate) */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center flex-wrap gap-1">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Zap size={15} className="text-amber-500" />
                Агрессивность прогрессивной перегрузки
              </span>
              <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider">Neural Rate</span>
            </div>
            
            <div className="flex flex-col gap-2.5">
              {[
                {
                  id: 'conservative',
                  title: 'Консервативный',
                  stepLabel: '+0.5x шага',
                  desc: 'Плавный рост с запасом RIR 2. Для новичков и восстановления.',
                  IconComponent: Shield,
                  activeColor: 'border-blue-500 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/20 shadow-blue-500/10'
                },
                {
                  id: 'balanced',
                  title: 'Сбалансированный',
                  stepLabel: '+1.0x шаг',
                  desc: 'Плановый научно обоснованный рост веса (RIR 2). Стандарт.',
                  IconComponent: Zap,
                  activeColor: 'border-gym-accent bg-gym-accent/10 text-gym-accent font-bold ring-2 ring-gym-accent/25 shadow-gym-accent/10'
                },
                {
                  id: 'hardcore',
                  title: 'Хардкор',
                  stepLabel: '+1.5x шага',
                  desc: 'Быстрый прирост веса с выходом на RIR 1. Для опытных.',
                  IconComponent: Flame,
                  activeColor: 'border-rose-500 bg-rose-50/80 text-rose-950 ring-2 ring-rose-500/20 shadow-rose-500/10'
                }
              ].map((item) => {
                const isActive = aggressiveness === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateProfile({ autoPilotAggressiveness: item.id as 'conservative' | 'balanced' | 'hardcore' })}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-2 btn-interactive ${
                      isActive 
                        ? `${item.activeColor} shadow-sm` 
                        : 'border-gym-border/70 bg-white/60 hover:bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <item.IconComponent size={15} />
                        {item.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-extrabold opacity-90 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md">
                          {item.stepLabel}
                        </span>
                        {isActive && (
                          <span className="w-4 h-4 rounded-full bg-current flex items-center justify-center text-white">
                            <Check size={10} className="stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. ШАГ ОКРУГЛЕНИЯ И ФОРМАТ ОТОБРАЖЕНИЯ (Сегментированные контролы) */}
          <div className="flex flex-col gap-4">
            {/* Минимальный шаг веса (Pill Segmented Control) */}
            <div className="space-y-2 p-4 rounded-2xl bg-white/50 border border-gym-border/80 backdrop-blur-xs">
              <label className="text-xs font-bold text-gray-800 block">
                Минимальный шаг блинов / гантелей
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 1.0, label: '1.0 кг', desc: 'Микро' },
                  { value: 1.25, label: '1.25 кг', desc: 'Малый' },
                  { value: 2.5, label: '2.5 кг', desc: 'Стандарт' },
                  { value: 5.0, label: '5.0 кг', desc: 'Гантели' },
                ].map((step) => {
                  const isSelected = plateStep === step.value;
                  return (
                    <button
                      key={step.value}
                      type="button"
                      onClick={() => updateProfile({ autoPilotPlateStep: step.value })}
                      className={`py-2 px-2 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[44px] ${
                        isSelected
                          ? 'bg-gym-accent text-white font-extrabold shadow-sm border border-gym-accent'
                          : 'bg-white/80 hover:bg-white text-gray-700 border border-gym-border/80 hover:border-gym-accent/30'
                      }`}
                    >
                      <span className="text-xs font-bold">{step.label}</span>
                      <span className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>{step.desc}</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[10px] text-gray-400 block pt-0.5">
                Система автоматически округляет рабочий вес кратно выбранному шагу
              </span>
            </div>

            {/* Режим работы в тренировке */}
            <div className="space-y-2 p-4 rounded-2xl bg-white/50 border border-gym-border/80 backdrop-blur-xs flex flex-col justify-between">
              <label className="text-xs font-bold text-gray-800 block">
                Формат отображения в тренировке
              </label>

              <div className="p-1 bg-gray-100/90 rounded-xl border border-gym-border/60 flex flex-col gap-1.5">
                {[
                  { id: 'hints', label: 'Подсказки', IconComponent: Sparkles, iconColor: 'text-amber-500', desc: 'Карточка с обоснованием' },
                  { id: 'autofill', label: 'Автозаполнение', IconComponent: Zap, iconColor: 'text-gym-accent', desc: 'Прямая подстановка' },
                ].map((m) => {
                  const isSelected = mode === m.id;
                  const Icon = m.IconComponent;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => updateProfile({ autoPilotMode: m.id as 'hints' | 'autofill' })}
                      className={`p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-gym-accent font-bold shadow-xs border border-gym-accent/20'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Icon size={14} className={m.iconColor} />
                        <span>{m.label}</span>
                      </div>
                      <div className="text-[9px] text-gray-400 font-normal pl-5">{m.desc}</div>
                    </button>
                  );
                })}
              </div>
              <span className="text-[10px] text-gray-400 block pt-0.5">
                «Подсказки» позволяют увидеть причину веса перед применением
              </span>
            </div>
          </div>

          {/* 5. НАСТРОЙКИ ЛОКАЛЬНОГО ДВИЖКА (Chrome Prompt API / Standard Engine) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/60 border border-gym-border/80 space-y-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <Layers size={18} className="text-gym-accent mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-900 block">
                    Модуль экспертных рекомендаций (Offline Engine)
                  </span>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Формирование персональных советов тренера прямо в браузере (без отправки данных в сеть)
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={useLlm}
                onClick={() => updateProfile({ useLocalLlm: !useLlm })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  useLlm ? 'bg-gym-accent' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    useLlm ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Детализация ответов (Сегментированные кнопки) */}
            <div className="space-y-2 pt-1 border-t border-gym-border/50">
              <label className="text-[11px] font-bold text-gray-700 block">
                Глубина и подробность советов:
              </label>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: 'detailed', label: 'Подробный', IconComponent: Layers, iconColor: 'text-gym-accent', desc: 'С биомеханикой' },
                  { id: 'concise', label: 'Краткий', IconComponent: Zap, iconColor: 'text-amber-500', desc: 'Тезисы за 1с' },
                  { id: 'math_only', label: 'Только числа', IconComponent: Activity, iconColor: 'text-purple-500', desc: 'Чистый расчет' },
                ].map((item) => {
                  const Icon = item.IconComponent;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateProfile({ llmAdviceDetail: item.id as 'concise' | 'detailed' | 'math_only' })}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        adviceDetail === item.id
                          ? 'border-gym-accent bg-gym-accent/10 font-bold text-gym-accent shadow-xs ring-1 ring-gym-accent/20'
                          : 'border-gym-border/80 bg-white/70 hover:bg-white text-gray-600'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <Icon size={14} className={item.iconColor} />
                        <span>{item.label}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-normal pl-5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 6. ИНТЕРАКТИВНЫЙ ТЕСТ ДВИЖКА (Liquid Glass Diagnostic Card) */}
          <div className="pt-3 border-t border-gym-border/60 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Info size={14} className="text-gym-accent" />
                Тестирование Движка Авторегуляции
              </span>
              <button
                type="button"
                onClick={handleTestEngine}
                disabled={isTesting}
                className="px-3.5 py-1.5 rounded-xl bg-gym-accent hover:bg-persian-blue-600 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-sm btn-interactive disabled:opacity-50"
              >
                <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
                {isTesting ? 'Запрос...' : 'Проверить отклик движка'}
              </button>
            </div>

            {testResult && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-white/90 to-gray-50/90 border border-gym-accent/30 shadow-lg space-y-3 animate-fadeInUp backdrop-blur-md">
                <div className="flex justify-between items-center pb-2 border-b border-gym-border/50">
                  <span className="text-xs font-extrabold text-gray-900 font-display flex items-center gap-1.5">
                    <Sparkles size={14} className="text-gym-accent" />
                    {testResult.exercise}
                  </span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-gym-accent/10 text-gym-accent border border-gym-accent/20">
                    {testResult.engine}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-white border border-gym-border/60 shadow-2xs">
                    <span className="text-[9px] text-gray-400 uppercase font-bold block">Вес</span>
                    <span className="text-sm font-extrabold text-gym-accent font-display">{testResult.weight} кг</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-gym-border/60 shadow-2xs">
                    <span className="text-[9px] text-gray-400 uppercase font-bold block">Повторы</span>
                    <span className="text-sm font-extrabold text-gray-900 font-display">{testResult.reps}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-gym-border/60 shadow-2xs">
                    <span className="text-[9px] text-gray-400 uppercase font-bold block">Запас RIR</span>
                    <span className="text-sm font-extrabold text-emerald-600 font-display">{testResult.rir}</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="text-[11px] text-gray-600 leading-relaxed font-medium">
                    <span className="font-bold text-gray-800">Причина:</span> {testResult.reason}
                  </div>
                  <div className="text-[10px] font-bold flex items-center gap-1.5 pt-0.5">
                    <span className="text-gray-400">Защита фасций:</span>
                    {testResult.protectionActive ? (
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        АКТИВНА (-15% от нагрузки)
                      </span>
                    ) : (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Не требуется
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
