import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Plus, Check, X } from '../BroskyIcon';
import {
  calculateMacroDeficit,
  recommendOptimalFoodCombination,
  generateSmartAdvisorAdvice,
  type MacroTarget,
  type MacroCurrent,
  type FoodCandidate,
} from '../../utils/macroOptimizer';
import type { NutritionFoodItem, CustomFood } from '../../types';

interface SmartMacroAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: MacroTarget;
  current: MacroCurrent;
  customFoods: CustomFood[];
  popularFoods: FoodCandidate[];
  onAddItemsToLog: (items: NutritionFoodItem[]) => void;
}

export const SmartMacroAdvisorModal: React.FC<SmartMacroAdvisorModalProps> = ({
  isOpen,
  onClose,
  target,
  current,
  customFoods,
  popularFoods,
  onAddItemsToLog,
}) => {
  const [adviceText, setAdviceText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const deficit = React.useMemo(() => calculateMacroDeficit(target, current), [target, current]);

  const recommendedItems = React.useMemo(() => {
    if (!isOpen) return [];
    const mappedCustomFoods: FoodCandidate[] = customFoods.map(cf => ({
      name: cf.name,
      calories: cf.calories,
      protein: cf.protein,
      fat: cf.fat,
      carbs: cf.carbs,
      baseWeight: cf.baseWeight || 100,
    }));
    const allFoods = [...mappedCustomFoods, ...popularFoods];
    return recommendOptimalFoodCombination(deficit, allFoods);
  }, [isOpen, customFoods, popularFoods, deficit]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    generateSmartAdvisorAdvice(deficit, recommendedItems).then(advice => {
      if (isMounted) {
        setAdviceText(advice);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, deficit, recommendedItems]);

  if (!isOpen) return null;

  const handleAddAll = () => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logItems: NutritionFoodItem[] = recommendedItems.map(item => ({
      id: 'food-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: item.name,
      grams: item.grams,
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      time: timeNow,
    }));

    onAddItemsToLog(logItems);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-gym-border/50 shadow-2xl animate-scaleUp overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gym-border/30 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gym-accent/10 text-gym-accent rounded-2xl flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-gym-accent" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm sm:text-base font-display">
                Умный добор КБЖУ
              </h3>
              <p className="text-xs text-gray-500 font-sans mt-0.5">Порционный расчет вечернего рациона</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-all cursor-pointer btn-interactive text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Остаток КБЖУ до цели */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Остаток КБЖУ до цели
              </h4>
              {deficit.isFulfilled && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Цель достигнута
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {/* Калории (Rose) */}
              <div className="p-3 bg-rose-50/70 border border-rose-150/70 rounded-2xl text-center shadow-xs">
                <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider block mb-0.5">
                  Калории
                </span>
                <span className="text-lg font-black font-display text-rose-600 leading-tight">
                  {deficit.calories}
                </span>
                <span className="text-[9px] font-bold text-rose-400 block">ккал</span>
              </div>

              {/* Белки (Orange) */}
              <div className="p-3 bg-orange-50/70 border border-orange-150/70 rounded-2xl text-center shadow-xs">
                <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-wider block mb-0.5">
                  Белки
                </span>
                <span className="text-lg font-black font-display text-orange-600 leading-tight">
                  {deficit.protein}
                </span>
                <span className="text-[9px] font-bold text-orange-400 block">грамм</span>
              </div>

              {/* Жиры (Yellow/Amber) */}
              <div className="p-3 bg-yellow-50/70 border border-yellow-150/70 rounded-2xl text-center shadow-xs">
                <span className="text-[10px] font-extrabold text-yellow-600 uppercase tracking-wider block mb-0.5">
                  Жиры
                </span>
                <span className="text-lg font-black font-display text-yellow-600 leading-tight">
                  {deficit.fat}
                </span>
                <span className="text-[9px] font-bold text-yellow-500 block">грамм</span>
              </div>

              {/* Углеводы (Cyan) */}
              <div className="p-3 bg-cyan-50/70 border border-cyan-150/70 rounded-2xl text-center shadow-xs">
                <span className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-wider block mb-0.5">
                  Углеводы
                </span>
                <span className="text-lg font-black font-display text-cyan-600 leading-tight">
                  {deficit.carbs}
                </span>
                <span className="text-[9px] font-bold text-cyan-500 block">грамм</span>
              </div>
            </div>
          </div>

          {/* Advice Box */}
          <div className="p-4 bg-gym-accent/5 border border-gym-accent/15 rounded-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-gym-accent" />
              <span className="text-xs font-bold text-gym-accent uppercase tracking-wider">
                Рекомендация нутрициолога
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-4 gap-2.5 text-gray-500 text-xs font-medium">
                <div className="w-4 h-4 border-2 border-gym-accent border-t-transparent rounded-full animate-spin"></div>
                <span>Рассчитываем оптимальные пропорции...</span>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-700 font-sans leading-relaxed whitespace-pre-line">
                {adviceText}
              </p>
            )}
          </div>

          {/* Recommended Portions List */}
          {!isLoading && recommendedItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Порционный расчет
                </h4>
                <span className="text-xs font-bold font-display text-gym-accent">
                  Итого: {recommendedItems.reduce((s, i) => s + i.calories, 0)} ккал
                </span>
              </div>

              <div className="space-y-2">
                {recommendedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white/70 border border-gym-border/50 hover:border-gym-accent/40 rounded-2xl flex items-center justify-between shadow-xs transition-all"
                  >
                    <div className="space-y-1">
                      <span className="font-bold text-sm text-gray-800 block">{item.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-orange-50 text-orange-600 border border-orange-200/60 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
                          Б: {item.protein}г
                        </span>
                        <span className="bg-yellow-50 text-yellow-600 border border-yellow-200/60 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
                          Ж: {item.fat}г
                        </span>
                        <span className="bg-cyan-50 text-cyan-600 border border-cyan-200/60 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
                          У: {item.carbs}г
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className="bg-gym-accent/10 text-gym-accent font-black font-display px-3 py-1 rounded-xl text-xs block">
                        {item.grams} г
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium mt-1">{item.calories} ккал</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white/40 border-t border-gym-border/30 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4.5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100/60 rounded-xl transition-all cursor-pointer"
          >
            Отмена
          </button>
          {!deficit.isFulfilled && recommendedItems.length > 0 && (
            <button
              onClick={handleAddAll}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gym-accent hover:bg-gym-accent/90 rounded-xl shadow-[0_4px_14px_rgba(70,107,247,0.25)] active:scale-[0.97] transition-all cursor-pointer flex items-center gap-2 btn-interactive"
            >
              <Plus className="w-4 h-4" />
              <span>Записать в дневник</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
