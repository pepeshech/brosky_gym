import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGymStore } from '../../store/gymStore';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES, defaultExercises } from '../../store/staticData';
import { generateSmartWorkoutTemplate, type GeneratedWorkoutResult } from '../../utils/workoutGenerator';
import { X, Sparkles, Dumbbell, Check, Zap, Clock, Shield, ArrowRight, History } from '../BroskyIcon';

interface SmartWorkoutGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSession?: (templateId: string) => void;
}

export const SmartWorkoutGeneratorModal: React.FC<SmartWorkoutGeneratorModalProps> = ({
  isOpen,
  onClose,
  onStartSession,
}) => {
  const addWorkoutTemplate = useGymStore(s => s.addWorkoutTemplate);

  const [goal, setGoal] = useState<'hypertrophy' | 'strength' | 'cut' | 'quick'>('hypertrophy');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(['Грудь', 'Трицепс']);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['Штанга', 'Гантели', 'Блок']);
  const [duration, setDuration] = useState<number>(45);
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [customName, setCustomName] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedWorkoutResult | null>(null);

  if (!isOpen) return null;

  const toggleMuscle = (m: string) => {
    setSelectedMuscles(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  const handleSelectAllMuscles = () => {
    setSelectedMuscles(['Грудь', 'Широчайшие', 'Плечи', 'Бицепс', 'Трицепс', 'Квадрицепс']);
  };

  const handleClearMuscles = () => {
    setSelectedMuscles([]);
  };

  const toggleEquipment = (eq: string) => {
    setSelectedEquipment(prev =>
      prev.includes(eq) ? prev.filter(x => x !== eq) : [...prev, eq]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateSmartWorkoutTemplate({
        name: customName,
        goal,
        targetMuscles: selectedMuscles,
        equipment: selectedEquipment,
        durationMinutes: duration,
        experienceLevel: experience,
      });
      setGeneratedResult(res);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTemplate = () => {
    if (!generatedResult) return;
    addWorkoutTemplate(generatedResult.template);
    onClose();
  };

  const handleStartNow = () => {
    if (!generatedResult) return;
    addWorkoutTemplate(generatedResult.template);
    if (onStartSession) {
      onStartSession(generatedResult.template.id);
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Surface Panel - Fixed Flex Column Shell */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-gray-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col max-h-[90vh] sm:max-h-[85vh] z-10 overflow-hidden">
        
        {/* Fixed Header */}
        <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gym-accent/10 border border-gym-accent/20 flex items-center justify-center text-gym-accent shadow-2xs shrink-0">
              <Sparkles size={20} className="text-gym-accent animate-pulse" />
            </div>
            <div>
              <h3 className="text-[17px] font-black text-gray-900 font-display tracking-tight leading-tight">
                Смарт-Генератор Тренировок
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 font-sans leading-none mt-0.5">
                Авто-подбор упражнений по целям, мышцам и инвентарю
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-all cursor-pointer btn-interactive shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {!generatedResult ? (
            <div className="space-y-6 font-sans">
              
              {/* 1. Спортивная цель */}
              <div className="space-y-2.5">
                <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                  1. Спортивная цель
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'hypertrophy', label: 'Гипертрофия', desc: '8-12 повторов', icon: Dumbbell },
                    { id: 'strength', label: 'Сила', desc: '4-6 повторов', icon: Shield },
                    { id: 'cut', label: 'Жиросжигание', desc: '12-15 повторов', icon: Zap },
                    { id: 'quick', label: 'Быстрая 30м', desc: '10-12 повторов', icon: Clock },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGoal(item.id as typeof goal)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer btn-interactive flex flex-col justify-between min-h-[76px] ${
                        goal === item.id
                          ? 'bg-gym-accent text-white border-gym-accent shadow-md shadow-gym-accent/25 ring-2 ring-gym-accent/30'
                          : 'bg-gray-50/80 hover:bg-gray-100/80 text-gray-700 border-gray-200/80'
                      }`}
                    >
                      <item.icon size={18} className={goal === item.id ? 'text-white' : 'text-gym-accent'} />
                      <div>
                        <div className="text-xs font-bold font-display leading-tight">{item.label}</div>
                        <div className={`text-[10px] ${goal === item.id ? 'text-white/80' : 'text-gray-400'}`}>{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Целевые группы мышц */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                    2. Группы мышц ({selectedMuscles.length})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllMuscles}
                      className="text-[11px] font-bold text-gym-accent hover:underline cursor-pointer"
                    >
                      Все популярные
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={handleClearMuscles}
                      className="text-[11px] font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      Сбросить
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.slice(0, 12).map(muscle => {
                    const isSelected = selectedMuscles.includes(muscle);
                    return (
                      <button
                        key={muscle}
                        type="button"
                        onClick={() => toggleMuscle(muscle)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer btn-interactive flex items-center gap-1.5 min-h-[38px] ${
                          isSelected
                            ? 'bg-gym-accent text-white border border-gym-accent shadow-xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                        }`}
                      >
                        {isSelected && <Check size={13} />}
                        <span>{muscle}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Доступный инвентарь */}
              <div className="space-y-2.5">
                <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                  3. Доступный инвентарь
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {EQUIPMENT_TYPES.slice(0, 5).map(eq => {
                    const isChecked = selectedEquipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleEquipment(eq)}
                        className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer min-h-[40px] ${
                          isChecked
                            ? 'bg-blue-50 text-gym-accent border border-blue-200 shadow-2xs'
                            : 'bg-gray-50 text-gray-500 border border-gray-200/70 hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${isChecked ? 'bg-gym-accent text-white' : 'border border-gray-300'}`}>
                          {isChecked && <Check size={11} />}
                        </div>
                        <span className="truncate">{eq}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Время и Уровень */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="workout-duration" className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                      Длительность
                    </label>
                    <span className="text-xs font-black text-gym-accent bg-gym-accent/10 px-2.5 py-0.5 rounded-md border border-gym-accent/20">
                      {duration} мин
                    </span>
                  </div>
                  <input
                    id="workout-duration"
                    type="range"
                    min="20"
                    max="75"
                    step="5"
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full accent-gym-accent cursor-pointer h-2 bg-gray-200 rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="experience-level" className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                    Уровень подготовки
                  </label>
                  <select
                    id="experience-level"
                    value={experience}
                    onChange={e => setExperience(e.target.value as typeof experience)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-gym-accent h-10 shadow-2xs"
                  >
                    <option value="beginner">Новичок (3 подхода)</option>
                    <option value="intermediate">Опытный (4 подхода)</option>
                    <option value="advanced">Продвинутый (5 подходов)</option>
                  </select>
                </div>
              </div>

              {/* 5. Название программы */}
              <div>
                <label htmlFor="custom-name" className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">
                  Название программы (необязательно)
                </label>
                <input
                  id="custom-name"
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="ИИ сгенерирует название автоматически..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-gym-accent focus:bg-white h-10"
                />
              </div>

            </div>
          ) : (
            /* Результат Генерации */
            <div className="space-y-5 font-sans animate-fadeIn">
              
              {/* Результат Карточка Header */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50/30 p-4 sm:p-5 rounded-2xl border border-blue-100/80 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-base sm:text-lg font-black text-gray-900 font-display">
                    {generatedResult.template.name}
                  </h4>
                  <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-gym-accent text-white shadow-xs">
                    {generatedResult.estimatedDuration} мин • {generatedResult.totalSets} подходов
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {generatedResult.template.description}
                </p>
              </div>

              {/* Состав упражнений */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                    Состав тренировки ({generatedResult.template.exercises.length} упражнений)
                  </label>
                  <button
                    type="button"
                    onClick={() => setGeneratedResult(null)}
                    className="text-[11px] font-bold text-gym-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <History size={12} />
                    <span>Изменить параметры</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {generatedResult.template.exercises.map((item, idx) => {
                    const ex = defaultExercises.find(e => e.id === item.exerciseId);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gym-accent/30 transition-all">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-gym-accent/10 text-gym-accent font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-gray-800">{ex?.name || item.exerciseId}</div>
                            <div className="text-[10px] text-gray-400">{ex?.muscleGroup} • {ex?.equipment}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-gym-accent">{item.sets} $\times$ {item.reps}</span>
                          <span className="text-[10px] text-gray-400 block">отдых {item.restSec}с</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Совет тренера */}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed font-medium">
                {generatedResult.adviceText}
              </div>

            </div>
          )}
        </div>

        {/* Fixed Action Footer */}
        <div className="px-5 py-4 sm:px-7 sm:py-4 border-t border-gray-100 bg-gray-50/90 backdrop-blur-md shrink-0">
          {!generatedResult ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 bg-gym-accent hover:bg-gym-accent/90 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-gym-accent/25 transition-all cursor-pointer btn-interactive active:scale-[0.98] min-h-[48px]"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Формирование программы...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Сгенерировать шаблон ИИ</span>
                </>
              )}
            </button>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="py-3 px-4 bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs border border-gray-200 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer btn-interactive min-h-[44px]"
              >
                <Check size={16} />
                Сохранить в мои шаблоны
              </button>

              <button
                type="button"
                onClick={handleStartNow}
                className="py-3 px-4 bg-gym-accent hover:bg-gym-accent/90 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-gym-accent/25 transition-all cursor-pointer btn-interactive active:scale-95 min-h-[44px]"
              >
                <ArrowRight size={16} />
                Начать тренировку сейчас
              </button>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};
