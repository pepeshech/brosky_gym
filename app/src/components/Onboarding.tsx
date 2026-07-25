import React, { useState } from 'react';
import { useGymStore } from '../store/gymStore';
import type { ProgressEntry } from '../types';
import { User, Activity, ChevronRight, Zap, Scale, Dumbbell, Flame } from './BroskyIcon';
import { getTargetStepsForGoal, calculateNavyBodyFat } from '../utils/formulas';
import { validateData, AthleteProfileSchema, ProgressEntrySchema } from '../utils/validation';

interface EditableValueProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (val: number) => void;
}

const EditableValue: React.FC<EditableValueProps> = ({ value, min, max, step = 1, suffix, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value.toString());

  const handleSave = () => {
    let parsed = parseFloat(tempVal);
    if (isNaN(parsed)) {
      parsed = value;
    }
    if (parsed < min) parsed = min;
    if (parsed > max) parsed = max;
    
    if (step === 0.1) {
      parsed = Math.round(parsed * 10) / 10;
    } else {
      parsed = Math.round(parsed);
    }
    onChange(parsed);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setTempVal(value.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={tempVal}
        onChange={(e) => setTempVal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-20 bg-white border border-gym-border rounded-lg px-2 py-0.5 text-center font-extrabold text-xs text-gym-accent focus:outline-none focus:border-gym-accent"
      />
    );
  }

  return (
    <span
      onClick={() => {
        setTempVal(value.toString());
        setIsEditing(true);
      }}
      className="cursor-pointer hover:underline text-sm font-extrabold text-gym-accent"
      title="Кликните для ввода значения"
    >
      {value} {suffix}
    </span>
  );
};

export const Onboarding: React.FC = () => {
  const updateProfile = useGymStore(s => s.updateProfile);
  const addProgressEntry = useGymStore(s => s.addProgressEntry);
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(25);
  const [height, setHeight] = useState<number>(180);
  const [weight, setWeight] = useState<number>(82);
  const [fatPercent, setFatPercent] = useState<number>(16);
  const [chest, setChest] = useState<number | ''>('');
  const [waist, setWaist] = useState<number | ''>('');
  const [hips, setHips] = useState<number | ''>('');
  const [thigh, setThigh] = useState<number | ''>('');
  const [biceps, setBiceps] = useState<number | ''>('');
  const [neck, setNeck] = useState<number | ''>('');
  const [selectedGoal, setSelectedGoal] = useState<'recomp' | 'maintenance' | 'bulk' | 'cut'>('maintenance');
  const [errorText, setErrorText] = useState<string | null>(null);

  const calculateFatFromMeasurements = () => {
    const waistVal = waist !== '' ? parseFloat(waist.toString()) : NaN;
    const neckVal = neck !== '' ? parseFloat(neck.toString()) : NaN;
    const hipsVal = hips !== '' ? parseFloat(hips.toString()) : NaN;

    if (isNaN(height) || isNaN(weight) || isNaN(neckVal) || isNaN(waistVal)) {
      setErrorText('Для расчета процента жира укажите рост, обхват шеи и талии в замерах ниже.');
      return;
    }

    const res = calculateNavyBodyFat({
      gender,
      height,
      neck: neckVal,
      waist: waistVal,
      hips: hipsVal,
    });

    if (res.error) {
      setErrorText(res.error);
    } else {
      setFatPercent(res.fatPercent!);
      setErrorText(null);
    }
  };

  const goals = [
    { 
      id: 'recomp', 
      name: 'Рекомпозиция', 
      IconComponent: Zap,
      badge: '-5% ккалорий',
      steps: '11 000 шагов',
      color: 'text-purple-600', 
      activeBg: 'bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-white',
      borderActive: 'border-purple-500 shadow-lg shadow-purple-500/15 ring-2 ring-purple-500/20',
      dotColor: 'bg-purple-500',
      pillBg: 'bg-purple-100 text-purple-700',
      desc: 'Одновременное сжигание жира и рост мышц. Оптимально распределяет энергию для рекомпозиции тела.' 
    },
    { 
      id: 'maintenance', 
      name: 'Поддержание', 
      IconComponent: Scale,
      badge: '100% TDEE',
      steps: '9 000 шагов',
      color: 'text-blue-600', 
      activeBg: 'bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-white',
      borderActive: 'border-gym-accent shadow-lg shadow-blue-500/15 ring-2 ring-blue-500/20',
      dotColor: 'bg-gym-accent',
      pillBg: 'bg-blue-100 text-blue-700',
      desc: 'Сохранение текущей физической формы. Физиологическая норма для стабильного энергообмена и тонуса.' 
    },
    { 
      id: 'bulk', 
      name: 'Набор массы', 
      IconComponent: Dumbbell,
      badge: '+10% ккалорий',
      steps: '7 000 шагов',
      color: 'text-emerald-600', 
      activeBg: 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-white',
      borderActive: 'border-emerald-500 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/20',
      dotColor: 'bg-emerald-500',
      pillBg: 'bg-emerald-100 text-emerald-700',
      desc: 'Максимальный мышечный рост. Обеспечивает профицит калорий и анаболические ресурсы для гипертрофии.' 
    },
    { 
      id: 'cut', 
      name: 'Сушка', 
      IconComponent: Flame,
      badge: '-20% ккалорий',
      steps: '13 000 шагов',
      color: 'text-rose-600', 
      activeBg: 'bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-white',
      borderActive: 'border-rose-500 shadow-lg shadow-rose-500/15 ring-2 ring-rose-500/20',
      dotColor: 'bg-rose-500',
      pillBg: 'bg-rose-100 text-rose-700',
      desc: 'Максимальное сжигание подкожного жира. Создает дефицит калорий без критического урезания порций еды.' 
    },
  ] as const;

  const parseVal = (val: string): number | '' => {
    if (val === '') return '';
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 0) return '';
    return parsed;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const steps = getTargetStepsForGoal(selectedGoal);
    const profileData = {
      username: username.trim(),
      gender,
      age,
      height,
      weight,
      fatPercent,
      dailySteps: steps,
      selectedGoal,
      isOnboarded: true
    };

    const profileValidation = validateData(AthleteProfileSchema, profileData);
    if (!profileValidation.success) {
      const firstError = Object.values(profileValidation.errors)[0];
      setErrorText(firstError);
      return;
    }

    // Создаем стартовую запись замера (вчерашней датой, чтобы новые сегодняшние замеры образовывали прогресс на графике)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const cleanMeasurement = (val: number | '' | undefined) => {
      if (val === '' || val === undefined || isNaN(val) || val <= 0) return undefined;
      return val;
    };

    const entry: ProgressEntry = {
      date: dateStr,
      weight,
      fatPercent,
      notes: 'Начальные параметры атлета'
    };

    const c = cleanMeasurement(chest);
    if (c !== undefined) entry.chest = c;
    const w = cleanMeasurement(waist);
    if (w !== undefined) entry.waist = w;
    const h = cleanMeasurement(hips);
    if (h !== undefined) entry.hips = h;
    const n = cleanMeasurement(neck);
    if (n !== undefined) entry.neck = n;
    const t = cleanMeasurement(thigh);
    if (t !== undefined) entry.thigh = t;
    const b = cleanMeasurement(biceps);
    if (b !== undefined) entry.biceps = b;

    const progressValidation = validateData(ProgressEntrySchema, entry);
    if (!progressValidation.success) {
      const firstError = Object.values(progressValidation.errors)[0];
      setErrorText(firstError);
      return;
    }

    // Сохраняем профиль
    updateProfile(profileData);
    addProgressEntry(entry);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="glass-showcase max-w-[650px] mx-auto">
        
        {/* Заголовок */}
        <div className="glass-header">
          <div className="inline-flex items-center justify-center p-3.5 bg-gym-accent/10 text-gym-accent rounded-2xl mb-2">
            <Activity size={32} />
          </div>
          <h2>Создание профиля</h2>
          <p>Настройте ваш профиль для расчета калорий, белков и отслеживания прогресса</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Имя/Логин */}
          <div className="glass-group">
            <label className="glass-label">Ваш логин / Имя</label>
            <div className="glass-input-wrapper">
              <User size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorText) setErrorText(null);
                }}
                placeholder="Введите имя атлета"
                required
                className="glass-input"
              />
            </div>
          </div>

          {/* Пол */}
          <div className="glass-group">
            <label className="glass-label">Пол</label>
            <div className="glass-gender-grid">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`glass-gender-btn ${gender === 'male' ? 'active' : ''}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="14" r="6"></circle>
                  <path d="M14 10l8-8"></path>
                  <path d="M16 2h6v6"></path>
                </svg>
                Мужской
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`glass-gender-btn ${gender === 'female' ? 'active' : ''}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="9" r="6"></circle>
                  <path d="M12 15v7"></path>
                  <path d="M9 19h6"></path>
                </svg>
                Женский
              </button>
            </div>
          </div>

          {/* Физические параметры (4 слайдера!) */}
          <div style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(70, 107, 247, 0.1)', borderRadius: '20px', padding: '20px' }}>
            <span className="glass-label" style={{ display: 'block', marginBottom: '16px' }}>Физические показатели</span>
            
            {/* Возраст */}
            <div className="slider-row">
              <div className="slider-meta">
                <span className="slider-label">Возраст</span>
                <EditableValue
                  value={age}
                  min={14}
                  max={80}
                  suffix="лет"
                  onChange={setAge}
                />
              </div>
              <input
                type="range"
                min="14"
                max="80"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                className="tiles-range-slider"
              />
            </div>

            {/* Рост */}
            <div className="slider-row" style={{ marginTop: '16px' }}>
              <div className="slider-meta">
                <span className="slider-label">Рост</span>
                <EditableValue
                  value={height}
                  min={140}
                  max={210}
                  suffix="см"
                  onChange={setHeight}
                />
              </div>
              <input
                type="range"
                min="140"
                max="210"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 180)}
                className="tiles-range-slider"
              />
            </div>

            {/* Вес */}
            <div className="slider-row" style={{ marginTop: '16px' }}>
              <div className="slider-meta">
                <span className="slider-label">Вес</span>
                <EditableValue
                  value={weight}
                  min={40}
                  max={150}
                  step={0.1}
                  suffix="кг"
                  onChange={setWeight}
                />
              </div>
              <input
                type="range"
                min="40"
                max="150"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 82)}
                className="tiles-range-slider"
              />
            </div>

            {/* Процент жира */}
            <div className="slider-row" style={{ marginTop: '16px' }}>
              <div className="slider-meta">
                <span className="slider-label">Процент жира</span>
                <EditableValue
                  value={fatPercent}
                  min={5}
                  max={40}
                  step={0.1}
                  suffix="%"
                  onChange={setFatPercent}
                />
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="0.1"
                value={fatPercent}
                onChange={(e) => setFatPercent(parseFloat(e.target.value) || 16)}
                className="tiles-range-slider"
              />
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={calculateFatFromMeasurements}
                  className="text-[10px] text-gym-accent font-bold hover:underline cursor-pointer flex items-center gap-1 btn-interactive"
                >
                  <Activity size={10} />
                  {gender === 'male' 
                    ? 'Рассчитать по обхватам (шея, талия)' 
                    : 'Рассчитать по обхватам (шея, талия, бёдра)'
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Начальные замеры тела */}
          <div style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(70, 107, 247, 0.1)', borderRadius: '20px', padding: '20px' }}>
            <span className="glass-label" style={{ display: 'block', marginBottom: '16px' }}>Начальные замеры тела (необязательно, см)</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold mb-1 text-center">Грудь</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={chest}
                  onChange={(e) => setChest(parseVal(e.target.value))}
                  placeholder="—"
                  className="w-full bg-white border border-gym-border rounded-xl px-2 py-2 text-gray-800 text-center font-bold focus:outline-none focus:border-gym-accent text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold mb-1 text-center">Талия</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={waist}
                  onChange={(e) => setWaist(parseVal(e.target.value))}
                  placeholder="—"
                  className="w-full bg-white border border-gym-border rounded-xl px-2 py-2 text-gray-800 text-center font-bold focus:outline-none focus:border-gym-accent text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold mb-1 text-center">Шея</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={neck}
                  onChange={(e) => setNeck(parseVal(e.target.value))}
                  placeholder="—"
                  className="w-full bg-white border border-gym-border rounded-xl px-2 py-2 text-gray-800 text-center font-bold focus:outline-none focus:border-gym-accent text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold mb-1 text-center">Бёдра</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={hips}
                  onChange={(e) => setHips(parseVal(e.target.value))}
                  placeholder="—"
                  className="w-full bg-white border border-gym-border rounded-xl px-2 py-2 text-gray-800 text-center font-bold focus:outline-none focus:border-gym-accent text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold mb-1 text-center">Бедро</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={thigh}
                  onChange={(e) => setThigh(parseVal(e.target.value))}
                  placeholder="—"
                  className="w-full bg-white border border-gym-border rounded-xl px-2 py-2 text-gray-800 text-center font-bold focus:outline-none focus:border-gym-accent text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold mb-1 text-center">Бицепс</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={biceps}
                  onChange={(e) => setBiceps(parseVal(e.target.value))}
                  placeholder="—"
                  className="w-full bg-white border border-gym-border rounded-xl px-2 py-2 text-gray-800 text-center font-bold focus:outline-none focus:border-gym-accent text-xs"
                />
              </div>
            </div>
          </div>

          {/* Выбор питания */}
          <div className="glass-group">
            <div className="flex items-center justify-between mb-3">
              <label className="glass-label">Спортивная цель и стратегия питания</label>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Выберите режим</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals.map((g) => {
                const isActive = selectedGoal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGoal(g.id)}
                    className={`relative w-full p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all duration-200 ease-out cursor-pointer overflow-hidden ${
                      isActive 
                        ? `${g.borderActive} ${g.activeBg} scale-[1.02]` 
                        : 'border-slate-200/80 bg-white/40 hover:border-slate-300 hover:bg-white/80 hover:scale-[1.01] hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Активный эффект индикатора */}
                    {isActive && (
                      <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${g.dotColor} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${g.dotColor}`}></span>
                      </span>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 pr-4">
                        <g.IconComponent size={18} className={g.color} />
                        <span className={`font-extrabold text-xs tracking-tight ${g.color}`}>{g.name}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed font-medium line-clamp-2">{g.desc}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100/80">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${g.pillBg}`}>
                        {g.badge}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 font-mono">
                        {g.steps}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Красивый блок ошибки валидации */}
          {errorText && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-xs font-semibold animate-fadeIn mb-2 justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
              <span>{errorText}</span>
            </div>
          )}

          {/* Кнопка сохранения */}
          <button
            type="submit"
            className="btn-submit"
            style={{ marginTop: '10px' }}
          >
            Создать профиль и начать
            <ChevronRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
