import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGymStore } from '../store/gymStore';
import { X, Flame, ChevronLeft, ChevronRight, Dumbbell, Footprints, TrendingUp, TrendingDown, Calendar, Download, Printer, ArrowLeft } from './BroskyIcon';
import { calculatePeriodStats, generatePeriodReportCSV, downloadCSV, generatePeriodReportPDFWindow } from '../utils/reportExporter';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose }) => {
  const profile = useGymStore(s => s.profile);
  const workoutSessions = useGymStore(s => s.workoutSessions);
  const progress = useGymStore(s => s.progress);
  const nutritionLogs = useGymStore(s => s.nutritionLogs);

  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [activePreset, setActivePreset] = useState<7 | 14 | 30 | 'custom'>(7);
  const [showResult, setShowResult] = useState(false);

  // Состояние для навигации по календарю
  const [viewDate, setViewDate] = useState(() => new Date());

  // Сброс экрана результатов при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setShowResult(false);
        setViewDate(new Date());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleDownloadCSV = () => {
    if (!startDate) return;
    const summary = calculatePeriodStats(startDate, endDate || startDate, workoutSessions, progress, nutritionLogs);
    const csvContent = generatePeriodReportCSV(summary);
    downloadCSV(`BroskyGym_Report_${startDate}_to_${endDate || startDate}.csv`, csvContent);
  };

  const handleDownloadPDF = () => {
    if (!startDate) return;
    const summary = calculatePeriodStats(startDate, endDate || startDate, workoutSessions, progress, nutritionLogs);
    generatePeriodReportPDFWindow(profile, summary);
  };

  const setPreset = (days: 7 | 14 | 30) => {
    setActivePreset(days);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    setEndDate(endStr);
    setStartDate(startStr);
    setViewDate(new Date(start)); // Фокусируем календарь на дате начала
  };

  const handleDayClick = (dateStr: string) => {
    setActivePreset('custom');
    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate('');
    } else {
      if (new Date(dateStr) < new Date(startDate)) {
        setStartDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
    }
  };

  // Календарная математика
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // пн - 0, вс - 6

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const reportData = useMemo(() => {
    if (!startDate) return null;
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date(startDate);
    end.setHours(23, 59, 59, 999);

    const periodNutritionLogs = nutritionLogs.filter(l => {
      const d = new Date(l.date);
      return d >= start && d <= end;
    });
    
    const periodWorkouts = workoutSessions.filter(w => {
      const d = new Date(w.date);
      return d >= start && d <= end;
    });
    
    const sumCaloriesIn = periodNutritionLogs.reduce((acc, l) => acc + l.calories, 0);
    const sumProtein = periodNutritionLogs.reduce((acc, l) => acc + l.protein, 0);
    const sumFat = periodNutritionLogs.reduce((acc, l) => acc + l.fat, 0);
    const sumCarbs = periodNutritionLogs.reduce((acc, l) => acc + l.carbs, 0);
    
    const latestProgress = progress.length > 0 ? progress[progress.length - 1] : null;
    const currentWeight = (latestProgress?.weight != null) ? latestProgress.weight : profile.weight;

    const totalSteps = periodNutritionLogs.reduce((acc, l) => acc + (l.steps || 0), 0);
    const caloriesFromSteps = Math.round((totalSteps * 0.04 * (currentWeight / 70))); // estimate NEAT total
    const caloriesFromWorkouts = periodWorkouts.length * Math.round(currentWeight * 5.0); // estimate EAT total
    const totalCaloriesBurned = caloriesFromSteps + caloriesFromWorkouts;
    
    // Подробный расчет объема тренировок
    let totalVolume = 0;
    const detailedWorkouts = periodWorkouts.map(w => {
      let vol = 0;
      Object.values(w.logs || {}).forEach(exerciseLog => {
        if (exerciseLog && exerciseLog.sets) {
          exerciseLog.sets.forEach(set => {
            if (set.isCompleted && set.weight && set.reps) {
              vol += set.weight * set.reps;
            }
          });
        }
      });
      totalVolume += vol;
      return {
        id: w.id,
        date: w.date,
        templateName: w.templateName || 'Быстрая тренировка',
        volume: vol
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Замеры
    const progressInPeriod = progress.filter(p => {
        const d = new Date(p.date);
        return d >= start && d <= end;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
    // Функция расчета полезности изменений на основе выбранной цели
    const getChangeStatus = (key: string, delta: number, goal: 'recomp' | 'maintenance' | 'bulk' | 'cut'): 'good' | 'bad' | 'neutral' => {
      if (delta === 0) return 'neutral';
      
      if (key === 'weight') {
        if (goal === 'cut') return delta < 0 ? 'good' : 'bad';
        if (goal === 'bulk') return delta > 0 ? 'good' : 'bad';
        return 'neutral';
      }
      
      if (key === 'fatPercent') {
        if (delta < 0) return 'good';
        return goal === 'bulk' ? 'neutral' : 'bad';
      }
      
      if (key === 'waist') {
        if (delta < 0) return 'good';
        return goal === 'bulk' ? 'neutral' : 'bad';
      }
      
      // Для остальных обхватов мышц (грудь, бицепс, бедра)
      if (delta > 0) return 'good';
      return goal === 'cut' ? 'neutral' : 'bad';
    };

    const sizeChanges: { key: string; name: string; delta: number; unit: string; startVal: number; endVal: number; status: 'good' | 'bad' | 'neutral' }[] = [];
    if (progressInPeriod.length >= 2) {
      const first = progressInPeriod[0];
      const last = progressInPeriod[progressInPeriod.length - 1];
      
      const compare = (key: string, name: string, unit: string) => {
        const valKey = key as keyof typeof first;
        if (first[valKey] != null && last[valKey] != null && first[valKey] !== last[valKey]) {
          const delta = Math.round((Number(last[valKey]) - Number(first[valKey])) * 10) / 10;
          sizeChanges.push({
            key,
            name,
            delta,
            unit,
            startVal: Number(first[valKey]),
            endVal: Number(last[valKey]),
            status: getChangeStatus(key, delta, profile.selectedGoal)
          });
        }
      };
      
      compare('weight', 'Вес тела', 'кг');
      compare('fatPercent', 'Жир в организме', '%');
      compare('chest', 'Обхват груди', 'см');
      compare('waist', 'Обхват талии', 'см');
      compare('hips', 'Обхват бедер', 'см');
      compare('biceps', 'Обхват бицепса', 'см');
    }

    const daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const recordedDays = periodNutritionLogs.length;

    return {
      sumCaloriesIn,
      sumProtein,
      sumFat,
      sumCarbs,
      avgCaloriesIn: recordedDays > 0 ? Math.round(sumCaloriesIn / recordedDays) : 0,
      avgProtein: recordedDays > 0 ? Math.round(sumProtein / recordedDays) : 0,
      avgFat: recordedDays > 0 ? Math.round(sumFat / recordedDays) : 0,
      avgCarbs: recordedDays > 0 ? Math.round(sumCarbs / recordedDays) : 0,
      totalSteps,
      avgSteps: recordedDays > 0 ? Math.round(totalSteps / recordedDays) : 0,
      workoutsCount: periodWorkouts.length,
      totalCaloriesBurned,
      totalVolume,
      detailedWorkouts,
      sizeChanges,
      daysCount
    };
  }, [startDate, endDate, nutritionLogs, workoutSessions, progress, profile.weight, profile.selectedGoal]);

  if (!isOpen) return null;

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [, m, d] = parts;
    const mIdx = parseInt(m) - 1;
    const shortMonths = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return `${parseInt(d)} ${shortMonths[mIdx]}`;
  };

  const formattedFullDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const mIdx = parseInt(m) - 1;
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${parseInt(d)} ${months[mIdx]} ${y}`;
  };

  // periodLabel removed as it was unused

  const todayStr = new Date().toISOString().split('T')[0];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      {/* Контейнер модального окна стал шире (max-w-2xl) */}
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Заголовок */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            {showResult && (
              <button 
                onClick={() => setShowResult(false)}
                className="p-1.5 hover:bg-gray-200/50 rounded-lg transition-colors cursor-pointer text-gray-500 mr-1"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-xl font-black text-gray-800">
              {showResult ? `Аналитический отчет` : 'Создать отчет'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200/50 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Контент */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {!showResult ? (
            <div className="space-y-6">
              {/* Быстрые фильтры */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 block">Быстрый выбор периода</span>
                <div className="flex gap-2">
                  {[7, 14, 30].map((presetVal) => (
                    <button 
                      key={presetVal}
                      onClick={() => setPreset(presetVal as 7 | 14 | 30)} 
                      className={`flex-1 py-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        activePreset === presetVal 
                          ? 'bg-gym-accent text-white border-gym-accent shadow-sm' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {presetVal === 30 ? 'Месяц' : `${presetVal} дней`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Календарь выбора диапазона прямо в модалке */}
              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/30">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Выберите диапазон на календаре</span>
                  {startDate && (
                    <span className="text-xs font-black text-gym-accent bg-gym-accent/5 px-2.5 py-1 rounded-lg">
                      {startDate && formattedFullDate(startDate)}
                      {endDate && ` — ${formattedFullDate(endDate)}`}
                    </span>
                  )}
                </div>

                {/* Сетка календаря */}
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Месяц</span>
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-gray-100 transition-all cursor-pointer text-gray-500"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 select-none">
                        <Calendar size={15} className="text-gym-accent" />
                        <span className="min-w-[100px] text-center">
                          {monthNames[month]} {year}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-gray-100 transition-all cursor-pointer text-gray-500"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-2">
                    <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayIndex }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="h-9"></div>
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const mm = String(month + 1).padStart(2, '0');
                      const dd = String(dayNum).padStart(2, '0');
                      const dateStr = `${year}-${mm}-${dd}`;

                      const isStart = dateStr === startDate;
                      const isEnd = dateStr === endDate;
                      const isWithinRange = startDate && endDate && dateStr > startDate && dateStr < endDate;
                      const isToday = dateStr === todayStr;

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => handleDayClick(dateStr)}
                          className={`h-9 w-9 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer text-xs font-semibold relative ${
                            isStart || isEnd
                              ? 'bg-gym-accent text-white border-gym-accent shadow-sm'
                              : isWithinRange
                                ? 'bg-gym-accent/10 text-gym-accent rounded-none'
                                : 'hover:bg-gray-100 text-gray-700'
                          } ${isToday && !isStart && !isEnd ? 'ring-2 ring-gym-accent/30' : ''}`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Результаты отчета - Лаконичный монохромный дизайн */
            reportData && (
              <div className="space-y-6 animate-fadeInUp">
                <div className="text-center pb-4 border-b border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Анализируемый период</span>
                  <h3 className="text-lg font-black text-gray-800">
                    {formattedFullDate(startDate)}
                    {endDate && startDate !== endDate && ` — ${formattedFullDate(endDate)}`}
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">Длительность: {reportData.daysCount} дней</span>
                </div>

                {/* Питание за период */}
                <div className="border border-gray-100 rounded-2xl p-5 bg-gradient-to-br from-gym-accent/[0.03] to-transparent space-y-4 shadow-[inset_0_0_12px_rgba(0,0,0,0.01)]">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Всего съедено за период</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black text-gray-800 leading-none">{reportData.sumCaloriesIn.toLocaleString()}</span>
                        <span className="text-sm font-bold text-gray-500">ккал</span>
                      </div>
                    </div>
                    
                    {/* Общий баланс БЖУ за период */}
                    <div className="flex-1 max-w-sm sm:pl-4">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Общий баланс БЖУ</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white border border-gray-100/80 rounded-xl p-2 text-center shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
                          <span className="text-[9px] font-bold text-orange-500 block mb-0.5">Белки</span>
                          <span className="text-xs font-black text-gray-700">{reportData.sumProtein.toLocaleString()}г</span>
                        </div>
                        <div className="bg-white border border-gray-100/80 rounded-xl p-2 text-center shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
                          <span className="text-[9px] font-bold text-yellow-500 block mb-0.5">Жиры</span>
                          <span className="text-xs font-black text-gray-700">{reportData.sumFat.toLocaleString()}г</span>
                        </div>
                        <div className="bg-white border border-gray-100/80 rounded-xl p-2 text-center shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
                          <span className="text-[9px] font-bold text-cyan-500 block mb-0.5">Углеводы</span>
                          <span className="text-xs font-black text-gray-700">{reportData.sumCarbs.toLocaleString()}г</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Среднесуточные значения питания */}
                  <div className="pt-3 border-t border-gray-100/80 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">В среднем за день:</span>
                      <span className="text-sm font-black text-gray-700">{reportData.avgCaloriesIn}</span>
                      <span className="text-[10px] font-bold text-gray-400">ккал</span>
                    </div>
                    <div className="flex gap-3 text-[10px] font-bold text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>Б: {reportData.avgProtein}г</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>Ж: {reportData.avgFat}г</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>У: {reportData.avgCarbs}г</span>
                    </div>
                  </div>
                </div>

                {/* Физическая активность */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Тренировки */}
                  <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/30 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Тренировки</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-gray-800">{reportData.workoutsCount}</span>
                        <span className="text-xs font-bold text-gray-500">сессий</span>
                      </div>
                      <span className="text-[9px] text-gray-400 block font-medium">Общий объем: {(reportData.totalVolume / 1000).toFixed(1)} т</span>
                    </div>
                    <div className="p-3 bg-gym-accent/5 text-gym-accent rounded-xl animate-scaleUp">
                      <Dumbbell size={20} fill="currentColor" fillOpacity={0.15} />
                    </div>
                  </div>

                  {/* Шаги */}
                  <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/30 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Шаги (среднее)</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-gray-800">{reportData.avgSteps.toLocaleString()}</span>
                        <span className="text-xs font-bold text-gray-500">/ день</span>
                      </div>
                      <span className="text-[9px] text-gray-400 block font-medium">Всего: {reportData.totalSteps.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-emerald-500/5 text-emerald-500 rounded-xl animate-scaleUp">
                      <Footprints size={20} fill="currentColor" fillOpacity={0.12} />
                    </div>
                  </div>
                </div>

                {/* Расход энергии */}
                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/30 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider block">Расход энергии (за весь период)</span>
                    <span className="text-base font-black text-gray-800">{reportData.totalCaloriesBurned} ккал</span>
                    <span className="text-[10px] text-gray-400 block font-medium">Оценка энергозатрат от шагов и тренировок</span>
                  </div>
                  <Flame size={20} fill="currentColor" fillOpacity={0.18} className="text-rose-500 opacity-90" />
                </div>

                {/* Блок тренировок (Детализированный) */}
                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/30">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <Dumbbell size={14} fill="currentColor" fillOpacity={0.15} className="text-gym-accent" />
                    Выполненные тренировки
                  </h4>
                  {reportData.detailedWorkouts.length > 0 ? (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {reportData.detailedWorkouts.map((w, index) => (
                        <div key={w.id || index} className="flex justify-between items-center text-xs p-2.5 bg-white border border-gray-100 rounded-xl hover:shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] transition-all">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-700">{w.templateName}</span>
                            <span className="text-[9px] text-gray-400 font-medium">{formatDateLabel(w.date)}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-gray-800">{w.volume.toLocaleString()} кг</span>
                            <span className="text-[9px] text-gray-400 block">общий объем</span>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 flex justify-between items-center text-xs font-black text-gray-700 border-t border-gray-100/60 mt-2">
                        <span>Суммарный тоннаж за период:</span>
                        <span>{(reportData.totalVolume / 1000).toFixed(1)} т</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 block text-center py-2">Тренировок за этот период не найдено.</span>
                  )}
                </div>

                {/* Замеры тела (Детализированные) */}
                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/30">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <TrendingUp size={14} className="text-gray-400" />
                    <span>Динамика показателей</span>
                  </h4>
                  {reportData.sizeChanges.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {reportData.sizeChanges.map((sc, i) => {
                        const TrendIcon = sc.delta > 0 ? TrendingUp : TrendingDown;
                        
                        let badgeClass = 'text-gray-600 bg-gray-50 border-gray-200';
                        if (sc.status === 'good') {
                          badgeClass = 'text-emerald-600 bg-emerald-50/80 border-emerald-100/60';
                        } else if (sc.status === 'bad') {
                          badgeClass = 'text-rose-600 bg-rose-50/80 border-rose-100/60';
                        } else if (sc.status === 'neutral') {
                          badgeClass = 'text-blue-600 bg-blue-50/60 border-blue-100/40';
                        }

                        return (
                          <div key={i} className="flex justify-between items-center text-xs p-3 bg-white border border-gray-100 rounded-xl hover:shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] transition-all">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-700">{sc.name}</span>
                              <span className="text-[9px] text-gray-400 font-medium">
                                {sc.startVal} {sc.unit} → {sc.endVal} {sc.unit}
                              </span>
                            </div>
                            <div className={`flex items-center gap-1 font-black px-2 py-1 rounded-lg border text-[11px] ${badgeClass}`}>
                              <TrendIcon size={12} className="opacity-80" />
                              <span>{sc.delta > 0 ? '+' : ''}{sc.delta} {sc.unit}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 block text-center py-3">
                      Недостаточно данных для отслеживания динамики. Добавьте записи замеров в начале и конце периода в разделе прогресса.
                    </span>
                  )}
                </div>
              </div>
            )
          )}
        </div>
        
        {/* Кнопки действий */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
          {!showResult ? (
            <>
              <button 
                onClick={onClose}
                className="flex-1 py-3.5 bg-gray-200/80 hover:bg-gray-200 text-gray-700 text-sm font-black rounded-xl transition-all cursor-pointer"
              >
                Отмена
              </button>
              <button 
                onClick={() => setShowResult(true)}
                disabled={!startDate}
                className="flex-1 py-3.5 bg-gym-accent hover:bg-gym-accent/90 disabled:bg-gray-300 disabled:shadow-none text-white text-sm font-black rounded-xl transition-all shadow-md shadow-gym-accent/20 cursor-pointer"
              >
                Увидеть отчет
              </button>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
              <button 
                onClick={() => setShowResult(false)}
                className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Изменить период
              </button>
              <button 
                onClick={handleDownloadCSV}
                className="flex-1 py-3 px-4 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 btn-interactive min-h-[44px]"
              >
                <Download size={16} />
                <span>Скачать CSV</span>
              </button>
              <button 
                onClick={handleDownloadPDF}
                className="flex-1 py-3 px-4 bg-gym-accent hover:bg-gym-accent/90 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-gym-accent/20 cursor-pointer flex items-center justify-center gap-1.5 btn-interactive active:scale-95 min-h-[44px]"
              >
                <Printer size={16} />
                <span>Печать / PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
