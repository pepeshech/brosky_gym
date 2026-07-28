import React, { useState, useMemo, useEffect, useTransition, useRef } from 'react';
import { animateCounter, animateProgressBar } from '../utils/animationEngine';
import { useGymStore, calcEpley1RM } from '../store/gymStore';
import type { ProgressEntry, MetricConfig } from '../types';
import { calculateLBM, generateDietPlans, calculateNavyBodyFat, calculateRelativeStrength, calculatePowerliftingRank, calculate1RMMatrix, calculateEWMATrend } from '../utils/formulas';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  ComposedChart, Line, Bar, Legend
} from 'recharts';
import { Plus, Trash2, TrendingDown, TrendingUp, Pencil, Check, X, Settings, ChevronDown, ChevronUp, Layers, Dumbbell, Activity, AlertTriangle, Shield, FileText, Sparkles, Trophy } from './BroskyIcon';
import { DatePicker } from './DatePicker';
import { validateData, ProgressEntrySchema } from '../utils/validation';
import { ReportsModal } from './ReportsModal';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const PALETTE = [
  '#466bf7', '#ff9500', '#10b981', '#34c759', '#ff2d55',
  '#5856d6', '#30b0c7', '#af52de', '#ff6b35', '#a8e6cf',
];

const getMetricValue = (entry: ProgressEntry, key: string): number | null => {
  if (key === 'lbm') {
    const w = entry.weight;
    const f = entry.fatPercent;
    if (w != null && f != null) return Math.round(calculateLBM(w, f) * 10) / 10;
    return null;
  }
  const v = entry[key as keyof ProgressEntry];
  if (v == null) return null;
  const num = Number(v);
  return isNaN(num) ? null : num;
};

const hex2rgba = (hex: string, alpha: number) => {
  if (!hex || typeof hex !== 'string') return `rgba(0, 0, 0, ${alpha})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex[0] + cleanHex[0] + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2];
  }
  const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
  const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
  const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number | string }>;
  label?: string;
  unit: string;
  color: string;
}

const CustomTooltip = ({ active, payload, label, unit, color }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-2xl px-4 py-3 text-sm shadow-xl border"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          borderColor: `${color}40`,
          boxShadow: `0 4px 24px ${color}20`,
        }}
      >
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="font-bold text-gray-800 text-base">
          {payload[0].value} <span className="text-xs font-normal text-gray-500">{unit}</span>
        </p>
      </div>
    );
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Metric Card (bar item)
// ─────────────────────────────────────────────────────────────────────────────

const MetricCard = ({
  metric,
  current,
  delta,
  isGood,
  isSelected,
  onClick,
}: {
  metric: MetricConfig;
  current: number | null;
  delta: string | null;
  isGood: boolean | null;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const color = metric.color ?? '#466bf7';
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left"
      style={{
        background: isSelected
          ? hex2rgba(color, 0.1)
          : 'rgba(255,255,255,0.5)',
        borderColor: isSelected ? `${color}80` : 'rgba(0,0,0,0.07)',
        boxShadow: isSelected ? `0 0 0 1px ${color}50, 0 4px 16px ${color}20` : 'none',
        minWidth: 110,
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {metric.name}
        </span>
      </div>
      <span className="text-xl font-bold text-gray-800 tabular-nums leading-none">
        {current != null ? current : '—'}
        <span className="text-xs font-normal text-gray-400 ml-1">{metric.unit}</span>
      </span>
      {delta != null && isGood != null && (
        <span
          className="flex items-center gap-0.5 text-xs font-semibold mt-1.5"
          style={{ color: isGood ? '#10b981' : '#ef4444' }}
        >
          {isGood ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
          {delta}
        </span>
      )}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const ProgressTab: React.FC = React.memo(() => {
  const progress = useGymStore(s => s.progress);
  const trackedMetrics = useGymStore(s => s.trackedMetrics);
  const addProgressEntry = useGymStore(s => s.addProgressEntry);
  const deleteProgressEntry = useGymStore(s => s.deleteProgressEntry);
  const addMetric = useGymStore(s => s.addMetric);
  const updateMetric = useGymStore(s => s.updateMetric);
  const deleteMetric = useGymStore(s => s.deleteMetric);
  const workoutSessions = useGymStore(s => s.workoutSessions);
  const exercises = useGymStore(s => s.exercises);
  const profile = useGymStore(s => s.profile);
  const updateProfile = useGymStore(s => s.updateProfile);
  const nutritionLogs = useGymStore(s => s.nutritionLogs);
  const personalRecords = useGymStore(s => s.personalRecords);

  const relativeStrength = useMemo(() => {
    const w = profile.weight || 70;
    let total1RM = 0;
    if (personalRecords && personalRecords.length > 0) {
      total1RM = personalRecords.reduce((sum, pr) => sum + (pr.weight1rm || 0), 0);
    } else {
      const ex1rmMap = new Map<string, number>();
      workoutSessions.forEach(s => {
        if (s.logs) {
          Object.values(s.logs).forEach(log => {
            if (log.sets) {
              log.sets.forEach(set => {
                if (set.isCompleted && set.weight > 0 && set.reps > 0) {
                  const rm = calcEpley1RM(set.weight, set.reps);
                  const currentMax = ex1rmMap.get(log.exerciseId) || 0;
                  if (rm > currentMax) ex1rmMap.set(log.exerciseId, rm);
                }
              });
            }
          });
        }
      });
      ex1rmMap.forEach(rm => { total1RM += rm; });
    }

    return calculateRelativeStrength({
      gender: profile.gender || 'male',
      bodyWeight: w,
      totalLifted: Math.round(total1RM),
    });
  }, [profile.weight, profile.gender, personalRecords, workoutSessions]);

  const rankProgress = useMemo(() => {
    const w = profile.weight || 70;
    let total1RM = 0;
    if (personalRecords && personalRecords.length > 0) {
      total1RM = personalRecords.reduce((sum, pr) => sum + (pr.weight1rm || 0), 0);
    } else {
      const ex1rmMap = new Map<string, number>();
      workoutSessions.forEach(s => {
        if (s.logs) {
          Object.values(s.logs).forEach(log => {
            if (log.sets) {
              log.sets.forEach(set => {
                if (set.isCompleted && set.weight > 0 && set.reps > 0) {
                  const rm = calcEpley1RM(set.weight, set.reps);
                  const currentMax = ex1rmMap.get(log.exerciseId) || 0;
                  if (rm > currentMax) ex1rmMap.set(log.exerciseId, rm);
                }
              });
            }
          });
        }
      });
      ex1rmMap.forEach(rm => { total1RM += rm; });
    }

    return calculatePowerliftingRank(profile.gender || 'male', w, Math.round(total1RM));
  }, [profile.weight, profile.gender, personalRecords, workoutSessions]);

  const dotsRef = useRef<HTMLDivElement>(null);
  const wilksRef = useRef<HTMLDivElement>(null);
  const rankProgressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dotsRef.current) {
      animateCounter(dotsRef.current, relativeStrength.dots, 750, 1);
    }
    if (wilksRef.current) {
      animateCounter(wilksRef.current, relativeStrength.wilks, 750, 1);
    }
  }, [relativeStrength.dots, relativeStrength.wilks]);

  useEffect(() => {
    if (rankProgressRef.current) {
      animateProgressBar(rankProgressRef.current, Math.max(4, rankProgress.progressPercent));
    }
  }, [rankProgress.progressPercent]);

  // ── Sub-Tab State ─────────────────────────────────────────────────────────
  const [subTab, setSubTab] = useState<'metrics' | 'strength' | 'nutrition' | 'correlation'>('metrics');
  const [renderedSubTab, setRenderedSubTab] = useState<'metrics' | 'strength' | 'nutrition' | 'correlation'>('metrics');
  const [, startTransition] = useTransition();

  const handleSubTabChange = (tab: 'metrics' | 'strength' | 'nutrition' | 'correlation') => {
    setSubTab(tab);
    startTransition(() => {
      setRenderedSubTab(tab);
    });
  };

  // ── Metrics State ──────────────────────────────────────────────────────────
  const [selectedKey, setSelectedKey] = useState<string>('weight');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<'full' | 'partial' | 'calculator'>('full');
  const [partialKey, setPartialKey] = useState<string>(
    trackedMetrics.filter(m => !m.isVirtual)[0]?.key ?? 'weight'
  );
  const [partialValue, setPartialValue] = useState<string>('');
  const [partialDate, setPartialDate] = useState(new Date().toISOString().split('T')[0]);
  const [partialNotes, setPartialNotes] = useState('');

  const [fullEntry, setFullEntry] = useState<ProgressEntry>({
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [errorText, setErrorText] = useState<string | null>(null);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  const [showMetricsPanel, setShowMetricsPanel] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<Partial<MetricConfig>>({});
  const [newMetric, setNewMetric] = useState<Partial<MetricConfig>>({
    target: 'up',
    color: '#466bf7',
  });
  const [showNewMetricForm, setShowNewMetricForm] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  const initialProgress = useMemo(() => progress.length > 0 ? progress[0] : null, [progress]);

  // ── Жировой калькулятор State & Logic ────────────────────────────────────────
  const [calcGender, setCalcGender] = useState<'male' | 'female'>(profile.gender || 'male');
  const [calcHeight, setCalcHeight] = useState<string>(profile.height?.toString() || '175');
  const [calcWeight, setCalcWeight] = useState<string>(profile.weight?.toString() || '70');
  const [calcNeck, setCalcNeck] = useState<string>(profile.gender === 'female' ? '35' : '38');
  const [calcWaist, setCalcWaist] = useState<string>('80');
  const [calcHips, setCalcHips] = useState<string>('95');
  const [calcResult, setCalcResult] = useState<number | null>(null);

  // ── 1RM Matrix Calculator State ─────────────────────────────────────────────
  const [calc1rmWeight, setCalc1rmWeight] = useState<number>(100);
  const [calc1rmReps, setCalc1rmReps] = useState<number>(5);
  const matrix1RM = useMemo(() => calculate1RMMatrix(calc1rmWeight, calc1rmReps), [calc1rmWeight, calc1rmReps]);

  const handleCalculateBodyFat = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(calcHeight);
    const w = parseFloat(calcWeight);
    const n = parseFloat(calcNeck);
    const waistVal = parseFloat(calcWaist);
    const hipsVal = parseFloat(calcHips);

    if (isNaN(h) || isNaN(w) || isNaN(n) || isNaN(waistVal)) {
      setErrorText('Пожалуйста, введите корректные числовые значения.');
      return;
    }

    const res = calculateNavyBodyFat({
      gender: calcGender,
      height: h,
      neck: n,
      waist: waistVal,
      hips: hipsVal,
    });

    if (res.error) {
      setErrorText(res.error);
    } else {
      setCalcResult(res.fatPercent);
      setErrorText(null);
    }
  };

  const handleSaveCalcResult = () => {
    if (calcResult === null) return;
    const h = parseFloat(calcHeight);
    const w = parseFloat(calcWeight);
    const waistVal = parseFloat(calcWaist);
    const hipsVal = parseFloat(calcHips);
    const neckVal = parseFloat(calcNeck);

    const dateStr = new Date().toISOString().split('T')[0];
    const entryData: ProgressEntry = {
      date: dateStr,
      weight: w,
      fatPercent: calcResult,
      waist: waistVal,
      neck: neckVal,
      notes: 'Рассчитано по формуле Флота США',
    };

    if (calcGender === 'female') {
      entryData.hips = hipsVal;
    }

    const validation = validateData(ProgressEntrySchema, entryData);
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      setErrorText(firstError);
      return;
    }

    addProgressEntry(entryData);

    updateProfile({
      height: h,
      weight: w,
      fatPercent: calcResult,
    });

    setShowAddForm(false);
    setCalcResult(null);
    setErrorText(null);
  };

  // ── Strength Analytics State & Memo ────────────────────────────────────────
  const performedExercises = useMemo(() => {
    const map = new Map<string, string>();
    workoutSessions.forEach(s => {
      if (s.logs) {
        Object.values(s.logs).forEach(log => {
          const hasCompletedSets = log.sets && log.sets.some(set => set.isCompleted && set.weight > 0 && set.reps > 0);
          if (hasCompletedSets && log.exerciseId) {
            const exName = exercises.find(e => e.id === log.exerciseId)?.name || 'Неизвестное упражнение';
            map.set(log.exerciseId, exName);
          }
        });
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [workoutSessions, exercises]);

  const [selectedExId, setSelectedExId] = useState<string>('');
  const [strengthMetric, setStrengthMetric] = useState<'1rm' | 'max_weight'>('1rm');
  const [isExDropdownOpen, setIsExDropdownOpen] = useState(false);

  useEffect(() => {
    if (performedExercises.length > 0 && !selectedExId) {
      const timer = setTimeout(() => {
        setSelectedExId(performedExercises[0].id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [performedExercises, selectedExId]);

  const strengthChartData = useMemo(() => {
    if (!selectedExId) return [];
    const dataMap = new Map<string, { date: string; value: number }>();
    
    workoutSessions.forEach(s => {
      const dateStr = s.date.slice(5).replace('-', '.'); // MM.DD
      if (s.logs) {
        Object.values(s.logs).forEach(log => {
          if (log.exerciseId === selectedExId && log.sets) {
            log.sets.forEach(set => {
              if (set.isCompleted && set.weight > 0 && set.reps > 0) {
                const val = strengthMetric === '1rm'
                  ? Math.round(set.weight * (1 + set.reps / 30) * 10) / 10
                  : set.weight;
                const existing = dataMap.get(s.date);
                if (!existing || val > existing.value) {
                  dataMap.set(s.date, {
                    date: dateStr,
                    value: val
                  });
                }
              }
            });
          }
        });
      }
    });
    
    return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [workoutSessions, selectedExId, strengthMetric]);

  // ── Nutrition Analytics State & Memo ───────────────────────────────────────
  const [nutritionRange, setNutritionRange] = useState<number>(7);

  const nutritionChartData = useMemo(() => {
    const sorted = [...nutritionLogs].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-nutritionRange).map(log => ({
      date: log.date.slice(5).replace('-', '.'),
      calories: log.calories,
      protein: log.protein,
      steps: log.steps || 0
    }));
  }, [nutritionLogs, nutritionRange]);

  const targetMetrics = useMemo(() => {
    try {
      const plans = generateDietPlans(profile);
      const activePlan = plans[profile.selectedGoal];
      return {
        calories: activePlan.trainingDay.calories,
        protein: activePlan.trainingDay.protein.grams,
        steps: activePlan.trainingDay.steps
      };
    } catch {
      return {
        calories: 2000,
        protein: 140,
        steps: 10000
      };
    }
  }, [profile]);

  // ── Selected metric config ─────────────────────────────────────────────────
  const selectedMetric = trackedMetrics.find(m => m.key === selectedKey) ?? trackedMetrics[0];

  // ── Chart data (Metrics) ────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const ewmaTrend = selectedKey === 'weight' ? calculateEWMATrend(progress) : [];
    const ewmaMap = new Map(ewmaTrend.map(t => [t.date, t.weightTrend]));

    return progress
      .map(p => {
        const val = getMetricValue(p, selectedKey);
        if (val == null) return null;
        return {
          date: p.date.slice(5).replace('-', '.'), // MM.DD
          value: val,
          trendValue: selectedKey === 'weight' ? ewmaMap.get(p.date) : undefined,
        };
      })
      .filter(Boolean) as { date: string; value: number; trendValue?: number }[];
  }, [progress, selectedKey]);

  // ── Bar deltas (Metrics) ────────────────────────────────────────────────────
  const barStats = useMemo(() => {
    return trackedMetrics.map(metric => {
      const values = progress
        .map(p => ({ date: p.date, val: getMetricValue(p, metric.key) }))
        .filter(x => x.val != null) as { date: string; val: number }[];

      if (values.length === 0) return { metric, current: null, delta: null, isGood: null };

      const first = values[0].val;
      const last = values[values.length - 1].val;
      const diff = last - first;
      const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
      const isGood = metric.target === 'up' ? diff >= 0 : diff <= 0;

      return { metric, current: last, delta: diffStr, isGood };
    });
  }, [progress, trackedMetrics]);

  // ── Correlation & Export Logic ─────────────────────────────────────────────
  const correlationWeightCaloriesData = useMemo(() => {
    const dates: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const sortedProgress = [...progress].sort((a, b) => a.date.localeCompare(b.date));

    const getWeightOnDate = (targetDate: string): number | null => {
      let lastWeight: number | null = null;
      for (const entry of sortedProgress) {
        if (entry.date <= targetDate && entry.weight != null) {
          lastWeight = entry.weight;
        }
      }
      return lastWeight;
    };

    return dates.map(dateStr => {
      const nutLog = nutritionLogs.find(l => l.date === dateStr);
      const weight = getWeightOnDate(dateStr);
      return {
        date: dateStr.slice(5).replace('-', '.'),
        weight: weight,
        calories: nutLog ? nutLog.calories : null
      };
    }).filter(d => d.weight !== null || d.calories !== null);
  }, [progress, nutritionLogs]);

  const correlationStrengthVolumeData = useMemo(() => {
    if (!selectedExId) return [];
    
    const dataList: { rawDate: string; date: string; volume: number; maxWeight: number; oneRepMax: number }[] = [];

    workoutSessions.forEach(s => {
      if (!s.logs) return;
      Object.values(s.logs).forEach(log => {
        if (log.exerciseId === selectedExId && log.sets) {
          let volume = 0;
          let maxWeight = 0;
          let maxOneRepMax = 0;
          let hasCompleted = false;

          log.sets.forEach(set => {
            if (set.isCompleted && set.weight > 0 && set.reps > 0) {
              hasCompleted = true;
              volume += set.weight * set.reps;
              if (set.weight > maxWeight) {
                maxWeight = set.weight;
              }
              const orm = set.weight * (1 + set.reps / 30);
              if (orm > maxOneRepMax) {
                maxOneRepMax = orm;
              }
            }
          });

          if (hasCompleted) {
            dataList.push({
              rawDate: s.date,
              date: s.date.slice(5).replace('-', '.'),
              volume: Math.round(volume),
              maxWeight: maxWeight,
              oneRepMax: Math.round(maxOneRepMax * 10) / 10
            });
          }
        }
      });
    });

    return dataList.sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [workoutSessions, selectedExId]);

  const downloadCSV = (data: string[][], filename: string) => {
    const csvContent = "\uFEFF" + data.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportProgressToCSV = () => {
    const headers = ['Дата', 'Заметки', ...tableCols.map(m => m.name)];
    const rows = progress.map(p => [
      p.date.split('-').reverse().join('.'),
      p.notes || '',
      ...tableCols.map(m => {
        const val = getMetricValue(p, m.key);
        return val != null ? val.toString() : '';
      })
    ]);
    downloadCSV([headers, ...rows], 'brosky_gym_metrics.csv');
  };

  const exportWorkoutsToCSV = () => {
    const headers = ['Дата', 'Тренировка', 'Упражнение', 'Подход #', 'Вес (кг)', 'Повторения', 'Выполнено'];
    const rows: string[][] = [];
    workoutSessions.forEach(session => {
      if (!session.logs) return;
      Object.values(session.logs).forEach(log => {
        const ex = exercises.find(e => e.id === log.exerciseId);
        const exName = ex ? ex.name : 'Неизвестное упражнение';
        (log.sets || []).forEach((set, index) => {
          rows.push([
            session.date.split('-').reverse().join('.'),
            session.templateName,
            exName,
            (index + 1).toString(),
            set.weight.toString(),
            set.reps.toString(),
            set.isCompleted ? 'Да' : 'Нет'
          ]);
        });
      });
    });
    downloadCSV([headers, ...rows], 'brosky_gym_workouts.csv');
  };

  const exportNutritionToCSV = () => {
    const headers = ['Дата', 'Калории (ккал)', 'Белки (г)', 'Жиры (г)', 'Углеводы (г)', 'Вода (мл)', 'Шаги'];
    const rows = nutritionLogs.map(log => [
      log.date.split('-').reverse().join('.'),
      log.calories.toString(),
      log.protein.toString(),
      log.fat.toString(),
      log.carbs.toString(),
      (log.water || 0).toString(),
      (log.steps || 0).toString()
    ]);
    downloadCSV([headers, ...rows], 'brosky_gym_nutrition.csv');
  };

  // ── Handlers: full form ────────────────────────────────────────────────────
  const handleFullChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFullEntry(prev => ({
      ...prev,
      [name]: name === 'date' || name === 'notes' ? value : parseFloat(value) || undefined,
    }));
    if (invalidFields.includes(name)) {
      setInvalidFields(prev => prev.filter(f => f !== name));
    }
    if (errorText) setErrorText(null);
  };

  const handleFullSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingMetrics = editableMetrics.filter(
      m => fullEntry[m.key] === undefined || fullEntry[m.key] === null || isNaN(fullEntry[m.key] as number)
    );

    if (missingMetrics.length > 0) {
      setInvalidFields(missingMetrics.map(m => m.key));
      setErrorText('Пожалуйста, заполните все параметры тела для общего замера.');
      return;
    }

    const validation = validateData(ProgressEntrySchema, fullEntry);
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      setErrorText(firstError);
      return;
    }

    addProgressEntry(fullEntry);
    setShowAddForm(false);
    setFullEntry({ date: new Date().toISOString().split('T')[0], notes: '' });
    setInvalidFields([]);
    setErrorText(null);
  };

  // ── Handlers: partial form ─────────────────────────────────────────────────
  const handlePartialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(partialValue);
    if (isNaN(val)) {
      setErrorText('Укажите корректное числовое значение.');
      return;
    }

    const entryData = {
      date: partialDate,
      [partialKey]: val,
      notes: partialNotes || undefined,
    };

    const validation = validateData(ProgressEntrySchema, entryData);
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      setErrorText(firstError);
      return;
    }

    addProgressEntry(entryData);
    setShowAddForm(false);
    setPartialValue('');
    setPartialNotes('');
    setErrorText(null);
  };

  // ── Metric management ──────────────────────────────────────────────────────
  const startEdit = (m: MetricConfig) => {
    setEditingKey(m.key);
    setEditBuf({ name: m.name, unit: m.unit, target: m.target, desc: m.desc, color: m.color });
  };

  const saveEdit = (key: string) => {
    updateMetric(key, editBuf);
    setEditingKey(null);
    setEditBuf({});
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditBuf({});
  };

  const handleAddNewMetric = () => {
    if (!newMetric.key || !newMetric.name || !newMetric.unit) return;
    addMetric({
      key: newMetric.key.toLowerCase().replace(/\s+/g, '_'),
      name: newMetric.name,
      unit: newMetric.unit,
      target: newMetric.target ?? 'up',
      desc: newMetric.desc,
      color: newMetric.color ?? '#466bf7',
    });
    setNewMetric({ target: 'up', color: PALETTE[Math.floor(Math.random() * PALETTE.length)] });
    setShowNewMetricForm(false);
  };

  // ── Color ──────────────────────────────────────────────────────────────────
  const activeColor = selectedMetric?.color ?? '#466bf7';
  const gradientId = `grad-${selectedKey}`;

  // ── Non-virtual metrics (for forms) ───────────────────────────────────────
  const editableMetrics = trackedMetrics.filter(m => !m.isVirtual);

  // ── History table columns ──────────────────────────────────────────────────
  const tableCols = trackedMetrics.filter(m => !m.isVirtual);

  return (
    <>
      <ReportsModal isOpen={isReportsOpen} onClose={() => setIsReportsOpen(false)} />
      <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-gray-800 font-display">Аналитика прогресса</h3>
        <p className="text-xs text-gray-400">Отслеживайте свои обмеры, рост силы и тренды питания в одном месте.</p>
      </div>

      {/* ── Sub-Tab Selector / Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/40 border border-gym-border/40 p-2 rounded-3xl backdrop-blur-xs">
        <div className="overflow-x-auto -mx-1 px-1 py-1 md:-my-1 md:py-0 w-full md:w-auto">
          <div className="flex gap-1.5 p-1 bg-white/60 border border-gym-border/30 rounded-2xl w-fit shadow-xs min-w-max">
            <button
              onClick={() => handleSubTabChange('metrics')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer btn-interactive ${
                subTab === 'metrics'
                  ? 'bg-gym-accent text-white shadow-md shadow-gym-accent/25'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/40'
              }`}
            >
              <Layers size={13} fill="currentColor" fillOpacity={0.15} />
              Замеры тела
            </button>
            <button
              onClick={() => handleSubTabChange('strength')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer btn-interactive ${
                subTab === 'strength'
                  ? 'bg-gym-accent text-white shadow-md shadow-gym-accent/25'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/40'
              }`}
            >
              <Dumbbell size={13} fill="currentColor" fillOpacity={0.15} />
              Сила и рекорды
            </button>
            <button
              onClick={() => handleSubTabChange('nutrition')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer btn-interactive ${
                subTab === 'nutrition'
                  ? 'bg-gym-accent text-white shadow-md shadow-gym-accent/25'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/40'
              }`}
            >
              <Activity size={13} fill="currentColor" fillOpacity={0.15} />
              Тренды питания
            </button>
            <button
              onClick={() => handleSubTabChange('correlation')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer btn-interactive ${
                subTab === 'correlation'
                  ? 'bg-gym-accent text-white shadow-md shadow-gym-accent/25'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/40'
              }`}
            >
              <TrendingUp size={13} />
              Анализ корреляций
            </button>
          </div>
        </div>

        {subTab === 'metrics' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white shadow-sm transition-all cursor-pointer btn-interactive md:mr-1 self-start md:self-auto"
            style={{ background: `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)` }}
          >
            <Plus size={15} />
            Добавить замер
          </button>
        )}
      </div>

      {/* ── Add Form (Metrics only) ────────────────────────────────────────── */}
      {subTab === 'metrics' && showAddForm && (
        <div className="glass-panel rounded-2xl p-6 shadow-xl relative z-30">
          <div className="flex gap-2 mb-5 p-1 rounded-xl bg-white/60 w-fit">
            <button
              onClick={() => setAddMode('full')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
              style={addMode === 'full'
                ? { background: activeColor, color: '#fff', boxShadow: `0 2px 8px ${activeColor}40` }
                : { color: '#6b7280' }}
            >
              <Layers size={14} fill="currentColor" fillOpacity={0.15} />
              Общий
            </button>
            <button
              onClick={() => setAddMode('partial')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
              style={addMode === 'partial'
                ? { background: activeColor, color: '#fff', boxShadow: `0 2px 8px ${activeColor}40` }
                : { color: '#6b7280' }}
            >
              <Pencil size={14} fill="currentColor" fillOpacity={0.15} />
              Выборочный
            </button>
            <button
              onClick={() => setAddMode('calculator')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
              style={addMode === 'calculator'
                ? { background: activeColor, color: '#fff', boxShadow: `0 2px 8px ${activeColor}40` }
                : { color: '#6b7280' }}
            >
              <Activity size={14} fill="currentColor" fillOpacity={0.15} />
              Калькулятор жира
            </button>
          </div>

          {addMode === 'full' && (
            <form onSubmit={handleFullSubmit} className="glass-panel space-y-4 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative z-20">
                   <label htmlFor="full-date" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Дата</label>
                   <DatePicker
                     id="full-date"
                     value={fullEntry.date ?? new Date().toISOString().split('T')[0]}
                     onChange={d => {
                       if (errorText) setErrorText(null);
                       setFullEntry(prev => ({ ...prev, date: d }));
                     }}
                     align="left"
                     className="w-full justify-between text-sm font-semibold h-[46px]"
                   />
                </div>
                {editableMetrics.map(m => {
                  const isInvalid = invalidFields.includes(m.key);
                  return (
                    <div key={m.key} className="relative z-10">
                      <label htmlFor={m.key} className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        {m.name} ({m.unit})
                      </label>
                      <input
                        id={m.key}
                        type="number"
                        step="any"
                        name={m.key}
                        value={fullEntry[m.key] ?? ''}
                        onChange={handleFullChange}
                        className={`w-full bg-white/70 border rounded-xl px-4 text-sm text-gray-700 font-semibold focus:outline-none focus:bg-white focus:border-gym-accent h-[46px] ${
                          isInvalid ? 'border-rose-400 focus:border-rose-500 bg-rose-50/50' : 'border-gym-border'
                        }`}
                        placeholder="0.0"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="notes" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Заметки</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={fullEntry.notes ?? ''}
                  onChange={handleFullChange}
                  rows={2}
                  className="w-full bg-white/70 border border-gym-border rounded-xl px-4 py-2.5 text-sm text-gray-700 font-semibold focus:outline-none focus:bg-white focus:border-gym-accent resize-none"
                  placeholder="Как прошла неделя, самочувствие..."
                />
              </div>

              {errorText && (
                <div className="text-xs text-rose-500 font-bold bg-rose-50/70 border border-rose-100 p-3 rounded-xl animate-fadeIn">
                  <AlertTriangle size={14} className="inline mr-1.5 align-text-bottom" /> {errorText}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-gym-border hover:bg-gray-50 text-gray-500 font-semibold text-sm transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm transition-all cursor-pointer btn-interactive"
                  style={{ background: `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)` }}
                >
                  Сохранить замер
                </button>
              </div>
            </form>
          )}

          {addMode === 'partial' && (
            <form onSubmit={handlePartialSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative z-20">
                  <label htmlFor="partial-key" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Параметр</label>
                  <select
                    id="partial-key"
                    value={partialKey}
                    onChange={e => setPartialKey(e.target.value)}
                    className="w-full bg-white border border-gym-border rounded-xl px-4 text-sm text-gray-700 font-semibold focus:outline-none focus:border-gym-accent h-[46px] cursor-pointer"
                  >
                    {editableMetrics.map(m => (
                      <option key={m.key} value={m.key}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="relative z-10">
                  <label htmlFor="partial-value" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Значение</label>
                  <input
                    id="partial-value"
                    type="number"
                    step="any"
                    required
                    value={partialValue}
                    onChange={e => setPartialValue(e.target.value)}
                    className="w-full bg-white/70 border border-gym-border rounded-xl px-4 text-sm text-gray-700 font-semibold focus:outline-none focus:bg-white focus:border-gym-accent h-[46px]"
                    placeholder="0.0"
                  />
                </div>

                <div className="relative z-20">
                  <label htmlFor="partial-date" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Дата</label>
                  <DatePicker
                    id="partial-date"
                    value={partialDate}
                    onChange={setPartialDate}
                    align="left"
                    className="w-full justify-between text-sm font-semibold h-[46px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="partial-notes" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Заметки</label>
                <textarea
                  id="partial-notes"
                  value={partialNotes}
                  onChange={e => setPartialNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-white/70 border border-gym-border rounded-xl px-4 py-2.5 text-sm text-gray-700 font-semibold focus:outline-none focus:bg-white focus:border-gym-accent resize-none"
                  placeholder="Заметка к этому замеру..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-gym-border hover:bg-gray-50 text-gray-500 font-semibold text-sm transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm transition-all cursor-pointer btn-interactive"
                  style={{ background: `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)` }}
                >
                  Сохранить
                </button>
              </div>
            </form>
          )}

          {/* ── Calculator Form (Флот США) ─────────────────────────────────────── */}
          {addMode === 'calculator' && (
            <div className="space-y-4">
              <form onSubmit={handleCalculateBodyFat} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Пол */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Пол</label>
                    <div className="flex gap-2 p-1 rounded-xl bg-white/60 border border-gym-border/30 h-[46px] items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setCalcGender('male');
                          setCalcNeck('38');
                          setCalcWaist('80');
                        }}
                        className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          calcGender === 'male' ? 'bg-gym-accent text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        Мужчина
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCalcGender('female');
                          setCalcNeck('35');
                          setCalcWaist('70');
                        }}
                        className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          calcGender === 'female' ? 'bg-gym-accent text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        Женщина
                      </button>
                    </div>
                  </div>

                  {/* Рост */}
                  <div>
                    <label htmlFor="calc-height" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Рост (см)</label>
                    <input
                      id="calc-height"
                      type="number"
                      step="any"
                      required
                      value={calcHeight}
                      onChange={e => setCalcHeight(e.target.value)}
                      className="w-full bg-white/70 border border-gym-border rounded-xl px-4 text-sm text-gray-700 font-semibold focus:outline-none focus:bg-white focus:border-gym-accent h-[46px]"
                      placeholder="175"
                    />
                  </div>

                  {/* Вес */}
                  <div>
                    <label htmlFor="calc-weight" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Вес (кг)</label>
                    <input
                      id="calc-weight"
                      type="number"
                      step="any"
                      required
                      value={calcWeight}
                      onChange={e => setCalcWeight(e.target.value)}
                      className="w-full bg-white/70 border border-gym-border rounded-xl px-4 text-sm text-gray-700 font-semibold focus:outline-none focus:bg-white focus:border-gym-accent h-[46px]"
                      placeholder="70"
                    />
                  </div>

                  {/* Обхват шеи */}
                  <div>
                    <label htmlFor="calc-neck" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Обхват шеи (см)</label>
                    <input
                      id="calc-neck"
                      type="number"
                      step="any"
                      required
                      value={calcNeck}
                      onChange={e => setCalcNeck(e.target.value)}
                      className="w-full bg-white/70 border border-gym-border rounded-xl px-4 text-sm text-gray-700 font-semibold focus:outline-none focus:bg-white focus:border-gym-accent h-[46px]"
                      placeholder="38"
                    />
                  </div>

                  {/* Обхват талии */}
                  <div>
                    <label htmlFor="calc-waist" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Обхват талии (см)</label>
                    <input
                      id="calc-waist"
                      type="number"
                      step="any"
                      required
                      value={calcWaist}
                      onChange={e => setCalcWaist(e.target.value)}
                      className="w-full bg-white/70 border border-gym-border rounded-xl px-4 text-sm text-gray-700 font-semibold focus:outline-none focus:bg-white focus:border-gym-accent h-[46px]"
                      placeholder="80"
                    />
                  </div>

                  {/* Обхват бедер (только для женщин) */}
                  {calcGender === 'female' && (
                    <div>
                      <label htmlFor="calc-hips" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Обхват бедер (см)</label>
                      <input
                        id="calc-hips"
                        type="number"
                        step="any"
                        required
                        value={calcHips}
                        onChange={e => setCalcHips(e.target.value)}
                        className="w-full bg-white/70 border border-gym-border rounded-xl px-4 text-sm text-gray-700 font-semibold focus:outline-none focus:bg-white focus:border-gym-accent h-[46px]"
                        placeholder="95"
                      />
                    </div>
                  )}
                </div>

                {errorText && (
                  <div className="text-xs text-rose-500 font-bold bg-rose-50/70 border border-rose-100 p-3 rounded-xl animate-fadeIn">
                    <AlertTriangle size={14} className="inline mr-1.5 align-text-bottom" /> {errorText}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setCalcResult(null);
                      setErrorText(null);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-gym-border hover:bg-gray-50 text-gray-500 font-semibold text-sm transition-all cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm transition-all cursor-pointer btn-interactive"
                    style={{ background: `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)` }}
                  >
                    Рассчитать жир
                  </button>
                </div>
              </form>

              {/* Результат расчета */}
              {calcResult !== null && (
                <div className="mt-4 p-5 rounded-2xl bg-gym-accent/5 border border-gym-accent/20 space-y-3 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Ваш результат по методу флота США:</p>
                      <p className="text-2xl font-black text-gym-accent mt-1">
                        {calcResult}% <span className="text-sm font-bold text-gray-500">жира</span>
                      </p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-gym-accent/15 text-gym-accent font-bold text-xs">
                      {calcGender === 'male' 
                        ? (calcResult < 6 ? 'Дефицит' : calcResult < 14 ? 'Атлет' : calcResult < 18 ? 'Фитнес' : calcResult < 25 ? 'Норма' : 'Избыток')
                        : (calcResult < 14 ? 'Дефицит' : calcResult < 21 ? 'Атлет' : calcResult < 25 ? 'Фитнес' : calcResult < 32 ? 'Норма' : 'Избыток')
                      }
                    </div>
                  </div>
                  <p className="text-xs text-slate-500/90 leading-relaxed font-sans antialiased">
                    При сохранении вес ({calcWeight} кг), процент жира ({calcResult}%) и обхваты тела будут автоматически записаны в историю прогресса за сегодня, а параметры в вашем профиле — обновлены.
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveCalcResult}
                    className="w-full py-3 rounded-xl bg-gym-accent hover:bg-gym-accent-dark text-white font-bold text-sm transition-all cursor-pointer shadow-xs btn-interactive flex items-center justify-center gap-1.5"
                  >
                    <Check size={16} />
                    Сохранить замеры и применить к профилю
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 1: Metrics (Замеры тела) ─────────────────────────────────── */}
      {renderedSubTab === 'metrics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Левая колонка (Графики, карточки, управление параметрами, журнал) */}
          <div 
            className="lg:col-span-7 space-y-6 animate-fadeInUp opacity-0"
            style={{ animationDelay: '0ms' }}
          >
            {/* Main Chart */}
            <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: activeColor }}
                />
                <h4 className="font-bold text-gray-800 text-base">{selectedMetric?.name}</h4>
                <span className="text-sm text-gray-400">{selectedMetric?.unit}</span>
              </div>

              {chartData.length >= 2 ? (
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={activeColor} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={activeColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="0"
                        vertical={false}
                        stroke="rgba(0,0,0,0.05)"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        content={<CustomTooltip unit={selectedMetric?.unit} color={activeColor} />}
                        cursor={{ stroke: activeColor, strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={activeColor}
                        strokeWidth={2.5}
                        fill={`url(#${gradientId})`}
                        activeDot={{
                          r: 6,
                          fill: '#fff',
                          stroke: activeColor,
                          strokeWidth: 2.5,
                        }}
                        dot={false}
                      />
                      {selectedKey === 'weight' && (
                        <Line
                          type="monotone"
                          dataKey="trendValue"
                          stroke="#6366f1"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                          name="Тренд (EWMA)"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                  Нужно минимум 2 замера для графика
                </div>
              )}
            </div>

            {/* Metrics Bar */}
            {progress.length > 0 && (
              <div className="overflow-x-auto pb-1">
                <div className="flex gap-3 min-w-max">
                  {barStats.map(({ metric, current, delta, isGood }) => (
                    <MetricCard
                      key={metric.key}
                      metric={metric}
                      current={current}
                      delta={delta}
                      isGood={isGood}
                      isSelected={selectedKey === metric.key}
                      onClick={() => setSelectedKey(metric.key)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Manage Metrics Panel */}
            <div className="glass-panel rounded-2xl overflow-hidden shadow-sm" style={{ transition: 'none' }}>
              <button
                onClick={() => setShowMetricsPanel(!showMetricsPanel)}
                className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-gray-700 hover:bg-white/20 transition-colors btn-spin-hover cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Settings size={16} fill="currentColor" fillOpacity={0.12} className="text-gray-400" />
                  Настройка параметров замеров
                </span>
                {showMetricsPanel ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              <div
                className={`grid transition-all duration-500 ease-in-out ${
                  showMetricsPanel ? 'grid-rows-[1fr] opacity-100 border-t border-gym-border/30' : 'grid-rows-[0fr] opacity-0 border-t border-transparent'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-6 pb-6 space-y-3 pt-4">
                    <p className="text-xs text-gray-400">
                      Нажмите на карандаш, чтобы изменить название, единицу, цель или цвет замера. Удалите ненужные или добавьте новые части тела.
                    </p>

                    <div className="space-y-2">
                      {trackedMetrics.map(m => (
                        <div
                          key={m.key}
                          className="flex items-center gap-3 p-3 rounded-xl border bg-white/40 border-gym-border/30"
                        >
                          {editingKey === m.key ? (
                            <input
                              type="color"
                              value={editBuf.color ?? m.color ?? '#466bf7'}
                              onChange={e => setEditBuf(prev => ({ ...prev, color: e.target.value }))}
                              className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent p-0"
                              title="Цвет"
                            />
                          ) : (
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ background: m.color ?? '#466bf7' }}
                            />
                          )}

                          {editingKey === m.key ? (
                            <div className="flex gap-2 flex-1 flex-wrap">
                              <input
                                className="flex-1 min-w-[90px] bg-white border border-gym-border rounded-lg px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-gym-accent"
                                value={editBuf.name ?? ''}
                                onChange={e => setEditBuf(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Название"
                              />
                              <input
                                className="w-16 bg-white border border-gym-border rounded-lg px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-gym-accent"
                                value={editBuf.unit ?? ''}
                                onChange={e => setEditBuf(prev => ({ ...prev, unit: e.target.value }))}
                                placeholder="Ед."
                              />
                              <select
                                className="bg-white border border-gym-border rounded-lg px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-gym-accent"
                                value={editBuf.target ?? 'up'}
                                onChange={e => setEditBuf(prev => ({ ...prev, target: e.target.value as 'up' | 'down' }))}
                              >
                                <option value="up">↑ Цель: рост</option>
                                <option value="down">↓ Цель: снижение</option>
                              </select>
                              <input
                                className="flex-1 min-w-[120px] bg-white border border-gym-border rounded-lg px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-gym-accent"
                                value={editBuf.desc ?? ''}
                                onChange={e => setEditBuf(prev => ({ ...prev, desc: e.target.value }))}
                                placeholder="Описание (необяз.)"
                              />
                            </div>
                          ) : (
                            <div className="flex-1">
                              <span className="text-sm font-semibold text-gray-700">{m.name}</span>
                              <span className="text-xs text-gray-400 ml-2">{m.unit} · {m.target === 'up' ? '↑ рост' : '↓ снижение'}</span>
                              {m.isVirtual && (
                                <span
                                  className="ml-2 text-[10px] text-blue-500 bg-blue-50/70 border border-blue-100 font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider cursor-help flex inline-flex items-center gap-1"
                                  title="Этот параметр вычисляется автоматически на основе других замеров и не вводится вручную."
                                >
                                  <Activity size={11} className="text-blue-500 fill-blue-500/10" />
                                  Вычисляемый
                                </span>
                              )}
                              {m.desc && <p className="text-[11px] text-gray-400 mt-0.5">{m.desc}</p>}
                            </div>
                          )}

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {editingKey === m.key ? (
                              <>
                                <button
                                  onClick={() => saveEdit(m.key)}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-gym-accent transition-colors cursor-pointer"
                                  title="Сохранить"
                                >
                                  <Check size={15} />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                                  title="Отмена"
                                >
                                  <X size={15} />
                                </button>
                              </>
                            ) : (
                              <>
                                {!m.isVirtual && (
                                  <>
                                    <button
                                      onClick={() => startEdit(m)}
                                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                                      title="Редактировать"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    {trackedMetrics.length > 2 && (
                                      <button
                                        onClick={() => deleteMetric(m.key)}
                                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer"
                                        title="Удалить параметр"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {!showNewMetricForm && (
                      <button
                        onClick={() => setShowNewMetricForm(true)}
                        className="w-full py-2.5 border border-dashed border-gym-border hover:border-gym-accent text-xs font-bold text-gray-500 hover:text-gym-accent rounded-xl transition-all cursor-pointer"
                      >
                        + Добавить новый параметр
                      </button>
                    )}

                    {showNewMetricForm && (
                      <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gym-border/60">
                        <h5 className="text-xs font-bold text-gray-700">Новый измеряемый параметр</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            aria-label="Название нового параметра"
                            className="bg-white border border-gym-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-gym-accent"
                            placeholder="Название (например, Шея)"
                            value={newMetric.name ?? ''}
                            onChange={e => {
                              const n = e.target.value;
                              setNewMetric(p => ({ ...p, name: n, key: n }));
                            }}
                          />
                          <input
                            aria-label="Единица измерения"
                            className="bg-white border border-gym-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-gym-accent"
                            placeholder="Единица (например, см)"
                            value={newMetric.unit ?? ''}
                            onChange={e => setNewMetric(p => ({ ...p, unit: e.target.value }))}
                          />
                          <select
                            aria-label="Цель изменения параметра"
                            className="bg-white border border-gym-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-gym-accent"
                            value={newMetric.target ?? 'up'}
                            onChange={e => setNewMetric(p => ({ ...p, target: e.target.value as 'up' | 'down' }))}
                          >
                            <option value="up">Цель: рост</option>
                            <option value="down">Цель: снижение</option>
                          </select>
                        </div>
                        <input
                          aria-label="Описание параметра"
                          className="w-full bg-white border border-gym-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-gym-accent"
                          placeholder="Короткое описание или как замерять (необязательно)"
                          value={newMetric.desc ?? ''}
                          onChange={e => setNewMetric(p => ({ ...p, desc: e.target.value }))}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setShowNewMetricForm(false)}
                            className="px-3 py-1.5 rounded-lg border border-gym-border text-xs text-gray-500 font-semibold cursor-pointer"
                          >
                            Отмена
                          </button>
                          <button
                            onClick={handleAddNewMetric}
                            className="px-3 py-1.5 rounded-lg bg-gym-accent text-xs text-white font-semibold shadow-sm cursor-pointer"
                          >
                            Создать
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* History Table */}
            {progress.length > 0 && (
              <div className="glass-panel rounded-2xl p-6 shadow-xl">
                <h4 className="font-bold text-gray-800 mb-4">Журнал измерений</h4>
                <div className="overflow-x-auto min-h-[160px]">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-white/40 border-b border-gym-border text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3.5 px-4">Дата</th>
                        {tableCols.map(m => (
                          <th key={m.key} className="py-3.5 px-4 whitespace-nowrap">{m.name}</th>
                        ))}
                        <th className="py-3.5 px-4">Заметки</th>
                        <th className="py-3.5 px-4 text-center">—</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progress.slice().reverse().map(p => (
                        <tr key={p.date} className="border-b border-gym-border/30 hover:bg-white/20 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-gray-600 font-mono text-xs">
                            {p.date.split('-').reverse().join('.')}
                          </td>
                          {tableCols.map(m => {
                            const val = p[m.key];
                            return (
                              <td key={m.key} className="py-3.5 px-4 text-gray-700 font-medium tabular-nums">
                                {val != null ? `${val} ${m.unit}` : <span className="text-gray-300">—</span>}
                              </td>
                            );
                          })}
                          <td className="py-3.5 px-4 text-xs text-gray-400 max-w-[150px] truncate" title={p.notes}>
                            {p.notes || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => deleteProgressEntry(p.date)}
                              className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 transition-colors"
                              title="Удалить"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {progress.length === 0 && !showAddForm && (
              <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-gym-accent flex items-center justify-center mx-auto mb-1 select-none">
                  <Layers size={22} fill="currentColor" fillOpacity={0.12} />
                </div>
                <h4 className="font-bold text-gray-700 mb-1">Нет замеров</h4>
                <p className="text-sm text-gray-400">Добавьте первый замер, чтобы начать отслеживать прогресс</p>
              </div>
            )}
          </div>

          {/* Правая колонка (Физический профиль атлета) */}
          <div 
            className="lg:col-span-5 space-y-6 animate-fadeInUp opacity-0"
            style={{ animationDelay: '100ms' }}
          >
            <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gym-accent border-b border-gym-border pb-3">
                <Shield size={20} />
                Физический профиль атлета
              </h3>

              {/* Параметры */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-3 rounded-xl border border-gym-border/30 text-center">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">Стартовый вес</span>
                  <span className="text-lg font-extrabold text-gray-800 font-display whitespace-nowrap">
                    {profile.weight}
                    <span className="text-xs font-normal text-gray-400 ml-0.5 font-sans">кг</span>
                  </span>
                </div>

                <div className="glass-card p-3 rounded-xl border border-gym-border/30 text-center">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">Стартовый жир</span>
                  <span className="text-lg font-extrabold text-gray-800 font-display whitespace-nowrap">
                    {profile.fatPercent}
                    <span className="text-xs font-normal text-gray-400 ml-0.5 font-sans">%</span>
                  </span>
                </div>

                <div className="glass-card p-3 rounded-xl border border-gym-border/30 text-center">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">Рост</span>
                  <span className="text-lg font-extrabold text-gray-800 font-display whitespace-nowrap">
                    {profile.height}
                    <span className="text-xs font-normal text-gray-400 ml-0.5 font-sans">см</span>
                  </span>
                </div>

                <div className="glass-card p-3 rounded-xl border border-gym-border/30 text-center">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">Возраст</span>
                  <span className="text-lg font-extrabold text-gray-800 font-display whitespace-nowrap">
                    {profile.age}
                    <span className="text-xs font-normal text-gray-400 ml-0.5 font-sans">лет</span>
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
          </div>
        </div>
      )}

      {/* ── SUB-TAB 2: Strength (Сила и рекорды) ────────────────────────────── */}
      {renderedSubTab === 'strength' && (
        <div className="space-y-6">
          {/* Card: Относительная Сила (DOTS & Wilks Score) */}
          <div className="glass-panel rounded-2xl p-5 shadow-xl border border-gym-border/60 bg-gradient-to-br from-white/90 via-white/50 to-blue-50/40 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gym-accent/10 border border-gym-accent/20 flex items-center justify-center text-gym-accent shadow-xs shrink-0">
                  <Activity size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-800 text-sm">Относительная Сила (DOTS & Wilks)</h4>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${relativeStrength.levelColor}`}>
                      {relativeStrength.levelCategory}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Коэффициент силового потенциала относительно массы тела ({profile.weight || 70} кг)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:border-l sm:border-gym-border/40 sm:pl-6 pt-3 sm:pt-0 border-t border-gym-border/20 sm:border-t-0">
                <div className="text-left sm:text-right">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">IPF DOTS</div>
                  <div ref={dotsRef} className="text-xl sm:text-2xl font-black text-gym-accent tabular-nums">{relativeStrength.dots}</div>
                </div>
                <div className="h-8 w-px bg-gym-border/40" />
                <div className="text-left sm:text-right">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Wilks Score</div>
                  <div ref={wilksRef} className="text-xl sm:text-2xl font-black text-gray-700 tabular-nums">{relativeStrength.wilks}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Шкала Спортивных Разрядов */}
          <div className="glass-panel rounded-2xl p-5 shadow-xl border border-gym-border/60 bg-gradient-to-br from-white/90 via-white/50 to-amber-50/40 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-xs shrink-0 font-black text-base">
                  <Trophy size={20} className="text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-800 text-sm">Шкала Силовых Нормативов</h4>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${rankProgress.currentRankColor}`}>
                      {rankProgress.currentRank}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Норматив по сумме 1RM ({rankProgress.currentWeight} кг) на вес тела ({profile.weight || 70} кг)
                  </p>
                </div>
              </div>

              {rankProgress.nextRank && (
                <div className="text-left sm:text-right text-xs">
                  <span className="text-gray-400 font-medium">Следующий разряд: </span>
                  <span className="font-extrabold text-gym-accent">{rankProgress.nextRank}</span>
                  <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
                    Осталось: +{rankProgress.neededWeight} кг
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar к следующему разряду */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-bold text-gray-500">
                <span>{rankProgress.currentRank}</span>
                <span>{rankProgress.progressPercent}%</span>
                <span>{rankProgress.nextRank || 'МСМК'}</span>
              </div>
              <div className="w-full bg-gray-200/80 rounded-full h-3 p-0.5 shadow-inner overflow-hidden">
                <div
                  ref={rankProgressRef}
                  className="bg-gradient-to-r from-gym-accent via-blue-500 to-amber-500 h-full rounded-full shadow-xs"
                  style={{ width: `${Math.max(4, rankProgress.progressPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card: 1RM Matrix (Одноповторный максимум по 6 формулам) */}
          <div className="glass-panel rounded-2xl p-5 shadow-xl border border-gym-border/60 bg-gradient-to-br from-white/90 via-white/50 to-indigo-50/40 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gym-accent/10 border border-gym-accent/20 flex items-center justify-center text-gym-accent shadow-xs shrink-0 font-black text-base">
                  <Sparkles size={20} className="text-gym-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-800 text-sm">Матрица 1RM (Одноповторный максимум)</h4>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-blue-50 text-gym-accent border-blue-200">
                      {matrix1RM.optimalFormulaName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Сравнение 6 научных алгоритмов расчёта 1RM (Epley, Brzycki, Lander, Mayhew, Wathan, O'Conner)
                  </p>
                </div>
              </div>
            </div>

            {/* Ввод параметров веса и повторов */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label htmlFor="1rm-calc-weight" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Рабочий вес (кг)</label>
                <input
                  id="1rm-calc-weight"
                  type="number"
                  min="1"
                  max="500"
                  value={calc1rmWeight}
                  onChange={e => setCalc1rmWeight(Number(e.target.value))}
                  className="w-full bg-white/80 border border-gym-border rounded-xl px-3.5 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:border-gym-accent"
                />
              </div>

              <div>
                <label htmlFor="1rm-calc-reps" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Повторения</label>
                <input
                  id="1rm-calc-reps"
                  type="number"
                  min="1"
                  max="30"
                  value={calc1rmReps}
                  onChange={e => setCalc1rmReps(Number(e.target.value))}
                  className="w-full bg-white/80 border border-gym-border rounded-xl px-3.5 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:border-gym-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Оптимальный 1RM</label>
                <div className="h-[38px] bg-gym-accent/10 border border-gym-accent/20 rounded-xl px-3.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-gym-accent">Расчёт</span>
                  <span className="text-lg font-black font-display text-gym-accent">{matrix1RM.optimal} кг</span>
                </div>
              </div>
            </div>

            {/* Сетка всех 6 формул */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
              <div className="p-2.5 bg-white/80 border border-gym-border/40 rounded-xl text-center">
                <span className="text-[9px] font-extrabold text-gray-400 uppercase block">Epley</span>
                <span className="text-sm font-black text-gray-800 font-display block">{matrix1RM.epley} кг</span>
                <span className="text-[8px] text-gray-400 block">5-10 повторов</span>
              </div>

              <div className="p-2.5 bg-white/80 border border-gym-border/40 rounded-xl text-center">
                <span className="text-[9px] font-extrabold text-gray-400 uppercase block">Brzycki</span>
                <span className="text-sm font-black text-gray-800 font-display block">{matrix1RM.brzycki} кг</span>
                <span className="text-[8px] text-gray-400 block">пауэрлифтинг</span>
              </div>

              <div className="p-2.5 bg-white/80 border border-gym-border/40 rounded-xl text-center">
                <span className="text-[9px] font-extrabold text-gray-400 uppercase block">Lander</span>
                <span className="text-sm font-black text-gray-800 font-display block">{matrix1RM.lander} кг</span>
                <span className="text-[8px] text-gray-400 block">1-4 повтора</span>
              </div>

              <div className="p-2.5 bg-white/80 border border-gym-border/40 rounded-xl text-center">
                <span className="text-[9px] font-extrabold text-gray-400 uppercase block">Mayhew</span>
                <span className="text-sm font-black text-gray-800 font-display block">{matrix1RM.mayhew} кг</span>
                <span className="text-[8px] text-gray-400 block">экспоненциальная</span>
              </div>

              <div className="p-2.5 bg-white/80 border border-gym-border/40 rounded-xl text-center">
                <span className="text-[9px] font-extrabold text-gray-400 uppercase block">Wathan</span>
                <span className="text-sm font-black text-gray-800 font-display block">{matrix1RM.wathan} кг</span>
                <span className="text-[8px] text-gray-400 block">10+ повторов</span>
              </div>

              <div className="p-2.5 bg-white/80 border border-gym-border/40 rounded-xl text-center">
                <span className="text-[9px] font-extrabold text-gray-400 uppercase block">Среднее</span>
                <span className="text-sm font-black text-gym-accent font-display block">{matrix1RM.average} кг</span>
                <span className="text-[8px] text-gray-400 block">всех формул</span>
              </div>
            </div>
          </div>

          {performedExercises.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-gym-accent flex items-center justify-center mx-auto mb-1 select-none">
                <Dumbbell size={22} fill="currentColor" fillOpacity={0.12} />
              </div>
              <h4 className="font-bold text-gray-700 mb-1">Нет тренировок</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                Вы еще не провели ни одной силовой тренировки. Выполните упражнение во вкладке «Тренировки», чтобы здесь появился график роста силы!
              </p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1.5 relative z-40">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Упражнение</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsExDropdownOpen(!isExDropdownOpen)}
                      className="flex items-center gap-2 bg-white/70 border border-gym-border rounded-xl px-4 py-2 text-sm text-gray-700 font-bold hover:bg-white transition-all cursor-pointer h-10 btn-interactive justify-between min-w-[220px]"
                    >
                      <span>{performedExercises.find(e => e.id === selectedExId)?.name || 'Выберите упражнение'}</span>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isExDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isExDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsExDropdownOpen(false)} />
                        <div className="absolute left-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-gym-border/80 rounded-2xl shadow-xl p-1.5 max-h-60 overflow-y-auto z-50 animate-fadeIn">
                          {performedExercises.map(ex => (
                            <button
                              key={ex.id}
                              onClick={() => {
                                setSelectedExId(ex.id);
                                setIsExDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer btn-interactive ${
                                selectedExId === ex.id
                                  ? 'bg-gym-accent text-white shadow-xs'
                                  : 'text-gray-600 hover:bg-gray-100/70'
                              }`}
                            >
                              {ex.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex bg-gray-150 p-0.5 rounded-lg text-xs font-bold self-start">
                  <button
                    onClick={() => setStrengthMetric('1rm')}
                    className={`px-3 py-1.5 rounded-md cursor-pointer transition-all btn-interactive ${strengthMetric === '1rm' ? 'bg-white shadow-xs text-gym-accent' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Расчетный 1RM
                  </button>
                  <button
                    onClick={() => setStrengthMetric('max_weight')}
                    className={`px-3 py-1.5 rounded-md cursor-pointer transition-all btn-interactive ${strengthMetric === 'max_weight' ? 'bg-white shadow-xs text-gym-accent' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Максимальный вес
                  </button>
                </div>
              </div>

              {strengthChartData.length >= 2 ? (
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={strengthChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grad-strength" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#466bf7" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#466bf7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip
                        content={<CustomTooltip unit="кг" color="#466bf7" />}
                        cursor={{ stroke: '#466bf7', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#466bf7"
                        strokeWidth={2.5}
                        fill="url(#grad-strength)"
                        activeDot={{ r: 6, fill: '#fff', stroke: '#466bf7', strokeWidth: 2.5 }}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                  Недостаточно данных. Нужно провести минимум 2 тренировки с этим упражнением.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 3: Nutrition (Тренды питания) ────────────────────────────── */}
      {renderedSubTab === 'nutrition' && (
        nutritionLogs.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-1 select-none">
              <Activity size={22} fill="currentColor" fillOpacity={0.12} />
            </div>
            <h4 className="font-bold text-gray-700 mb-1">Нет логов питания</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              Вы еще не заполнили логи питания. Начните вносить калории и шаги во вкладке «Сегодня»!
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Тренды калорий и шагов
              </h4>
              
              <div className="flex bg-gray-150 p-0.5 rounded-lg text-xs font-bold">
                {[7, 14, 30].map(days => (
                  <button
                    key={days}
                    onClick={() => setNutritionRange(days)}
                    className={`px-3 py-1.5 rounded-md cursor-pointer transition-all btn-interactive ${nutritionRange === days ? 'bg-white shadow-xs text-gym-accent' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    {days} дн
                  </button>
                ))}
              </div>
            </div>

            {/* 1. Калории */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-400 select-none">
                <span>Калории (ккал)</span>
                <span className="text-amber-500 font-semibold">Цель: {targetMetrics.calories} ккал</span>
              </div>
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={nutritionChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-nutrition-cal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff9500" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#ff9500" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                    <Tooltip
                      content={<CustomTooltip unit="ккал" color="#ff9500" />}
                      cursor={{ stroke: '#ff9500', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <ReferenceLine y={targetMetrics.calories} stroke="#ff9500" strokeWidth={1.5} strokeDasharray="5 5" />
                    <Area
                      type="monotone"
                      dataKey="calories"
                      stroke="#ff9500"
                      strokeWidth={2.5}
                      fill="url(#grad-nutrition-cal)"
                      activeDot={{ r: 5, fill: '#fff', stroke: '#ff9500', strokeWidth: 2 }}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Шаги */}
            <div className="space-y-2 pt-4 border-t border-gym-border/30">
              <div className="flex justify-between text-xs font-bold text-gray-400 select-none">
                <span>Внетренировочная активность (шаги)</span>
                <span className="text-blue-500 font-semibold">Цель: {targetMetrics.steps} шагов</span>
              </div>
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={nutritionChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-nutrition-steps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#466bf7" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#466bf7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                    <Tooltip
                      content={<CustomTooltip unit="шагов" color="#466bf7" />}
                      cursor={{ stroke: '#466bf7', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <ReferenceLine y={targetMetrics.steps} stroke="#466bf7" strokeWidth={1.5} strokeDasharray="5 5" />
                    <Area
                      type="monotone"
                      dataKey="steps"
                      stroke="#466bf7"
                      strokeWidth={2.5}
                      fill="url(#grad-nutrition-steps)"
                      activeDot={{ r: 5, fill: '#fff', stroke: '#466bf7', strokeWidth: 2 }}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )
      )}

      {/* ── SUB-TAB 4: Correlation (Анализ корреляций и экспорт) ────────────── */}
      {renderedSubTab === 'correlation' && (
        <div className="space-y-6">
          {/* 1. Панель экспорта данных в Bento-стиле */}
          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-gym-accent"></span>
              Экспорт данных во внешние файлы
            </h4>
            <p className="text-xs text-gray-400">
              Выгрузите свою историю тренировок, антропометрии и питания в формате CSV (совместим с Excel и Google Таблицами) для отправки тренеру или личного анализа.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <button
                onClick={exportProgressToCSV}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border border-gym-border/30 bg-white/40 hover:bg-white/70 transition-all cursor-pointer text-center group btn-interactive"
              >
                <div className="p-2.5 bg-blue-50 text-gym-accent rounded-xl group-hover:scale-110 transition-transform mb-3">
                  <Layers size={18} />
                </div>
                <span className="font-bold text-xs text-gray-700">Замеры тела</span>
                <span className="text-[10px] text-gray-400 mt-1">Формат CSV</span>
              </button>

              <button
                onClick={exportWorkoutsToCSV}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border border-gym-border/30 bg-white/40 hover:bg-white/70 transition-all cursor-pointer text-center group btn-interactive"
              >
                <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-110 transition-transform mb-3">
                  <Dumbbell size={18} />
                </div>
                <span className="font-bold text-xs text-gray-700">История тренировок</span>
                <span className="text-[10px] text-gray-400 mt-1">Формат CSV</span>
              </button>

              <button
                onClick={exportNutritionToCSV}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border border-gym-border/30 bg-white/40 hover:bg-white/70 transition-all cursor-pointer text-center group btn-interactive"
              >
                <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform mb-3">
                  <Activity size={18} />
                </div>
                <span className="font-bold text-xs text-gray-700">Дневник питания</span>
                <span className="text-[10px] text-gray-400 mt-1">Формат CSV</span>
              </button>
            </div>
          </div>

          {/* 2. Комбинированный график: Вес vs Калории */}
          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Анализ корреляции: Вес тела vs Калорийность
            </h4>
            <p className="text-xs text-gray-400">
              Показывает зависимость веса тела (левая ось Y, кг) от среднедневной калорийности питания (правая ось Y, ккал) за последние 30 дней.
            </p>

            {correlationWeightCaloriesData.length >= 2 ? (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <ComposedChart data={correlationWeightCaloriesData} margin={{ top: 10, right: -5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    
                    {/* Левая ось Y для веса */}
                    <YAxis 
                      yAxisId="left" 
                      domain={['auto', 'auto']} 
                      tick={{ fontSize: 10, fill: '#a855f7' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    
                    {/* Правая ось Y для калорий */}
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      domain={['auto', 'auto']} 
                      tick={{ fontSize: 10, fill: '#f43f5e' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    
                    <Tooltip 
                      cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 1 }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const wVal = payload.find(p => p.dataKey === 'weight')?.value;
                          const cVal = payload.find(p => p.dataKey === 'calories')?.value;
                          return (
                            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-gray-100 shadow-xl text-xs space-y-1">
                              <p className="text-gray-400 font-semibold mb-1">{label}</p>
                              {wVal !== undefined && (
                                <p className="font-bold text-purple-600">
                                  Вес: {wVal} <span className="font-normal text-gray-400">кг</span>
                                </p>
                              )}
                              {cVal !== undefined && cVal !== null && (
                                <p className="font-bold text-rose-500">
                                  Калории: {cVal} <span className="font-normal text-gray-400">ккал</span>
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                    
                    <Bar 
                      yAxisId="right" 
                      dataKey="calories" 
                      name="Калорийность питания (ккал)" 
                      fill="#f43f5e" 
                      opacity={0.15} 
                      radius={[4, 4, 0, 0]} 
                      barSize={20}
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="weight" 
                      name="Вес тела (кг)" 
                      stroke="#a855f7" 
                      strokeWidth={2.5} 
                      dot={{ r: 3, stroke: '#a855f7', strokeWidth: 1.5, fill: '#fff' }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                Недостаточно данных. Заполните логи питания и сделайте замеры веса.
              </div>
            )}
          </div>

          {/* 3. Комбинированный график: Сила vs Объем тренировок */}
          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1.5">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  Прогрессия нагрузок: Сила (1RM) vs Объем тренировок
                </h4>
                <p className="text-xs text-gray-400">
                  Сопоставление расчетного разового максимума 1RM (левая ось Y, кг) и суммарного объема подходов (правая ось Y, кг) за каждую сессию.
                </p>
              </div>

              {performedExercises.length > 0 && (
                <div className="relative z-40">
                  <button
                    onClick={() => setIsExDropdownOpen(!isExDropdownOpen)}
                    className="flex items-center gap-2 bg-white/70 border border-gym-border rounded-xl px-4 py-2 text-xs text-gray-700 font-bold hover:bg-white transition-all cursor-pointer h-9 btn-interactive justify-between min-w-[200px]"
                  >
                    <span>{performedExercises.find(e => e.id === selectedExId)?.name || 'Выберите упражнение'}</span>
                    <ChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${isExDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isExDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsExDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-gym-border/80 rounded-2xl shadow-xl p-1.5 max-h-60 overflow-y-auto z-50 animate-fadeIn">
                        {performedExercises.map(ex => (
                          <button
                            key={ex.id}
                            onClick={() => {
                              setSelectedExId(ex.id);
                              setIsExDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer btn-interactive ${
                              selectedExId === ex.id
                                ? 'bg-gym-accent text-white shadow-xs'
                                : 'text-gray-600 hover:bg-gray-100/70'
                            }`}
                          >
                            {ex.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {performedExercises.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                Сначала выполните силовую тренировку, чтобы появился список упражнений.
              </div>
            ) : correlationStrengthVolumeData.length >= 2 ? (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <ComposedChart data={correlationStrengthVolumeData} margin={{ top: 10, right: -5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    
                    {/* Левая ось Y для 1RM */}
                    <YAxis 
                      yAxisId="left" 
                      domain={['auto', 'auto']} 
                      tick={{ fontSize: 10, fill: '#466bf7' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    
                    {/* Правая ось Y для тренировочного объема */}
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      domain={['auto', 'auto']} 
                      tick={{ fontSize: 10, fill: '#f97316' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    
                    <Tooltip 
                      cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 1 }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const ormVal = payload.find(p => p.dataKey === 'oneRepMax')?.value;
                          const volVal = payload.find(p => p.dataKey === 'volume')?.value;
                          return (
                            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-gray-100 shadow-xl text-xs space-y-1">
                              <p className="text-gray-400 font-semibold mb-1">{label}</p>
                              {ormVal !== undefined && (
                                <p className="font-bold text-gym-accent">
                                  Сила (1RM): {ormVal} <span className="font-normal text-gray-400">кг</span>
                                </p>
                              )}
                              {volVal !== undefined && (
                                <p className="font-bold text-orange-500">
                                  Объем: {volVal} <span className="font-normal text-gray-400">кг</span>
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                    
                    <Bar 
                      yAxisId="right" 
                      dataKey="volume" 
                      name="Объем тренировки (кг)" 
                      fill="#f97316" 
                      opacity={0.15} 
                      radius={[4, 4, 0, 0]} 
                      barSize={20}
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="oneRepMax" 
                      name="Расчетный 1RM (кг)" 
                      stroke="#466bf7" 
                      strokeWidth={2.5} 
                      dot={{ r: 3, stroke: '#466bf7', strokeWidth: 1.5, fill: '#fff' }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                Недостаточно данных. Проведите минимум 2 тренировки с этим упражнением для построения графика корреляции.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
});
