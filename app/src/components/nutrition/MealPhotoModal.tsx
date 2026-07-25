import React, { useState } from 'react';
import { Camera, Sparkles, X, Check, Upload, Flame } from '../BroskyIcon';

interface MealPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMeal: (mealData: {
    name: string;
    grams: number;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  }) => void;
}

export const MealPhotoModal: React.FC<MealPhotoModalProps> = ({
  isOpen,
  onClose,
  onApplyMeal,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cookingOilOption, setCookingOilOption] = useState<'none' | 'spray' | 'heavy'>('none');
  const [analysisResult, setAnalysisResult] = useState<{
    name: string;
    grams: number;
    baseCalories: number;
    protein: number;
    fat: number;
    carbs: number;
    confidence: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        analyzeMealPhoto();
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeMealPhoto = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Simulate Computer Vision 3D Volume estimation
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult({
        name: 'Куриное филе с рисом и овощами',
        grams: 350,
        baseCalories: 410,
        protein: 38.5,
        fat: 5.2,
        carbs: 52.0,
        confidence: 91,
      });
    }, 1500);
  };

  const getOilExtraCalories = () => {
    if (cookingOilOption === 'spray') return 45; // ~5g oil
    if (cookingOilOption === 'heavy') return 135; // ~15g oil
    return 0;
  };

  const handleApply = () => {
    if (!analysisResult) return;

    const extraCal = getOilExtraCalories();
    const extraFat = cookingOilOption === 'spray' ? 5 : cookingOilOption === 'heavy' ? 15 : 0;

    onApplyMeal({
      name: analysisResult.name,
      grams: analysisResult.grams,
      calories: analysisResult.baseCalories + extraCal,
      protein: analysisResult.protein,
      fat: Math.round((analysisResult.fat + extraFat) * 10) / 10,
      carbs: analysisResult.carbs,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gym-border/50 relative space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gym-border/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/50">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base">Смарт-Сканирование блюда (Computer Vision)</h3>
              <p className="text-[11px] text-gray-400">Определение порции и КБЖУ по 3D-объему кадра</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Upload / Photo area */}
        {!selectedImage ? (
          <label className="border-2 border-dashed border-gym-border hover:border-amber-400 bg-amber-50/30 hover:bg-amber-50/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Upload size={24} />
            </div>
            <div className="text-center">
              <span className="font-bold text-gray-800 text-sm block">Сделать фото или загрузить блюдо</span>
              <span className="text-xs text-gray-400">Сфотографируйте тарелку под углом 45°</span>
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden max-h-48 border border-gym-border/40 bg-gray-900">
              <img src={selectedImage} alt="Скан блюда" className="w-full h-full object-cover opacity-90" />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setAnalysisResult(null);
                }}
                className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-xl hover:bg-black/80 transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Loading AI State */}
            {isAnalyzing && (
              <div className="p-6 bg-amber-50/60 border border-amber-200/50 rounded-2xl text-center space-y-2">
                <div className="flex justify-center">
                  <Sparkles size={24} className="text-amber-500 animate-spin" />
                </div>
                <p className="font-bold text-amber-800 text-xs">Система высчитывает 3D-объем блюда и плотность...</p>
              </div>
            )}

            {/* Analysis Result */}
            {analysisResult && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Точность распознавания: {analysisResult.confidence}%</span>
                      <h4 className="font-extrabold text-gray-800 text-sm mt-0.5">{analysisResult.name}</h4>
                    </div>
                    <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-lg">
                      ~{analysisResult.grams}г
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-emerald-200/40 text-center">
                    <div className="bg-white/70 p-2 rounded-xl border border-emerald-100">
                      <span className="block text-[9px] font-bold text-gray-400 uppercase">Калории</span>
                      <span className="font-extrabold text-xs text-gray-800">{analysisResult.baseCalories + getOilExtraCalories()}</span>
                    </div>
                    <div className="bg-white/70 p-2 rounded-xl border border-emerald-100">
                      <span className="block text-[9px] font-bold text-orange-500 uppercase">Белки</span>
                      <span className="font-bold text-xs text-gray-800">{analysisResult.protein}г</span>
                    </div>
                    <div className="bg-white/70 p-2 rounded-xl border border-emerald-100">
                      <span className="block text-[9px] font-bold text-yellow-600 uppercase">Жиры</span>
                      <span className="font-bold text-xs text-gray-800">
                        {Math.round((analysisResult.fat + (cookingOilOption === 'spray' ? 5 : cookingOilOption === 'heavy' ? 15 : 0)) * 10) / 10}г
                      </span>
                    </div>
                    <div className="bg-white/70 p-2 rounded-xl border border-emerald-100">
                      <span className="block text-[9px] font-bold text-cyan-600 uppercase">Углеводы</span>
                      <span className="font-bold text-xs text-gray-800">{analysisResult.carbs}г</span>
                    </div>
                  </div>
                </div>

                {/* 1 Fast Question for Oil Precision */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Flame size={14} className="text-amber-500" /> Как приготовлено блюдо? (Уточнение масла)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCookingOilOption('none')}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        cookingOilOption === 'none'
                          ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                          : 'bg-white/70 border-gym-border/50 text-gray-600 hover:bg-white'
                      }`}
                    >
                      Без масла / Пар
                    </button>
                    <button
                      type="button"
                      onClick={() => setCookingOilOption('spray')}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        cookingOilOption === 'spray'
                          ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                          : 'bg-white/70 border-gym-border/50 text-gray-600 hover:bg-white'
                      }`}
                    >
                      Спрей (+45ккал)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCookingOilOption('heavy')}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        cookingOilOption === 'heavy'
                          ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                          : 'bg-white/70 border-gym-border/50 text-gray-600 hover:bg-white'
                      }`}
                    >
                      На масле (+135ккал)
                    </button>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={handleApply}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer btn-interactive"
                >
                  <Check size={18} />
                  Применить в дневник питания
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
