/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGymStore } from '../store/gymStore';
import { generateDietPlans, calculateNEAT } from '../utils/formulas';
import { Droplet, Trash2, Calendar, Plus, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Search, Footprints, LoaderPulse, BookOpen, Settings, Target, Barcode, Camera } from './BroskyIcon';
import { DatePicker } from './DatePicker';
import { useDialog } from './DialogProvider';
import { SmartMacroAdvisorModal } from './nutrition/SmartMacroAdvisorModal';
import { MealPhotoModal } from './nutrition/MealPhotoModal';
import type { NutritionPreset, NutritionFoodItem } from '../types';


const generateStepsId = () => 'steps-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
const generateWaterId = () => 'water-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

// Встроенный каталог популярных продуктов с КБЖУ на 100г
const POPULAR_FOODS = [
  // Источники белка (курица, мясо, рыба, яйца, творог)
  { name: 'Куриное филе отварное', calories: 170, protein: 30, fat: 3.5, carbs: 0, baseWeight: 100 },
  { name: 'Индейка филе запеченное', calories: 145, protein: 25, fat: 3, carbs: 0, baseWeight: 100 },
  { name: 'Говядина постная тушеная', calories: 220, protein: 22, fat: 15, carbs: 0, baseWeight: 100 },
  { name: 'Свинина вырезка запеченная', calories: 180, protein: 20, fat: 11, carbs: 0, baseWeight: 100 },
  { name: 'Лосось (семга) на пару', calories: 197, protein: 21, fat: 12.3, carbs: 0, baseWeight: 100 },
  { name: 'Тунец консервированный в собств. соку', calories: 96, protein: 21.5, fat: 1, carbs: 0, baseWeight: 100 },
  { name: 'Минтай отварной', calories: 79, protein: 17.2, fat: 0.9, carbs: 0, baseWeight: 100 },
  { name: 'Креветки вареные', calories: 95, protein: 19, fat: 1.5, carbs: 0, baseWeight: 100 },
  { name: 'Яйцо куриное вареное (1 шт ~55г)', calories: 155, protein: 12.6, fat: 10.6, carbs: 0.8, baseWeight: 100 },
  { name: 'Белок яичный вареный', calories: 44, protein: 11.1, fat: 0.2, carbs: 0.7, baseWeight: 100 },
  { name: 'Творог 5%', calories: 121, protein: 17.2, fat: 5, carbs: 1.8, baseWeight: 100 },
  { name: 'Творог обезжиренный 0.2%', calories: 78, protein: 16.5, fat: 0.2, carbs: 2, baseWeight: 100 },
  { name: 'Сыр легкий 15%', calories: 260, protein: 30, fat: 15, carbs: 0, baseWeight: 100 },
  { name: 'Сыр Пармезан', calories: 392, protein: 35.7, fat: 25.8, carbs: 3.2, baseWeight: 100 },
  { name: 'Йогурт греческий 2%', calories: 73, protein: 8, fat: 2, carbs: 3.5, baseWeight: 100 },
  { name: 'Молоко 2.5%', calories: 52, protein: 2.8, fat: 2.5, carbs: 4.7, baseWeight: 100 },
  { name: 'Кефир 1%', calories: 40, protein: 3, fat: 1, carbs: 4, baseWeight: 100 },

  // Источники углеводов (крупы, макароны, хлеб, картофель)
  { name: 'Гречневая каша вареная', calories: 110, protein: 4, fat: 1, carbs: 21, baseWeight: 100 },
  { name: 'Рис белый вареный', calories: 130, protein: 2.7, fat: 0.3, carbs: 28, baseWeight: 100 },
  { name: 'Рис бурый вареный', calories: 111, protein: 2.6, fat: 0.9, carbs: 23, baseWeight: 100 },
  { name: 'Макароны твердых сортов вареные', calories: 140, protein: 5, fat: 0.5, carbs: 28, baseWeight: 100 },
  { name: 'Овсяная каша на воде', calories: 88, protein: 3, fat: 1.7, carbs: 15, baseWeight: 100 },
  { name: 'Киноа вареная', calories: 120, protein: 4.4, fat: 1.9, carbs: 21.3, baseWeight: 100 },
  { name: 'Булгур вареный', calories: 83, protein: 3, fat: 0.2, carbs: 18.6, baseWeight: 100 },
  { name: 'Картофель отварной', calories: 82, protein: 2, fat: 0.4, carbs: 16.7, baseWeight: 100 },
  { name: 'Хлеб ржаной', calories: 215, protein: 6.5, fat: 1.2, carbs: 42, baseWeight: 100 },
  { name: 'Хлеб цельнозерновой', calories: 247, protein: 11, fat: 3.5, carbs: 41, baseWeight: 100 },
  { name: 'Хлеб пшеничный (батон)', calories: 262, protein: 7.5, fat: 2.9, carbs: 50.9, baseWeight: 100 },
  { name: 'Хлебцы ржаные', calories: 310, protein: 10, fat: 2, carbs: 61, baseWeight: 100 },

  // Жиры и орехи
  { name: 'Масло оливковое', calories: 884, protein: 0, fat: 99.8, carbs: 0, baseWeight: 100 },
  { name: 'Масло сливочное 82.5%', calories: 748, protein: 0.5, fat: 82.5, carbs: 0.8, baseWeight: 100 },
  { name: 'Авокадо', calories: 160, protein: 2, fat: 14.7, carbs: 1.8, baseWeight: 100 },
  { name: 'Арахисовая паста', calories: 590, protein: 24, fat: 50, carbs: 12, baseWeight: 100 },
  { name: 'Миндаль орех', calories: 579, protein: 21.2, fat: 49.9, carbs: 21.6, baseWeight: 100 },
  { name: 'Грецкий орех', calories: 654, protein: 15.2, fat: 65.2, carbs: 13.7, baseWeight: 100 },
  { name: 'Кешью орех', calories: 553, protein: 18.2, fat: 43.8, carbs: 30.2, baseWeight: 100 },

  // Овощи и зелень (клетчатка)
  { name: 'Помидоры (томаты)', calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, baseWeight: 100 },
  { name: 'Огурцы свежие', calories: 15, protein: 0.8, fat: 0.1, carbs: 2.8, baseWeight: 100 },
  { name: 'Брокколи отварная', calories: 35, protein: 2.4, fat: 0.4, carbs: 6.6, baseWeight: 100 },
  { name: 'Цветная капуста отварная', calories: 25, protein: 1.9, fat: 0.3, carbs: 5, baseWeight: 100 },
  { name: 'Капуста белокочанная свежая', calories: 25, protein: 1.8, fat: 0.1, carbs: 4.7, baseWeight: 100 },
  { name: 'Болгарский перец красный', calories: 26, protein: 1.3, fat: 0.1, carbs: 5.3, baseWeight: 100 },
  { name: 'Морковь свежая', calories: 41, protein: 0.9, fat: 0.2, carbs: 9.6, baseWeight: 100 },
  { name: 'Шпинат свежий', calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, baseWeight: 100 },
  { name: 'Салат листовой', calories: 15, protein: 1.2, fat: 0.2, carbs: 2.9, baseWeight: 100 },

  // Фрукты и ягоды
  { name: 'Банан', calories: 96, protein: 1.5, fat: 0.2, carbs: 22, baseWeight: 100 },
  { name: 'Яблоко зеленое', calories: 52, protein: 0.3, fat: 0.2, carbs: 12, baseWeight: 100 },
  { name: 'Груша конфер', calories: 47, protein: 0.4, fat: 0.3, carbs: 10.3, baseWeight: 100 },
  { name: 'Апельсин', calories: 47, protein: 0.9, fat: 0.2, carbs: 10.3, baseWeight: 100 },
  { name: 'Грейпфрут', calories: 35, protein: 0.7, fat: 0.2, carbs: 8, baseWeight: 100 },
  { name: 'Клубника свежая', calories: 32, protein: 0.7, fat: 0.3, carbs: 7.7, baseWeight: 100 },
  { name: 'Черника свежая', calories: 57, protein: 0.7, fat: 0.3, carbs: 14.5, baseWeight: 100 },

  // Готовые блюда и спортивное питание
  { name: 'Протеиновый концентрат сывороточный', calories: 400, protein: 80, fat: 5, carbs: 10, baseWeight: 100 },
  { name: 'Борщ домашний со свининой', calories: 96, protein: 4.5, fat: 6.8, carbs: 4.2, baseWeight: 100 },
  { name: 'Суп куриный с лапшой', calories: 45, protein: 3.2, fat: 1.8, carbs: 4, baseWeight: 100 },
  { name: 'Сырники из творога (жареные)', calories: 220, protein: 15, fat: 9, carbs: 19.5, baseWeight: 100 },
  { name: 'Котлета куриная паровая', calories: 135, protein: 18.5, fat: 5, carbs: 4, baseWeight: 100 },
  { name: 'Шаурма с курицей (готовая)', calories: 175, protein: 9, fat: 8.5, carbs: 15.5, baseWeight: 100 },
  { name: 'Салат Цезарь с курицей', calories: 150, protein: 11, fat: 9.5, carbs: 5.2, baseWeight: 100 },
  { name: 'Салат томаты/огурцы с оливковым маслом', calories: 90, protein: 0.8, fat: 8, carbs: 3.8, baseWeight: 100 },
];

interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_ru?: string;
  brands?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy_100g'?: number;
    proteins_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
  };
  image_url?: string;
}

interface BarcodeScannerModalProps {
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onClose, onScanSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(true);

  useEffect(() => {
    let html5QrCode: any = null;
    let isMounted = true;

    const startCamera = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;
        html5QrCode = new Html5Qrcode("barcode-reader");
        const config = {
          fps: 10,
          qrbox: (width: number, height: number) => {
            const boxWidth = Math.min(width * 0.8, 280);
            const boxHeight = Math.min(height * 0.4, 140);
            return { width: boxWidth, height: boxHeight };
          }
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            if (isMounted) {
              onScanSuccess(decodedText);
            }
          },
          () => {
            // ignore scan errors
          }
        );
        if (isMounted) {
          setCameraLoading(false);
        }
      } catch (err: any) {
        console.error("Camera init failed:", err);
        if (isMounted) {
          setError(
            err?.message ||
              "Не удалось запустить камеру. Проверьте разрешения в браузере."
          );
          setCameraLoading(false);
        }
      }
    };

    const timer = setTimeout(startCamera, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => {
            html5QrCode.clear();
          })
          .catch((e: any) => console.error("Error stopping scanner in cleanup:", e));
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="glass-panel fixed inset-0 flex flex-col items-center justify-center z-[10000] p-4 bg-black/30 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="barcode-modal-title" aria-describedby="barcode-modal-desc">
      <div className="bg-white/95 border border-gym-border/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative flex flex-col items-center gap-4 text-center overflow-hidden backdrop-blur-md">
        <div>
          <h3 id="barcode-modal-title" className="font-display font-black text-gray-800 text-lg tracking-tight">
            Сканирование штрих-кода
          </h3>
          <p id="barcode-modal-desc" className="text-xs text-gray-500 font-semibold mt-1">
            Наведите камеру на штрих-код продукта питания
          </p>
        </div>

        <div className="w-full aspect-square max-w-[280px] bg-black rounded-2xl overflow-hidden border border-gym-border/40 relative flex items-center justify-center">
          {cameraLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/95 z-20">
              <LoaderPulse size={32} className="text-gym-accent animate-spin" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Подключение камеры...</span>
            </div>
          )}

          {error ? (
            <div className="p-4 text-red-500 text-xs font-semibold leading-relaxed z-20">
              {error}
            </div>
          ) : (
            <div id="barcode-reader" className="w-full h-full object-cover [&_video]:object-cover" />
          )}

          {!cameraLoading && !error && (
            <div className="absolute inset-0 border-[3px] border-gym-accent/30 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="w-[85%] h-[2px] bg-red-500 shadow-[0_0_8px_#f43f5e] absolute animate-[scannerLaser_2s_infinite_ease-in-out]" />
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-gym-accent rounded-tl-md" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-gym-accent rounded-tr-md" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-gym-accent rounded-bl-md" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-gym-accent rounded-br-md" />
            </div>
          )}
        </div>

        <div className="w-full mt-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-250 active:scale-[0.96] transition-all cursor-pointer btn-interactive"
          >
            Отмена
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scannerLaser {
          0%, 100% { transform: translateY(-40px); }
          50% { transform: translateY(40px); }
        }
      `}</style>
    </div>
  );
};

export const NutritionTab: React.FC = React.memo(() => {
  const profile = useGymStore(s => s.profile);
  const updateProfile = useGymStore(s => s.updateProfile);
  const nutritionLogs = useGymStore(s => s.nutritionLogs);
  const addNutritionLog = useGymStore(s => s.addNutritionLog);
  const deleteNutritionLog = useGymStore(s => s.deleteNutritionLog);
  const workoutSessions = useGymStore(s => s.workoutSessions);
  const progress = useGymStore(s => s.progress);
  const { confirm, alert } = useDialog();
  
  const latestProgress = progress.length > 0 ? progress[progress.length - 1] : null;
  const activeProfileForCalc = useMemo(() => ({
    ...profile,
    weight: (latestProgress?.weight != null) ? latestProgress.weight : profile.weight,
    fatPercent: (latestProgress?.fatPercent != null) ? latestProgress.fatPercent : profile.fatPercent,
  }), [profile, latestProgress]);

  // Выбранная дата
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  // Состояние 3D-флипа карточки кольца
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAutoGoalPopover, setShowAutoGoalPopover] = useState(false);
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);

  // Поля ввода для порции еды
  const [foodName, setFoodName] = useState<string>('');
  const [portionCalories, setPortionCalories] = useState<number>(0);
  const [portionProtein, setPortionProtein] = useState<number>(0);
  const [portionFat, setPortionFat] = useState<number>(0);
  const [portionCarbs, setPortionCarbs] = useState<number>(0);
  const [eatenGrams, setEatenGrams] = useState<number>(100);

  const [selectedBaseFood, setSelectedBaseFood] = useState<typeof POPULAR_FOODS[0] | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isPhotoScanning, setIsPhotoScanning] = useState(false);
  const [isScanningLoading, setIsScanningLoading] = useState(false);

  // Кастомная еда пользователя из глобального Zustand стора с автосохранением в IndexedDB
  const savedFoods = useGymStore(s => s.customFoods || []);
  const addCustomFood = useGymStore(s => s.addCustomFood);
  const deleteCustomFood = useGymStore(s => s.deleteCustomFood);

  const presets = useGymStore(s => s.nutritionPresets || []);
  const dailyNutritionPresets = useGymStore(s => s.dailyNutritionPresets || {});
  const setDailyNutritionPreset = useGymStore(s => s.setDailyNutritionPreset);
  const addNutritionPreset = useGymStore(s => s.addNutritionPreset);
  const deleteNutritionPreset = useGymStore(s => s.deleteNutritionPreset);

  React.useEffect(() => {
    const legacySaved = localStorage.getItem('brosky_saved_foods');
    if (legacySaved) {
      try {
        const parsed = JSON.parse(legacySaved);
        if (Array.isArray(parsed)) {
          parsed.forEach(food => {
            addCustomFood(food);
          });
          if (import.meta.env.DEV) console.log(`[Nutrition Migration] Migrated ${parsed.length} custom foods from localStorage to Zustand.`);
        }
      } catch (err) {
        console.error('[Nutrition Migration] Migration failed:', err);
      }
      localStorage.removeItem('brosky_saved_foods');
    }
  }, [addCustomFood]);

  const [showSavedList, setShowSavedList] = useState(false);

  const [showPresetsManager, setShowPresetsManager] = useState(false);
  const [showPresetCreator, setShowPresetCreator] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [presetType, setPresetType] = useState<'static' | 'dynamic'>('static');
  const [presetColor, setPresetColor] = useState('#466bf7');
  
  // static fields
  const [pCal, setPCal] = useState<number | ''>('');
  const [pProt, setPProt] = useState<number | ''>('');
  const [pFat, setPFat] = useState<number | ''>('');
  const [pCarb, setPCarb] = useState<number | ''>('');
  const [pWater, setPWater] = useState<number | ''>('');
  const [pSteps, setPSteps] = useState<number | ''>('');

  // dynamic fields
  const [pOffset, setPOffset] = useState<number>(0);
  const [pProtRatio, setPProtRatio] = useState<number>(2.0);
  const [pFatPercent, setPFatPercent] = useState<number>(25);
  const [pStepsCustom, setPStepsCustom] = useState<number>(10000);
  const [pStepsFromGoal, setPStepsFromGoal] = useState<boolean>(true);
  const [isCreatingCustomFood, setIsCreatingCustomFood] = useState(false);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customCalories, setCustomCalories] = useState<number | ''>('');
  const [customProtein, setCustomProtein] = useState<number | ''>('');
  const [customFat, setCustomFat] = useState<number | ''>('');
  const [customCarbs, setCustomCarbs] = useState<number | ''>('');

  // Поиск еды
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [apiSearchResults, setApiSearchResults] = useState<Array<typeof POPULAR_FOODS[0]>>([]);

  // Закрытие выпадающего списка еды по клику вовне
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container-el')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const combinedCatalog = useMemo(() => {
    return [...savedFoods, ...POPULAR_FOODS];
  }, [savedFoods]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const local = combinedCatalog.filter(f => f.name.toLowerCase().includes(query));
    const merged = [...local, ...apiSearchResults];
    const uniq: typeof POPULAR_FOODS = [];
    const seen = new Set();
    for (const f of merged) {
      if (!seen.has(f.name.toLowerCase())) {
        seen.add(f.name.toLowerCase());
        uniq.push(f);
      }
    }
    return uniq.slice(0, 12);
  }, [searchQuery, combinedCatalog, apiSearchResults]);

  // Запрос в API Open Food Facts
  const handleApiSearch = async (text: string) => {
    if (!text.trim()) {
      setApiSearchResults([]);
      return;
    }
    setIsSearchingApi(true);
    try {
      const response = await fetch(
        `https://ru.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(text)}&search_simple=1&action=process&json=1&lc=ru&page_size=24`
      );
      const data: { products?: OpenFoodFactsProduct[] } = await response.json();
      if (data && data.products) {
        const mapped = data.products
          .filter((p) => p.product_name && p.nutriments)
          .map((p) => {
            const nut = p.nutriments ?? {};
            const calories = Math.round(nut['energy-kcal_100g'] || (nut['energy_100g'] ? nut['energy_100g'] / 4.184 : 0));
            const protein = Math.round((nut['proteins_100g'] || 0) * 10) / 10;
            const fat = Math.round((nut['fat_100g'] || 0) * 10) / 10;
            const carbs = Math.round((nut['carbohydrates_100g'] || 0) * 10) / 10;
            return {
              name: p.product_name ?? '',
              calories,
              protein,
              fat,
              carbs,
              baseWeight: 100
            };
          })
          .filter((p) => p.calories > 0 || p.protein > 0 || p.fat > 0 || p.carbs > 0);
        setApiSearchResults(mapped);
      }
    } catch (e) {
      console.error('Ошибка поиска в API еды:', e);
    } finally {
      setIsSearchingApi(false);
    }
  };

  // Debounce поиска в Open Food Facts — предотвращает сетевой запрос на каждое нажатие клавиши
  const apiSearchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestApiSearchRef = React.useRef(handleApiSearch);
  React.useEffect(() => {
    latestApiSearchRef.current = handleApiSearch;
  });
  const debouncedApiSearch = React.useCallback((query: string) => {
    if (apiSearchDebounceRef.current) clearTimeout(apiSearchDebounceRef.current);
    apiSearchDebounceRef.current = setTimeout(() => latestApiSearchRef.current(query), 350);
  }, []);

  React.useEffect(() => {
    return () => {
      if (apiSearchDebounceRef.current) clearTimeout(apiSearchDebounceRef.current);
    };
  }, []);

  const handleSelectFood = (food: typeof POPULAR_FOODS[0]) => {
    setSelectedBaseFood(food);
    setFoodName(food.name);
    setEatenGrams(100);
    setPortionCalories(food.calories);
    setPortionProtein(food.protein);
    setPortionFat(food.fat);
    setPortionCarbs(food.carbs);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleGramsChange = (grams: number) => {
    setEatenGrams(grams);
    if (selectedBaseFood) {
      const factor = grams / 100;
      setPortionCalories(Math.round(selectedBaseFood.calories * factor));
      setPortionProtein(Math.round(selectedBaseFood.protein * factor * 10) / 10);
      setPortionFat(Math.round(selectedBaseFood.fat * factor * 10) / 10);
      setPortionCarbs(Math.round(selectedBaseFood.carbs * factor * 10) / 10);
    }
  };

  const handleScanBarcode = async (barcode: string) => {
    setIsScanning(false);
    setIsScanningLoading(true);

    try {
      const response = await fetch(
        `https://ru.openfoodfacts.org/api/v2/product/${barcode}.json`
      );
      const data = await response.json();

      if (data && data.status === 1 && data.product) {
        const product = data.product;
        const nameRu = product.product_name_ru || product.product_name;
        const brand = product.brands ? ` (${product.brands})` : '';
        const finalName = `${nameRu}${brand}`.trim() || 'Продукт';

        const nut = product.nutriments ?? {};
        const calories = Math.round(nut['energy-kcal_100g'] || (nut['energy_100g'] ? nut['energy_100g'] / 4.184 : 0));
        const protein = Math.round((nut['proteins_100g'] || 0) * 10) / 10;
        const fat = Math.round((nut['fat_100g'] || 0) * 10) / 10;
        const carbs = Math.round((nut['carbohydrates_100g'] || 0) * 10) / 10;

        const scannedFood = {
          name: finalName,
          calories,
          protein,
          fat,
          carbs,
          baseWeight: 100
        };

        handleSelectFood(scannedFood);
        addCustomFood(scannedFood);
        alert(`Продукт «${finalName}» успешно найден и сохранен!`, 'Успех');
      } else {
        alert('Штрих-код не найден в базе данных OpenFoodFacts. Пожалуйста, введите продукт вручную.', 'Продукт не найден');
      }
    } catch (err) {
      console.error('Error fetching barcode:', err);
      alert('Ошибка соединения с базой данных OpenFoodFacts. Проверьте интернет-соединение.', 'Ошибка');
    } finally {
      setIsScanningLoading(false);
    }
  };

  // Данные за выбранный день
  const currentDayLog = nutritionLogs.find(l => l.date === logDate);
  const eatenCalories = currentDayLog?.calories || 0;
  const eatenProtein = currentDayLog?.protein || 0;
  const eatenFat = currentDayLog?.fat || 0;
  const eatenCarbs = currentDayLog?.carbs || 0;
  const eatenWater = currentDayLog?.water || 0;
  const eatenSteps = currentDayLog?.steps || 0;

  // Расчет суммарного поднятого тоннажа за выбранный день (кг)
  const totalVolumeToday = useMemo(() => {
    const sessionsToday = workoutSessions.filter(s => s.date === logDate);
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
  }, [workoutSessions, logDate]);


  // День силовой тренировки — есть хотя бы одна запись сессии
  const isWorkoutDay = workoutSessions.some(s => s.date === logDate);

  // Генерация планов питания с учетом динамического тоннажа тренировки и бонуса воды
  const plans = useMemo(() => {
    return generateDietPlans(activeProfileForCalc as any, totalVolumeToday, isWorkoutDay);
  }, [activeProfileForCalc, totalVolumeToday, isWorkoutDay]);

  // Определение целей на день (тренировка / отдых)
  const hasWorkout = isWorkoutDay;
  const targetPlan = plans[profile.selectedGoal];
  const autoTarget = hasWorkout ? targetPlan.trainingDay : targetPlan.restDay;

  const selectedPresetId = dailyNutritionPresets[logDate] || 'auto';

  const target = useMemo(() => {
    if (selectedPresetId === 'auto') {
      return autoTarget;
    }
    
    const preset = presets.find(p => p.id === selectedPresetId);
    if (!preset) return autoTarget;
    
    if (preset.type === 'static') {
      const calories = preset.calories ?? autoTarget.calories;
      const pGrams = preset.proteinGrams ?? autoTarget.protein.grams;
      const fGrams = preset.fatGrams ?? autoTarget.fat.grams;
      const cGrams = preset.carbsGrams ?? autoTarget.carbs.grams;
      
      return {
        calories,
        protein: { grams: pGrams, calories: Math.round(pGrams * 4) },
        fat: { grams: fGrams, calories: Math.round(fGrams * 9) },
        carbs: { grams: cGrams, calories: Math.round(cGrams * 4) },
        water: (preset.waterMl ?? autoTarget.water) + (isWorkoutDay && !preset.waterMl ? 0 : 0),
        steps: preset.stepsTarget ?? autoTarget.steps,
      };
    } else {
      const weight = activeProfileForCalc.weight;
      const stepsGoalVal = preset.stepsTargetFromGoal 
        ? autoTarget.steps 
        : (preset.stepsTargetCustom ?? autoTarget.steps);
         
      const offsetFactor = 1 + (preset.kcalOffsetPercent ?? 0) / 100;
      const calories = Math.round(autoTarget.calories * offsetFactor);
      
      const proteinRatio = preset.proteinRatioPerKg ?? 2.0;
      const proteinGrams = Math.round(weight * proteinRatio * 10) / 10;
      const proteinCalories = Math.round(proteinGrams * 4);
      
      const fatPercentVal = preset.fatPercentOfKcal ?? 25;
      const fatCalories = Math.round(calories * (fatPercentVal / 100));
      const fatGrams = Math.round((fatCalories / 9) * 10) / 10;
      
      const carbsCalories = Math.round(calories - proteinCalories - fatCalories);
      const carbsGrams = Math.max(0, Math.round((carbsCalories / 4) * 10) / 10);
      
      // Базовая норма воды + бонус в день тренировки
      const baseWater = Math.round(weight * 40);
      const water = isWorkoutDay ? baseWater + 600 : baseWater;
      
      return {
        calories,
        protein: { grams: proteinGrams, calories: proteinCalories },
        fat: { grams: fatGrams, calories: fatCalories },
        carbs: { grams: carbsGrams, calories: carbsCalories },
        water,
        steps: stepsGoalVal,
      };
    }
  }, [selectedPresetId, presets, autoTarget, activeProfileForCalc, isWorkoutDay]);

  // Расчет планового расхода TDEE (BMR + NEAT + EAT) * 1.10
  const lbm = activeProfileForCalc.weight * (1 - (activeProfileForCalc.fatPercent || 20) / 100);
  const bmrMifflin = 10 * activeProfileForCalc.weight + 6.25 * activeProfileForCalc.height - 5 * activeProfileForCalc.age + (activeProfileForCalc.gender === 'male' ? 5 : -161);
  const bmrKatch = 370 + 21.6 * lbm;
  const bmrAverage = Math.round((bmrMifflin + bmrKatch) / 2);
  const targetNEAT = Math.round(calculateNEAT(target.steps, activeProfileForCalc.weight));
  const targetEAT = hasWorkout 
    ? Math.round(
        activeProfileForCalc.weight * 2.0 + 
        (totalVolumeToday * 0.065) * (activeProfileForCalc.weight / 75)
      ) 
    : 0;
  const targetTDEE = Math.round((bmrAverage + targetNEAT + targetEAT) * 1.10);
  const targetTEF = targetTDEE - bmrAverage - targetNEAT - targetEAT;

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) return;
    
    const newPreset: NutritionPreset = {
      id: 'preset-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      name: presetName.trim(),
      description: presetDescription.trim() || undefined,
      type: presetType,
      isCustom: true,
      color: presetColor,
    };
    
    if (presetType === 'static') {
      newPreset.calories = Number(pCal) || undefined;
      newPreset.proteinGrams = Number(pProt) || undefined;
      newPreset.fatGrams = Number(pFat) || undefined;
      newPreset.carbsGrams = Number(pCarb) || undefined;
      newPreset.waterMl = Number(pWater) || undefined;
      newPreset.stepsTarget = Number(pSteps) || undefined;
    } else {
      newPreset.kcalOffsetPercent = pOffset;
      newPreset.proteinRatioPerKg = pProtRatio;
      newPreset.fatPercentOfKcal = pFatPercent;
      newPreset.stepsTargetFromGoal = pStepsFromGoal;
      if (!pStepsFromGoal) {
        newPreset.stepsTargetCustom = pStepsCustom;
      }
    }
    
    addNutritionPreset(newPreset);
    
    setPresetName('');
    setPresetDescription('');
    setPCal('');
    setPProt('');
    setPFat('');
    setPCarb('');
    setPWater('');
    setPSteps('');
    setPOffset(0);
    setPProtRatio(2.0);
    setPFatPercent(25);
    setPStepsCustom(10000);
    setPStepsFromGoal(true);
    setShowPresetCreator(false);
    
    alert(`Шаблон «${newPreset.name}» успешно создан!`, 'Шаблоны КБЖУ');
  };

  const handleDeletePresetClick = async (presetId: string, name: string) => {
    if (await confirm({
      title: 'Удалить шаблон питания',
      message: `Вы уверены, что хотите удалить шаблон «${name}»? Это переключит все дни, где он использовался, на автоматический расчет.`,
      confirmText: 'Удалить',
      isDestructive: true
    })) {
      deleteNutritionPreset(presetId);
    }
  };

  const previewValues = useMemo(() => {
    if (presetType === 'static') {
      return {
        calories: Number(pCal) || 0,
        protein: Number(pProt) || 0,
        fat: Number(pFat) || 0,
        carbs: Number(pCarb) || 0,
        water: Number(pWater) || 0,
        steps: Number(pSteps) || 0,
      };
    } else {
      const weight = activeProfileForCalc.weight;
      const stepsGoalVal = pStepsFromGoal 
        ? autoTarget.steps 
        : pStepsCustom;
      const calories = Math.round(autoTarget.calories * (1 + pOffset / 100));
      const proteinGrams = Math.round(weight * pProtRatio * 10) / 10;
      const proteinCalories = Math.round(proteinGrams * 4);
      
      const fatCalories = Math.round(calories * (pFatPercent / 100));
      const fatGrams = Math.round((fatCalories / 9) * 10) / 10;
      
      const carbsCalories = Math.round(calories - proteinCalories - fatCalories);
      const carbsGrams = Math.max(0, Math.round((carbsCalories / 4) * 10) / 10);
      
      return {
        calories,
        protein: proteinGrams,
        fat: fatGrams,
        carbs: carbsGrams,
        water: Math.round(weight * 40),
        steps: stepsGoalVal,
      };
    }
  }, [presetType, pCal, pProt, pFat, pCarb, pWater, pSteps, pOffset, pProtRatio, pFatPercent, pStepsCustom, pStepsFromGoal, activeProfileForCalc, autoTarget]);

  // Остаток калорий
  const leftCalories = target.calories - eatenCalories;

  // Проценты для колец активности
  const percentCal = target.calories > 0 ? Math.min((eatenCalories / target.calories) * 100, 100) : 0;
  const percentSteps = target.steps > 0 ? Math.min((eatenSteps / target.steps) * 100, 100) : 0;
  const percentWater = target.water > 0 ? Math.min((eatenWater / target.water) * 100, 100) : 0;

  const rawPercentProtein = target.protein.grams > 0 ? (eatenProtein / target.protein.grams) * 100 : 0;
  const rawPercentFat = target.fat.grams > 0 ? (eatenFat / target.fat.grams) * 100 : 0;
  const rawPercentCarbs = target.carbs.grams > 0 ? (eatenCarbs / target.carbs.grams) * 100 : 0;

  const strokePercentProtein = Math.min(rawPercentProtein, 100);
  const strokePercentFat = Math.min(rawPercentFat, 100);
  const strokePercentCarbs = Math.min(rawPercentCarbs, 100);

  // Быстрый инкремент Воды и Шагов
  const handleQuickAddWater = (amount: number) => {
    const existingItems = currentDayLog?.items || [];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    const newItems = [...existingItems, {
      id: generateWaterId(),
      name: `Вода: +${amount} мл`,
      grams: amount,
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      time: timeStr
    }];

    addNutritionLog({
      date: logDate,
      calories: eatenCalories,
      protein: eatenProtein,
      fat: eatenFat,
      carbs: eatenCarbs,
      water: eatenWater + amount,
      steps: eatenSteps,
      items: newItems,
    });
  };

  const handleQuickAddSteps = (amount: number) => {
    const existingItems = currentDayLog?.items || [];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    const newItems = [...existingItems, {
      id: generateStepsId(),
      name: `Шаги: +${amount}`,
      grams: amount,
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      time: timeStr
    }];

    addNutritionLog({
      date: logDate,
      calories: eatenCalories,
      protein: eatenProtein,
      fat: eatenFat,
      carbs: eatenCarbs,
      water: eatenWater,
      steps: eatenSteps + amount,
      items: newItems,
    });
  };

  // Переключение дат
  const handleShiftDate = (days: number) => {
    const d = new Date(logDate);
    d.setDate(d.getDate() + days);
    setLogDate(d.toISOString().split('T')[0]);
  };

  // Логирование Еды
  const handleSavePortion = (e: React.FormEvent) => {
    e.preventDefault();
    if (portionCalories <= 0 && portionProtein <= 0 && portionFat <= 0 && portionCarbs <= 0) return;

    const currentLog = nutritionLogs.find((l) => l.date === logDate);
    const existingItems = currentLog?.items || [];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    const newItems = [...existingItems, {
      id: 'food-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      name: foodName.trim() || 'Прием пищи',
      grams: eatenGrams,
      calories: portionCalories,
      protein: portionProtein,
      fat: portionFat,
      carbs: portionCarbs,
      time: timeStr,
    }];

    addNutritionLog({
      date: logDate,
      calories: (currentLog?.calories || 0) + portionCalories,
      protein: Math.round(((currentLog?.protein || 0) + portionProtein) * 10) / 10,
      fat: Math.round(((currentLog?.fat || 0) + portionFat) * 10) / 10,
      carbs: Math.round(((currentLog?.carbs || 0) + portionCarbs) * 10) / 10,
      water: currentLog?.water || 0,
      steps: currentLog?.steps || 0,
      items: newItems,
    });

    setFoodName('');
    setSelectedBaseFood(null);
    setEatenGrams(100);
    setPortionCalories(0);
    setPortionProtein(0);
    setPortionFat(0);
    setPortionCarbs(0);
  };


  const handleDeleteFoodItem = (itemId: string) => {
    if (!currentDayLog) return;
    if (itemId === 'legacy-entry') {
      deleteNutritionLog(logDate);
      return;
    }
    const itemToDelete = currentDayLog.items?.find(item => item.id === itemId);
    if (!itemToDelete) return;
    
    const updatedItems = currentDayLog.items?.filter(item => item.id !== itemId) || [];
    
    let updatedWater = currentDayLog.water || 0;
    let updatedSteps = currentDayLog.steps || 0;
    
    if (itemId.startsWith('water-')) {
      updatedWater = Math.max(0, updatedWater - itemToDelete.grams);
    } else if (itemId.startsWith('steps-')) {
      updatedSteps = Math.max(0, updatedSteps - itemToDelete.grams);
    }
    
    addNutritionLog({
      date: logDate,
      calories: Math.max(0, currentDayLog.calories - itemToDelete.calories),
      protein: Math.max(0, Math.round((currentDayLog.protein - itemToDelete.protein) * 10) / 10),
      fat: Math.max(0, Math.round((currentDayLog.fat - itemToDelete.fat) * 10) / 10),
      carbs: Math.max(0, Math.round((currentDayLog.carbs - itemToDelete.carbs) * 10) / 10),
      water: updatedWater,
      steps: updatedSteps,
      items: updatedItems,
    });
  };

  const handleCreateCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFoodName.trim()) return;
    const newFood = {
      name: customFoodName.trim(),
      calories: Number(customCalories) || 0,
      protein: Number(customProtein) || 0,
      fat: Number(customFat) || 0,
      carbs: Number(customCarbs) || 0,
      baseWeight: 100
    };
    addCustomFood(newFood);
    
    setCustomFoodName('');
    setCustomCalories('');
    setCustomProtein('');
    setCustomFat('');
    setCustomCarbs('');
    setIsCreatingCustomFood(false);
    alert(`Блюдо «${newFood.name}» успешно создано и сохранено!`, 'Моя еда');
  };

  const getDisplayItems = (): NutritionFoodItem[] => {
    if (!currentDayLog) return [];
    if (currentDayLog.items && currentDayLog.items.length > 0) {
      return [...currentDayLog.items].reverse();
    }
    if (currentDayLog.calories > 0 || currentDayLog.protein > 0 || currentDayLog.fat > 0 || currentDayLog.carbs > 0) {
      return [{
        id: 'legacy-entry',
        name: 'Быстрый ввод КБЖУ',
        grams: 0,
        calories: currentDayLog.calories,
        protein: currentDayLog.protein,
        fat: currentDayLog.fat,
        carbs: currentDayLog.carbs
      }];
    }
    return [];
  };
  const displayItems = getDisplayItems();

  const handleFillToPlan = () => {
    addNutritionLog({
      date: logDate,
      calories: target.calories,
      protein: target.protein.grams,
      fat: target.fat.grams,
      carbs: target.carbs.grams,
      water: target.water,
      steps: currentDayLog?.steps || target.steps,
      items: currentDayLog?.items || [],
    });
  };

  const handleResetDay = async () => {
    if (await confirm({
      title: 'Сброс данных за день',
      message: 'Вы действительно хотите очистить все съеденное за этот день?',
      confirmText: 'Очистить',
      isDestructive: true
    })) {
      deleteNutritionLog(logDate);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Шапка с датой */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/40 border border-gym-border/40 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div>
          <h3 className="text-lg font-black tracking-tight text-gray-800 flex items-center gap-2">
            <Calendar size={18} className="text-gym-accent" />
            Баланс активности дня
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white/50 border border-gym-border/60 rounded-xl shadow-xs h-9">
            <button 
              onClick={() => handleShiftDate(-1)} 
              className="h-9 w-9 flex items-center justify-center hover:bg-gray-150 transition-all cursor-pointer text-gray-500 rounded-l-xl border-r border-gym-border/30 btn-interactive btn-interactive-nav-left"
            >
              <ChevronLeft size={14} />
            </button>
            <DatePicker
              value={logDate}
              onChange={setLogDate}
              align="right"
              className="!border-0 !bg-transparent !shadow-none px-3 text-xs font-bold text-gray-700 hover:bg-gray-100/50 transition-all h-9 flex items-center justify-center"
            />
            <button 
              onClick={() => handleShiftDate(1)} 
              className="h-9 w-9 flex items-center justify-center hover:bg-gray-150 transition-all cursor-pointer text-gray-500 rounded-r-xl border-l border-gym-border/30 btn-interactive btn-interactive-nav-right"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          
          <button
            onClick={() => setIsAdvisorModalOpen(true)}
            className="bg-gradient-to-r from-gym-accent to-purple-600 hover:opacity-95 text-white shadow-xs text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 btn-interactive"
          >
            <Sparkles size={14} className="text-yellow-300" />
            Умный добор БЖУ
          </button>
          <button
            onClick={handleFillToPlan}
            className="bg-gym-accent/10 hover:bg-gym-accent/20 text-gym-accent border border-gym-accent/20 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 btn-interactive"
          >
            <Sparkles size={14} />
            По плану
          </button>
          {currentDayLog && (
            <button
              onClick={handleResetDay}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 btn-interactive"
            >
              <RefreshCw size={14} />
              Сбросить
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        {/* ЛЕВАЯ КОЛОНКА (2/3 ширины на ПК): Баланс, Метрики, Логгер и Дневник питания */}
        <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
          
          {/* СЕКЦИЯ КОЛЕЦ И МЕТРИК ВОДЫ/ШАГОВ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            
            {/* 3D Flip Карточка (2/3 ширины) */}
            <div className="md:col-span-2 perspective-1000 w-full h-[375px] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl rounded-3xl">
              <div 
                className={`transform-style-3d relative w-full h-full transition-transform duration-500 ease-out cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                
                {/* Лицевая сторона: ФАКТ СЪЕДЕНО + КОЛЬЦА */}
                <div className="backface-hidden absolute inset-0 w-full h-full rounded-3xl p-5 bg-white/80 border border-gym-border/40 shadow-xl backdrop-blur-md flex flex-col items-center justify-between">
                  
                  <div className="flex justify-between items-center w-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span>АКТИВНОСТЬ (ФАКТ)</span>
                    <span className="text-gym-accent text-[9px] lowercase font-bold">нажмите для планов</span>
                  </div>

                  {/* SVG Кольца */}
                  <div className="relative w-48 h-48 my-2 svg-ring-container">
                    <svg width="100%" height="100%" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(244, 63, 94, 0.08)" strokeWidth="11" />
                      <circle cx="100" cy="100" r="72" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="11" />
                      <circle cx="100" cy="100" r="56" fill="none" stroke="rgba(59, 130, 246, 0.08)" strokeWidth="11" />
                      
                      {/* Калории (Rose) */}
                      <circle cx="100" cy="100" r="88" fill="none" stroke="#f43f5e" strokeWidth="11"
                              strokeDasharray="553" strokeDashoffset={553 - (553 * percentCal) / 100}
                              strokeLinecap="round" transform="rotate(-90 100 100)" 
                              className="transition-all duration-500 ease-out"
                              style={{ opacity: percentCal > 0 ? 1 : 0 }} />
                      {/* Шаги (Emerald) */}
                      <circle cx="100" cy="100" r="72" fill="none" stroke="#10b981" strokeWidth="11"
                              strokeDasharray="452" strokeDashoffset={452 - (452 * percentSteps) / 100}
                              strokeLinecap="round" transform="rotate(-90 100 100)" 
                              className="transition-all duration-500 ease-out"
                              style={{ opacity: percentSteps > 0 ? 1 : 0 }} />
                      {/* Вода (Blue) */}
                      <circle cx="100" cy="100" r="56" fill="none" stroke="#3b82f6" strokeWidth="11"
                              strokeDasharray="352" strokeDashoffset={352 - (352 * percentWater) / 100}
                              strokeLinecap="round" transform="rotate(-90 100 100)" 
                              className="transition-all duration-500 ease-out"
                              style={{ opacity: percentWater > 0 ? 1 : 0 }} />
                    </svg>
                    <div className="svg-ring-center">
                      <div className={`center-val font-display ${leftCalories < 0 ? 'text-rose-600' : 'text-gym-accent'}`}>
                        {leftCalories >= 0 ? leftCalories : `+${Math.abs(leftCalories)}`}
                      </div>
                      <div className="center-label">{leftCalories >= 0 ? 'ккал осталось' : 'ккал перебор'}</div>
                    </div>
                  </div>

                  {/* Фактические КБЖУ под кольцами */}
                  <div className="kbju-summary-front w-full mt-1">
                    <div className="flex justify-between items-center text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                      <span>СЪЕДЕНО СЕГОДНЯ:</span>
                      <span className="font-mono text-gray-800 font-black">{eatenCalories} ккал</span>
                    </div>

                    <div className="flex justify-between w-full gap-4 border-t border-gym-border/30 pt-3 mt-1.5">
                      
                      {/* Белки (Orange) */}
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-9 h-9 flex items-center justify-center relative glow-active-wrapper ${rawPercentProtein >= 100 ? 'success' : ''}`}>
                          <svg width="100%" height="100%" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="14.5" fill="none" stroke="rgba(249, 115, 22, 0.06)" strokeWidth="3.5" />
                            <circle cx="18" cy="18" r="14.5" fill="none" stroke="#f97316" strokeWidth="3.5"
                                    strokeLinecap="round" strokeDasharray="91" strokeDashoffset={91 - (91 * strokePercentProtein) / 100}
                                    transform="rotate(-90 18 18)" className="transition-all duration-300"
                                    style={rawPercentProtein >= 100 ? { filter: 'drop-shadow(0 0 3px #f97316)', opacity: eatenProtein > 0 ? 1 : 0 } : { opacity: eatenProtein > 0 ? 1 : 0 }} />
                          </svg>
                          <span className="absolute text-[9px] font-black text-gray-700">Б</span>
                        </div>
                        <span className="text-xs font-extrabold text-gray-800 mt-1.5">{eatenProtein}г</span>
                        <span className="text-[9px] font-semibold text-gray-400">/ {target.protein.grams}г</span>
                      </div>

                      {/* Жиры (Yellow) */}
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-9 h-9 flex items-center justify-center relative glow-active-wrapper ${rawPercentFat >= 100 ? 'success' : ''}`}>
                          <svg width="100%" height="100%" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="14.5" fill="none" stroke="rgba(234, 179, 8, 0.06)" strokeWidth="3.5" />
                            <circle cx="18" cy="18" r="14.5" fill="none" stroke="#eab308" strokeWidth="3.5"
                                    strokeLinecap="round" strokeDasharray="91" strokeDashoffset={91 - (91 * strokePercentFat) / 100}
                                    transform="rotate(-90 18 18)" className="transition-all duration-300"
                                    style={rawPercentFat >= 100 ? { filter: 'drop-shadow(0 0 3px #eab308)', opacity: eatenFat > 0 ? 1 : 0 } : { opacity: eatenFat > 0 ? 1 : 0 }} />
                          </svg>
                          <span className="absolute text-[9px] font-black text-gray-700">Ж</span>
                        </div>
                        <span className="text-xs font-extrabold text-gray-800 mt-1.5">{eatenFat}г</span>
                        <span className="text-[9px] font-semibold text-gray-400">/ {target.fat.grams}г</span>
                      </div>

                      {/* Углеводы (Cyan) */}
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-9 h-9 flex items-center justify-center relative glow-active-wrapper ${rawPercentCarbs >= 100 ? 'success' : ''}`}>
                          <svg width="100%" height="100%" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="14.5" fill="none" stroke="rgba(6, 182, 212, 0.06)" strokeWidth="3.5" />
                            <circle cx="18" cy="18" r="14.5" fill="none" stroke="#06b6d4" strokeWidth="3.5"
                                    strokeLinecap="round" strokeDasharray="91" strokeDashoffset={91 - (91 * strokePercentCarbs) / 100}
                                    transform="rotate(-90 18 18)" className="transition-all duration-300"
                                    style={rawPercentCarbs >= 100 ? { filter: 'drop-shadow(0 0 3px #06b6d4)', opacity: eatenCarbs > 0 ? 1 : 0 } : { opacity: eatenCarbs > 0 ? 1 : 0 }} />
                          </svg>
                          <span className="absolute text-[9px] font-black text-gray-700">У</span>
                        </div>
                        <span className="text-xs font-extrabold text-gray-800 mt-1.5">{eatenCarbs}г</span>
                        <span className="text-[9px] font-semibold text-gray-400">/ {target.carbs.grams}г</span>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Обратная сторона: ЦЕЛЬ ПИТАНИЯ + ПЛАН ТРАТ */}
                <div className="backface-hidden rotate-y-180 absolute inset-0 w-full h-full rounded-3xl p-5 bg-white/80 border border-gym-border/40 shadow-xl backdrop-blur-md flex flex-col justify-center gap-5">
                  
                  {/* Целевые планы еды */}
                  <div>
                    <div className="plan-section-title">ЦЕЛЬ ПИТАНИЯ (ПЛАН)</div>
                    <div className="text-xl font-black font-display text-gray-800 mt-1">{target.calories} ккал</div>
                    <div className="flex justify-between font-bold text-xs mt-1.5 text-gray-600">
                      <span className="text-orange-600">Белки: {target.protein.grams}г</span>
                      <span className="text-yellow-600">Жиры: {target.fat.grams}г</span>
                      <span className="text-cyan-600">Углеводы: {target.carbs.grams}г</span>
                    </div>
                  </div>

                  {/* Целевые планы трат */}
                  <div>
                    <div className="plan-section-title">ПЛАН РАСХОДА (TDEE)</div>
                    <div className="text-xl font-black font-display text-emerald-600 mt-1">{targetTDEE} ккал</div>
                    <div className="flex flex-col gap-1 text-[11px] mt-2 text-gray-500 font-medium">
                      <div className="flex justify-between"><span>Базовый обмен (BMR):</span><span className="font-bold text-gray-700">{bmrAverage} ккал</span></div>
                      <div className="flex justify-between"><span>Бытовой расход (NEAT):</span><span className="font-bold text-gray-700">{targetNEAT} ккал</span></div>
                      <div className="flex justify-between">
                        <span>Тренировочная работа (EAT):</span>
                        <span className="font-bold text-gray-700">
                          {targetEAT} ккал {totalVolumeToday > 0 && <span className="text-[10px] text-gray-400 font-mono">({totalVolumeToday} кг)</span>}
                        </span>
                      </div>
                      <div className="flex justify-between"><span>Термический эффект пищи (TEF):</span><span className="font-bold text-gray-700">{targetTEF} ккал</span></div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Карточки Воды и Шагов (1/3 ширины) */}
            <div className="md:col-span-1 flex flex-col gap-5">
              
              {/* Плитка Воды */}
              <div className="glass-card rounded-2xl p-4 flex flex-col justify-between h-[178px] relative group border border-gym-border/40 bg-white/80 shadow-md">
                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1 text-blue-500">
                    <Droplet size={12} className="fill-blue-500/18 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" /> Вода
                  </span>
                  {/* Вода */}
                </div>
                <div>
                  <div className="text-xl font-black font-display text-blue-600">{eatenWater} мл</div>
                  <div className="text-[10px] text-gray-400 mt-1 font-semibold">
                    План: {target.water} мл
                    {isWorkoutDay && <span className="text-blue-400 ml-1">(день тренировки)</span>}
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button 
                    onClick={() => handleQuickAddWater(250)} 
                    className="flex-1 bg-blue-50/50 hover:bg-blue-100/60 text-blue-600 text-[10px] font-bold py-1.5 rounded-lg border border-blue-200/20 cursor-pointer btn-interactive"
                  >
                    +250
                  </button>
                  <button 
                    onClick={() => handleQuickAddWater(500)} 
                    className="flex-1 bg-blue-50/50 hover:bg-blue-100/60 text-blue-600 text-[10px] font-bold py-1.5 rounded-lg border border-blue-200/20 cursor-pointer btn-interactive"
                  >
                    +500
                  </button>
                </div>
              </div>


              {/* Плитка Шагов */}
              <div className="glass-card rounded-2xl p-4 flex flex-col justify-between h-[178px] relative group border border-gym-border/40 bg-white/80 shadow-md">
                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1 text-emerald-500">
                    <Footprints size={12} className="group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" /> Шаги
                  </span>
                </div>
                <div>
                  <div className="text-xl font-black font-display text-emerald-600">{eatenSteps}</div>
                  <div className="text-[10px] text-gray-400 mt-1 font-semibold">План: {target.steps}</div>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button 
                    onClick={() => handleQuickAddSteps(500)} 
                    className="flex-1 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-600 text-[10px] font-bold py-1.5 rounded-lg border border-emerald-200/20 cursor-pointer btn-interactive"
                  >
                    +500
                  </button>
                  <button 
                    onClick={() => handleQuickAddSteps(1000)} 
                    className="flex-1 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-600 text-[10px] font-bold py-1.5 rounded-lg border border-emerald-200/20 cursor-pointer btn-interactive"
                  >
                    +1000
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Встроенный логгер еды (Добавить прием пищи) */}
          <div className="glass-panel rounded-3xl p-6 shadow-xl space-y-4">
            <div className="border-b border-gym-border/40 pb-3 flex justify-between items-center">
              <h4 className="text-xs font-black tracking-tight text-gray-700 uppercase">
                Добавить прием пищи
              </h4>
              <button 
                type="button" 
                onClick={() => setShowSavedList(!showSavedList)}
                className="text-[10px] bg-gym-accent/10 border border-gym-accent/20 text-gym-accent px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer btn-interactive"
              >
                {showSavedList ? 'База' : 'Моя еда'}
              </button>
            </div>

            <>
              {!showSavedList ? (
                <form onSubmit={handleSavePortion} className="space-y-4 animate-fadeIn">
                  <div className="relative search-container-el">
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Продукт или блюдо</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="text"
                          value={foodName}
                          onChange={(e) => {
                            setFoodName(e.target.value);
                            setSearchQuery(e.target.value);
                            setShowDropdown(true);
                            debouncedApiSearch(e.target.value);
                          }}
                          onFocus={() => setShowDropdown(true)}
                          placeholder="Куриное филе, рис вареный, банан..."
                          className="w-full bg-white/70 border border-gym-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-gym-accent"
                        />
                        {isSearchingApi ? (
                          <LoaderPulse size={14} className="text-gym-accent absolute left-3" />
                        ) : (
                          <Search size={14} className="text-gym-accent/70 absolute left-3 fill-gym-accent/5" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsScanning(true)}
                        className="flex items-center justify-center bg-white/70 border border-gym-border hover:bg-white hover:border-gym-accent text-gray-500 hover:text-gym-accent rounded-xl w-[42px] h-[42px] transition-all cursor-pointer btn-interactive flex-shrink-0"
                        title="Сканировать штрих-код"
                      >
                        <Barcode size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPhotoScanning(true)}
                        className="flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl w-[42px] h-[42px] transition-all cursor-pointer btn-interactive flex-shrink-0 shadow-sm shadow-amber-500/20 hover:scale-105"
                        title="Смарт-Сканирование тарелки по фото (Computer Vision Meal)"
                      >
                        <Camera size={18} />
                      </button>
                    </div>

                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 z-50 bg-white/95 border border-gym-border rounded-xl shadow-lg mt-1 max-h-56 overflow-y-auto divide-y divide-gym-border/30 backdrop-blur-md">
                        {searchResults.map((f, i) => {
                          const isLocal = combinedCatalog.some(c => c.name.toLowerCase() === f.name.toLowerCase());
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectFood(f)}
                              className="w-full px-3 py-2.5 text-left hover:bg-gym-accent/5 text-xs text-gray-700 flex justify-between items-center transition-all cursor-pointer group/item"
                            >
                              <div className="flex items-center gap-2">
                                {isLocal ? (
                                  <BookOpen size={13} className="text-gym-accent/60 fill-gym-accent/10" />
                                ) : (
                                  <Sparkles size={13} className="text-amber-500/70 fill-amber-500/10" />
                                )}
                                <span className="font-bold group-hover/item:text-gym-accent transition-colors">{f.name}</span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-mono">{f.calories} ккал / Б:{f.protein} Ж:{f.fat} У:{f.carbs}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50/50 p-3 rounded-xl border border-gym-border/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Грамм съедено</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={eatenGrams || ''}
                          onChange={(e) => handleGramsChange(parseInt(e.target.value) || 0)}
                          className="w-16 bg-white border border-gym-border rounded-lg px-2 py-0.5 text-xs text-center font-bold text-gym-accent focus:outline-none focus:border-gym-accent"
                        />
                        <span className="text-xs font-bold text-gray-400">г</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="5"
                      value={eatenGrams || 0}
                      onChange={(e) => handleGramsChange(parseInt(e.target.value) || 0)}
                      className="w-full accent-gym-accent cursor-pointer"
                    />
                    {selectedBaseFood && (
                      <p className="text-[9px] text-gray-400 text-center font-mono">
                        * Рассчитано на основе {selectedBaseFood.calories} ккал на 100г
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 text-center">Калории (ккал)</label>
                      <input
                        type="number"
                        value={portionCalories || ''}
                        onChange={(e) => {
                          setPortionCalories(parseInt(e.target.value) || 0);
                          setSelectedBaseFood(null);
                        }}
                        placeholder="0"
                        className="w-full bg-white/70 border border-gym-border rounded-xl px-3 py-2 text-sm text-gray-800 text-center font-bold focus:outline-none focus:border-gym-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 text-center">Белки (г)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={portionProtein || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPortionProtein(val);
                          setSelectedBaseFood(null);
                          setPortionCalories(Math.round(val * 4 + portionFat * 9 + portionCarbs * 4));
                        }}
                        placeholder="0.0"
                        className="w-full bg-white/70 border border-gym-border rounded-xl px-3 py-2 text-sm text-gray-800 text-center font-semibold focus:outline-none focus:border-gym-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 text-center">Жиры (г)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={portionFat || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPortionFat(val);
                          setSelectedBaseFood(null);
                          setPortionCalories(Math.round(portionProtein * 4 + val * 9 + portionCarbs * 4));
                        }}
                        placeholder="0.0"
                        className="w-full bg-white/70 border border-gym-border rounded-xl px-3 py-2 text-sm text-gray-800 text-center font-semibold focus:outline-none focus:border-gym-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 text-center">Углеводы (г)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={portionCarbs || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPortionCarbs(val);
                          setSelectedBaseFood(null);
                          setPortionCalories(Math.round(portionProtein * 4 + portionFat * 9 + val * 4));
                        }}
                        placeholder="0.0"
                        className="w-full bg-white/70 border border-gym-border rounded-xl px-3 py-2 text-sm text-gray-800 text-center font-semibold focus:outline-none focus:border-gym-accent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gym-accent hover:bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer btn-interactive"
                  >
                    <Plus size={16} />
                    Добавить порцию
                  </button>
                </form>
              ) : (
                /* Сохраненная еда */
                <div className="space-y-4 min-h-[250px] flex flex-col justify-between animate-fadeIn">
                  <div>
                    {!isCreatingCustomFood ? (
                      <button
                        onClick={() => setIsCreatingCustomFood(true)}
                        className="w-full mb-4 py-2 bg-gym-accent/10 hover:bg-gym-accent/20 border border-gym-accent/20 text-gym-accent font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer btn-interactive"
                      >
                        <Plus size={14} />
                        Создать свое блюдо
                      </button>
                    ) : (
                      <form onSubmit={handleCreateCustomFood} className="bg-gray-50/50 p-3.5 rounded-xl border border-gym-border/30 mb-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-gym-border/20 pb-1.5 mb-2">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Новое блюдо (на 100г)</span>
                          <button
                            type="button"
                            onClick={() => setIsCreatingCustomFood(false)}
                            className="text-[9px] text-gray-400 hover:text-gray-600 font-bold"
                          >
                            Отмена
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Название блюда"
                          value={customFoodName}
                          onChange={(e) => setCustomFoodName(e.target.value)}
                          className="w-full bg-white border border-gym-border rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-gym-accent"
                        />
                        <div className="grid grid-cols-4 gap-2">
                          <input
                            type="number"
                            placeholder="Ккал"
                            value={customCalories}
                            onChange={(e) => setCustomCalories(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                            className="w-full bg-white border border-gym-border rounded-lg px-1.5 py-1.5 text-xs text-center font-bold focus:outline-none focus:border-gym-accent"
                          />
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Белки"
                            value={customProtein}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                              setCustomProtein(val);
                              const p = val === '' ? 0 : val;
                              const f = customFat === '' ? 0 : customFat;
                              const c = customCarbs === '' ? 0 : customCarbs;
                              setCustomCalories(Math.round(p * 4 + f * 9 + c * 4));
                            }}
                            className="w-full bg-white border border-gym-border rounded-lg px-1.5 py-1.5 text-xs text-center focus:outline-none focus:border-gym-accent"
                          />
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Жиры"
                            value={customFat}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                              setCustomFat(val);
                              const p = customProtein === '' ? 0 : customProtein;
                              const f = val === '' ? 0 : val;
                              const c = customCarbs === '' ? 0 : customCarbs;
                              setCustomCalories(Math.round(p * 4 + f * 9 + c * 4));
                            }}
                            className="w-full bg-white border border-gym-border rounded-lg px-1.5 py-1.5 text-xs text-center focus:outline-none focus:border-gym-accent"
                          />
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Углев"
                            value={customCarbs}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                              setCustomCarbs(val);
                              const p = customProtein === '' ? 0 : customProtein;
                              const f = customFat === '' ? 0 : customFat;
                              const c = val === '' ? 0 : val;
                              setCustomCalories(Math.round(p * 4 + f * 9 + c * 4));
                            }}
                            className="w-full bg-white border border-gym-border rounded-lg px-1.5 py-1.5 text-xs text-center focus:outline-none focus:border-gym-accent"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2 bg-gym-accent hover:bg-blue-600 text-white font-bold text-xs rounded-lg transition-all cursor-pointer btn-interactive"
                        >
                          Сохранить блюдо
                        </button>
                      </form>
                    )}

                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {savedFoods.length === 0 ? (
                        <p className="text-xs text-gray-400 py-8 text-center">Ваша база пуста. Создайте свое блюдо выше.</p>
                      ) : (
                        savedFoods.map((f, i) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-white/50 border border-gym-border/40 rounded-xl text-xs hover:border-gym-accent/35 transition-all">
                            <div>
                              <p className="font-bold text-gray-700">{f.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{f.calories} ккал · Б:{f.protein} Ж:{f.fat} У:{f.carbs}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleSelectFood(f)}
                                className="px-2 py-1 bg-gym-accent text-white font-bold text-[10px] rounded-lg hover:bg-blue-600 transition-all cursor-pointer btn-interactive"
                              >
                                Выбрать
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteCustomFood(f.name)}
                                className="p-1 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                title="Удалить из списка"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setShowSavedList(false);
                      setIsCreatingCustomFood(false);
                    }}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-xs border border-gym-border/30 rounded-xl transition-all cursor-pointer btn-interactive"
                  >
                    Вернуться к форме
                  </button>
                </div>
              )}
            </>
          </div>

          {/* Хронология (Дневник съеденного) */}
          <div className="glass-panel rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-md font-extrabold text-gray-800 border-b border-gym-border/40 pb-3 mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-gym-accent" />
                Хронология дня
              </h3>

              <div>
                {displayItems.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs">
                    Дневник пуст. Внесите порцию еды или добавьте активность.
                  </div>
                ) : (
                  <>
                    {/* Таблица для ПК */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/40 border-b border-gym-border/30 text-gray-500 font-bold uppercase tracking-wider text-[9px]">
                            <th className="p-3">Продукт / Время</th>
                            <th className="p-3">Калории</th>
                            <th className="p-3">Б / Ж / У (г)</th>
                            <th className="p-3 text-center">Действие</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayItems.map((item) => (
                            <tr key={item.id} className="border-b border-gym-border/40 hover:bg-white/20 transition-colors animate-fadeInUp">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-700">{item.name}</span>
                                  {item.time && (
                                    <span className="text-[9px] bg-gym-accent/10 text-gym-accent font-bold px-1.5 py-0.5 rounded-md font-mono">
                                      {item.time}
                                    </span>
                                  )}
                                </div>
                                {item.grams > 0 && !item.id.startsWith('water-') && !item.id.startsWith('steps-') && (
                                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.grams} г</div>
                                )}
                              </td>
                              <td className="p-3 font-bold text-gray-800">
                                {item.id.startsWith('water-') || item.id.startsWith('steps-') ? '—' : `${item.calories} ккал`}
                              </td>
                              <td className="p-3 font-semibold text-gray-600">
                                {item.id.startsWith('water-') || item.id.startsWith('steps-') ? '—' : `${item.protein} / ${item.fat} / ${item.carbs}`}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteFoodItem(item.id)}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-all cursor-pointer btn-interactive"
                                  title="Удалить продукт"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Мобильная раскладка */}
                    <div className="block sm:hidden space-y-3">
                      {displayItems.map((item) => (
                        <div key={item.id} className="bg-white/40 border border-gym-border/40 rounded-2xl p-4 flex justify-between items-center shadow-xs animate-fadeInUp">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700 leading-tight">{item.name}</span>
                              {item.time && (
                                <span className="text-[9px] bg-gym-accent/10 text-gym-accent font-bold px-1.5 py-0.5 rounded-md font-mono">
                                  {item.time}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {item.grams > 0 && !item.id.startsWith('water-') && !item.id.startsWith('steps-') && (
                                <span className="text-[10px] text-gray-400 font-mono bg-gray-100/60 px-1.5 py-0.5 rounded-sm">
                                  {item.grams} г
                                </span>
                              )}
                              {!(item.id.startsWith('water-') || item.id.startsWith('steps-')) && (
                                <span className="text-[10.5px] font-bold text-gym-accent font-mono">
                                  {item.calories} ккал
                                </span>
                              )}
                            </div>
                            {!(item.id.startsWith('water-') || item.id.startsWith('steps-')) && (
                              <div className="text-[10px] text-gray-500 font-semibold mt-1">
                                Б: <span className="text-orange-600">{item.protein}г</span> | Ж: <span className="text-yellow-600">{item.fat}г</span> | У: <span className="text-cyan-600">{item.carbs}г</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteFoodItem(item.id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2.5 rounded-xl transition-all cursor-pointer flex-shrink-0 btn-interactive"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ПРАВАЯ КОЛОНКА (1/3 ширины на ПК): Сайдбар пресетов и шаблонов КБЖУ */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel rounded-3xl p-6 shadow-xl space-y-4">
            <div className="border-b border-gym-border/40 pb-3">
              <h4 className="text-xs font-black tracking-tight text-gray-700 uppercase">
                Режимы и Шаблоны КБЖУ
              </h4>
            </div>

            <div className="flex flex-col gap-2.5">
              
              {/* Единая кнопка Авто */}
              {/* Единая кнопка Авто */}
              <div className="relative">
                <button
                  onClick={() => setDailyNutritionPreset(logDate, 'auto')}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                    selectedPresetId === 'auto'
                      ? profile.selectedGoal === 'recomp'
                        ? 'border-purple-500 bg-purple-50/40 text-purple-700 shadow-sm shadow-purple-500/5'
                        : profile.selectedGoal === 'cut'
                        ? 'border-rose-500 bg-rose-50/40 text-rose-700 shadow-sm shadow-rose-500/5'
                        : profile.selectedGoal === 'bulk'
                        ? 'border-emerald-500 bg-emerald-50/40 text-emerald-700 shadow-sm shadow-emerald-500/5'
                        : 'border-blue-500 bg-blue-50/40 text-blue-700 shadow-sm shadow-blue-500/5'
                      : 'border-gym-border/50 bg-gray-50/50 hover:bg-white text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={13} className={selectedPresetId === 'auto' ? 'text-gym-accent' : 'text-gray-400'} />
                    <span>Авто (Базовый режим)</span>
                  </div>
                  <span 
                    onClick={(e) => {
                      e.stopPropagation(); // предотвращаем активацию пресета при клике на смену цели
                      setShowAutoGoalPopover(!showAutoGoalPopover);
                    }}
                    className={`text-[9.5px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95 transition-transform ${
                      profile.selectedGoal === 'recomp'
                        ? 'bg-purple-100 text-purple-600 border border-purple-200'
                        : profile.selectedGoal === 'cut'
                        ? 'bg-rose-100 text-rose-600 border border-rose-200'
                        : profile.selectedGoal === 'bulk'
                        ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                        : 'bg-blue-100 text-blue-600 border border-blue-200'
                    }`}
                    title="Сменить цель авто-расчета"
                  >
                    {profile.selectedGoal === 'recomp' ? 'Рекомп' : profile.selectedGoal === 'bulk' ? 'Набор' : profile.selectedGoal === 'cut' ? 'Сушка' : 'Баланс'} &darr;
                  </span>
                </button>

                {/* Выпадающее окошко выбора спортивной цели в Авто */}
                {showAutoGoalPopover && (
                  <div className="absolute right-0 left-0 mt-2 p-2 bg-white border border-gym-border/60 rounded-2xl shadow-xl z-50 flex flex-col gap-1 animate-scaleIn">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 py-1.5 border-b border-gym-border/30">
                      Смена цели авто-расчета:
                    </div>
                    {[
                      { id: 'recomp', name: 'Рекомпозиция', color: 'text-purple-600', dot: 'bg-purple-500' },
                      { id: 'cut', name: 'Сушка', color: 'text-rose-600', dot: 'bg-rose-500' },
                      { id: 'bulk', name: 'Набор массы', color: 'text-emerald-600', dot: 'bg-emerald-500' },
                      { id: 'maintenance', name: 'Поддержание', color: 'text-blue-600', dot: 'bg-blue-500' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          updateProfile({ selectedGoal: g.id as any });
                          setShowAutoGoalPopover(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer flex justify-between items-center ${
                          profile.selectedGoal === g.id
                            ? 'bg-gym-accent/10 text-gym-accent'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`flex items-center gap-1.5 ${g.color}`}>
                          <Target size={14} className="flex-shrink-0" />
                          {g.name}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${g.dot}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Линия-разделитель */}
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center py-1">
                Шаблоны питания дня
              </div>

              {/* Список пресетов */}
              {presets.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setDailyNutritionPreset(logDate, preset.id)}
                    className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? 'bg-gym-accent border-gym-accent text-white shadow-md'
                        : 'bg-gray-50/50 hover:bg-white text-gray-700 border-gym-border/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      {preset.color && (
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: isSelected ? '#fff' : preset.color }}
                        ></span>
                      )}
                      <span>{preset.name}</span>
                    </div>
                  </button>
                );
              })}

            </div>

            <button
              onClick={() => setShowPresetsManager(true)}
              className="w-full mt-3 py-2.5 bg-gym-accent/10 hover:bg-gym-accent/20 border border-gym-accent/20 text-gym-accent font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer btn-interactive"
            >
              <Settings size={14} />
              <span>Управление шаблонами</span>
            </button>
          </div>
        </div>

      </div>

      {/* Модалка Управления пресетами */}
      {showPresetsManager && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 border border-gym-border/40 animate-scaleIn">
            <div className="flex justify-between items-center border-b border-gym-border/40 pb-3">
              <h3 className="text-md font-extrabold text-gray-800 flex items-center gap-2">
                <Settings size={18} className="text-gym-accent" />
                Шаблоны КБЖУ
              </h3>
              <button
                onClick={() => setShowPresetsManager(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              <div className="bg-white/40 border border-gym-border/40 rounded-xl p-3 flex justify-between items-center shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-gym-accent flex-shrink-0"></span>
                  <div>
                    <div className="text-xs font-black text-gray-700">Авто (Расчет)</div>
                    <p className="text-[10px] text-gray-500 leading-normal font-medium mt-0.5 max-w-[240px]">
                      Динамический расчет калорий на основе веса, спортивной цели и объема выполненной силовой тренировки.
                    </p>
                    <div className="text-[9px] text-gray-400 font-bold mt-1">Система</div>
                  </div>
                </div>
                <span className="text-[10px] bg-gym-accent/10 text-gym-accent font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0">Всегда активен</span>
              </div>

              {presets.map((preset) => (
                <div key={preset.id} className="bg-white/40 border border-gym-border/40 rounded-xl p-3 flex justify-between items-center shadow-xs animate-fadeInUp">
                  <div className="flex items-center gap-2.5">
                    {preset.color && (
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: preset.color }}></span>
                    )}
                    <div>
                      <div className="text-xs font-black text-gray-700">{preset.name}</div>
                      {preset.description && (
                        <p className="text-[10px] text-gray-500 leading-normal font-medium mt-0.5 max-w-[240px]">
                          {preset.description}
                        </p>
                      )}
                      <div className="text-[9px] text-gray-400 font-bold mt-1">
                        {preset.type === 'static' ? '' : `Смещение (${(preset.kcalOffsetPercent ?? 0) >= 0 ? '+' : ''}${preset.kcalOffsetPercent ?? 0}%)`}
                        {!preset.isCustom && ' (Система)'}
                      </div>
                    </div>
                  </div>
                  
                  {preset.isCustom && (
                    <button
                      onClick={() => handleDeletePresetClick(preset.id, preset.name)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-all cursor-pointer btn-interactive flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowPresetsManager(false);
                  setShowPresetCreator(true);
                }}
                className="w-full bg-gym-accent text-white font-bold py-2.5 rounded-xl text-xs hover:bg-gym-accent-dark shadow-sm transition-all cursor-pointer text-center btn-interactive"
              >
                Создать шаблон
              </button>
              <button
                onClick={() => setShowPresetsManager(false)}
                className="w-full bg-gray-100 text-gray-600 font-bold py-2.5 rounded-xl text-xs hover:bg-gray-250 transition-all border border-gym-border/40 cursor-pointer text-center btn-interactive"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Модалка Создания пресета */}
      {showPresetCreator && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white max-w-lg w-full max-h-[90vh] rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col border border-gym-border/40 animate-scaleIn my-4 sm:my-8">
            <div className="flex justify-between items-center border-b border-gym-border/40 pb-3 flex-shrink-0">
              <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
                <Plus size={18} className="text-gym-accent" />
                Новый шаблон питания
              </h3>
              <button
                onClick={() => setShowPresetCreator(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSavePreset} className="flex flex-col flex-1 overflow-hidden min-h-0 mt-4 space-y-4">
              <div className="overflow-y-auto flex-1 space-y-4 pr-1.5 min-h-0 scrollbar-thin pb-2">
              {/* Имя */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Название шаблона</label>
                <input
                  type="text"
                  required
                  placeholder="Напр. День ног, Белковый день"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full bg-white border border-gym-border/80 focus:border-gym-accent focus:ring-1 focus:ring-gym-accent rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 outline-hidden transition-all shadow-xs"
                />
              </div>

              {/* Описание */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Описание шаблона</label>
                <input
                  type="text"
                  placeholder="Коротко опишите суть шаблона (цели, особенности)"
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                  className="w-full bg-white border border-gym-border/80 focus:border-gym-accent focus:ring-1 focus:ring-gym-accent rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 outline-hidden transition-all shadow-xs"
                />
              </div>

              {/* Тип */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wider block">Тип расчета</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPresetType('static')}
                    className={`w-1/2 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      presetType === 'static'
                        ? 'bg-gym-accent/10 border-gym-accent text-gym-accent shadow-2xs'
                        : 'bg-white border-gym-border/80 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Фиксированные граммы
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetType('dynamic')}
                    className={`w-1/2 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      presetType === 'dynamic'
                        ? 'bg-gym-accent/10 border-gym-accent text-gym-accent shadow-2xs'
                        : 'bg-white border-gym-border/80 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Формульный от веса
                  </button>
                </div>
              </div>

              {/* Цвет */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wider block">Цветовой тег</label>
                <div className="flex gap-2.5">
                  {['#466bf7', '#06b6d4', '#10b981', '#f97316', '#f43f5e', '#a855f7', '#64748b'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setPresetColor(c)}
                      className={`w-7 h-7 rounded-full border cursor-pointer transition-all ${
                        presetColor === c ? 'scale-115 ring-2 ring-gym-accent/40 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* В зависимости от типа */}
              {presetType === 'static' ? (
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-3.5 bg-gray-50/50 p-3 sm:p-4 rounded-2xl border border-gym-border/40">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Калории (ккал)</label>
                    <input
                      type="number"
                      placeholder="Напр. 2200"
                      value={pCal}
                      onChange={(e) => setPCal(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-gym-border/60 focus:border-gym-accent focus:ring-1 focus:ring-gym-accent rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono text-gray-700 outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Белки (г)</label>
                    <input
                      type="number"
                      placeholder="Напр. 150"
                      value={pProt}
                      onChange={(e) => setPProt(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-gym-border/60 focus:border-gym-accent focus:ring-1 focus:ring-gym-accent rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono text-gray-700 outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Жиры (г)</label>
                    <input
                      type="number"
                      placeholder="Напр. 70"
                      value={pFat}
                      onChange={(e) => setPFat(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-gym-border/60 focus:border-gym-accent focus:ring-1 focus:ring-gym-accent rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono text-gray-700 outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Углеводы (г)</label>
                    <input
                      type="number"
                      placeholder="Напр. 240"
                      value={pCarb}
                      onChange={(e) => setPCarb(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-gym-border/60 focus:border-gym-accent focus:ring-1 focus:ring-gym-accent rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono text-gray-700 outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Вода (мл)</label>
                    <input
                      type="number"
                      placeholder="Напр. 2500"
                      value={pWater}
                      onChange={(e) => setPWater(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-gym-border/60 focus:border-gym-accent focus:ring-1 focus:ring-gym-accent rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono text-gray-700 outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Шаги (цель)</label>
                    <input
                      type="number"
                      placeholder="Напр. 10000"
                      value={pSteps}
                      onChange={(e) => setPSteps(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-gym-border/60 focus:border-gym-accent focus:ring-1 focus:ring-gym-accent rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono text-gray-700 outline-hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gym-border/40">
                  {/* Профицит/Дефицит */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-600">
                      <span>Калорийность (от базовой нормы)</span>
                      <span className="text-gym-accent font-bold font-mono">{pOffset >= 0 ? '+' : ''}{pOffset.toFixed(1).replace('.0', '')}%</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      step="0.5"
                      value={pOffset}
                      onChange={(e) => setPOffset(Number(e.target.value))}
                      className="w-full accent-gym-accent cursor-pointer"
                    />
                  </div>

                  {/* Белок на кг */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-600">
                      <span>Белок на кг веса</span>
                      <span className="text-gym-accent font-bold font-mono">{pProtRatio.toFixed(2).replace('.00', '')} г/кг</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="3.5"
                      step="0.05"
                      value={pProtRatio}
                      onChange={(e) => setPProtRatio(Number(e.target.value))}
                      className="w-full accent-gym-accent cursor-pointer"
                    />
                  </div>

                  {/* Процент жиров */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-600">
                      <span>Доля жиров от калорий</span>
                      <span className="text-gym-accent font-bold font-mono">{pFatPercent.toFixed(1).replace('.0', '')}%</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="40"
                      step="0.5"
                      value={pFatPercent}
                      onChange={(e) => setPFatPercent(Number(e.target.value))}
                      className="w-full accent-gym-accent cursor-pointer"
                    />
                  </div>

                  {/* Шаги */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="presetStepsGoal"
                        checked={pStepsFromGoal}
                        onChange={(e) => setPStepsFromGoal(e.target.checked)}
                        className="rounded-sm border-gym-border text-gym-accent focus:ring-gym-accent cursor-pointer"
                      />
                      <label htmlFor="presetStepsGoal" className="text-xs font-bold text-gray-600 cursor-pointer">
                        Использовать норму шагов из цели
                      </label>
                    </div>
                    
                    {!pStepsFromGoal && (
                      <div className="space-y-1 animate-fadeIn">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Кастомная цель шагов</label>
                        <input
                          type="number"
                          placeholder="Напр. 10000"
                          value={pStepsCustom}
                          onChange={(e) => setPStepsCustom(Number(e.target.value))}
                          className="w-full bg-white border border-gym-border/60 focus:border-gym-accent focus:ring-1 focus:ring-gym-accent rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono text-gray-700 outline-hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Интерактивное Превью */}
              <div className="bg-gym-accent/5 border border-gym-accent/15 rounded-2xl p-4 space-y-2 animate-fadeIn">
                <h4 className="text-xs font-black text-gym-accent uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={13} />
                  Расчетный план питания (Превью)
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/70 border border-gym-border/40 p-2 rounded-xl">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Калории</div>
                    <div className="text-xs font-black text-gray-800 font-mono">{previewValues.calories} <span className="text-[9px]">ккал</span></div>
                  </div>
                  <div className="bg-white/70 border border-gym-border/40 p-2 rounded-xl">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Белки</div>
                    <div className="text-xs font-black text-orange-600 font-mono">{previewValues.protein} <span className="text-[9px]">г</span></div>
                  </div>
                  <div className="bg-white/70 border border-gym-border/40 p-2 rounded-xl">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Жиры</div>
                    <div className="text-xs font-black text-yellow-600 font-mono">{previewValues.fat} <span className="text-[9px]">г</span></div>
                  </div>
                  <div className="bg-white/70 border border-gym-border/40 p-2 rounded-xl">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Углеводы</div>
                    <div className="text-xs font-black text-cyan-600 font-mono">{previewValues.carbs} <span className="text-[9px]">г</span></div>
                  </div>
                  <div className="bg-white/70 border border-gym-border/40 p-2 rounded-xl">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Вода</div>
                    <div className="text-xs font-black text-blue-500 font-mono">{(previewValues.water / 1000).toFixed(1)} <span className="text-[9px]">л</span></div>
                  </div>
                  <div className="bg-white/70 border border-gym-border/40 p-2 rounded-xl">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Шаги</div>
                    <div className="text-xs font-black text-emerald-600 font-mono">{previewValues.steps.toLocaleString()}</div>
                  </div>
                </div>
                {presetType === 'dynamic' && (
                  <p className="text-[9px] text-gray-400 text-center italic">
                    * Расчет произведен для дня отдыха при текущем весе атлета {activeProfileForCalc.weight} кг.
                  </p>
                )}
              </div>

            </div>

              {/* Кнопки */}
              <div className="flex gap-3 pt-4 border-t border-gym-border/20 flex-shrink-0">
                <button
                  type="submit"
                  className="w-full bg-gym-accent text-white font-bold py-2.5 rounded-xl text-xs hover:bg-gym-accent-dark shadow-sm transition-all cursor-pointer text-center btn-interactive"
                >
                  Создать
                </button>
                <button
                  type="button"
                  onClick={() => setShowPresetCreator(false)}
                  className="w-full bg-gray-100 text-gray-600 font-bold py-2.5 rounded-xl text-xs hover:bg-gray-250 transition-all border border-gym-border/40 cursor-pointer text-center btn-interactive"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isScanning && createPortal(
        <BarcodeScannerModal
          onClose={() => setIsScanning(false)}
          onScanSuccess={handleScanBarcode}
        />,
        document.body
      )}

      {isScanningLoading && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-[10000] p-4 animate-fadeIn">
          <div className="bg-white/80 border border-white/50 backdrop-filter backdrop-blur-2xl rounded-[28px] p-8 max-w-xs w-full shadow-2xl flex flex-col items-center gap-4 text-center animate-scaleUp">
            <LoaderPulse size={36} className="text-gym-accent animate-spin" />
            <div>
              <h4 className="font-display font-semibold text-slate-800 text-sm tracking-tight uppercase">Запрос в OpenFoodFacts</h4>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">Ищем информацию о продукте...</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      <SmartMacroAdvisorModal
        isOpen={isAdvisorModalOpen}
        onClose={() => setIsAdvisorModalOpen(false)}
        target={{
          calories: target.calories,
          proteinGrams: target.protein.grams,
          fatGrams: target.fat.grams,
          carbsGrams: target.carbs.grams,
        }}
        current={{
          calories: eatenCalories,
          protein: eatenProtein,
          fat: eatenFat,
          carbs: eatenCarbs,
        }}
        customFoods={savedFoods}
        popularFoods={POPULAR_FOODS}
        onAddItemsToLog={(items) => {
          const existingItems = currentDayLog?.items || [];
          const updatedItems = [...existingItems, ...items];
          let newCalories = eatenCalories;
          let newProtein = eatenProtein;
          let newFat = eatenFat;
          let newCarbs = eatenCarbs;

          items.forEach((i) => {
            newCalories += i.calories;
            newProtein += i.protein;
            newFat += i.fat;
            newCarbs += i.carbs;
          });

          addNutritionLog({
            date: logDate,
            calories: Math.round(newCalories),
            protein: Math.round(newProtein * 10) / 10,
            fat: Math.round(newFat * 10) / 10,
            carbs: Math.round(newCarbs * 10) / 10,
            water: eatenWater,
            steps: eatenSteps,
            items: updatedItems,
          });
        }}
      />

      {/* Модалка сканирования блюда по фото */}
      <MealPhotoModal
        isOpen={isPhotoScanning}
        onClose={() => setIsPhotoScanning(false)}
        onApplyMeal={(mealData) => {
          setFoodName(mealData.name);
          setEatenGrams(mealData.grams);
          setPortionCalories(mealData.calories);
          setPortionProtein(mealData.protein);
          setPortionFat(mealData.fat);
          setPortionCarbs(mealData.carbs);
          setSelectedBaseFood(null);
        }}
      />
    </div>
  );
});
