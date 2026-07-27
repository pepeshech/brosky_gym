import React, { useState, useEffect, useMemo } from 'react';
import { useGymStore, calcEpley1RM, MUSCLE_GROUPS, MUSCLE_COLORS, EQUIPMENT_TYPES } from '../store/gymStore';
import type {
  WorkoutTemplate, WorkoutTemplateExercise, ExerciseLog, SetLog, Exercise, PersonalRecord, WorkoutSession, } from '../types';
import {
  Plus, Trash2, CheckCircle, ChevronDown, ChevronUp, Pencil, Check, X, Dumbbell, ClipboardList, Library, Trophy, ArrowRight, History, ChevronLeft, ChevronRight, Clock, Search, Layers, Muscle, Sparkles } from './BroskyIcon';
import { DatePicker } from './DatePicker';
import { useDialog } from './DialogProvider';
import { validateData, ExerciseSchema, WorkoutTemplateSchema } from '../utils/validation';
import { AnatomyModel } from './AnatomyModel';
import { SmartWorkoutGeneratorModal } from './workout/SmartWorkoutGeneratorModal';
import { calculateAdjusted1RM } from '../utils/formulas';
import { calculateAutoPilotRecommendation } from '../utils/autoPilotEngine';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).substring(2, 11);

const parseRepsDefault = (reps: number | string): number => {
  if (typeof reps === 'number') return reps;
  const m = reps.match(/(\d+)/);
  return m ? parseInt(m[1]) : 10;
};

const buildInitialLog = (
  tmplEx: WorkoutTemplateExercise,
  lastLog: ExerciseLog | undefined,
  exercises: Exercise[],
): ExerciseLog => {
  const defaultReps = parseRepsDefault(tmplEx.reps);
  const exercise = exercises.find((e) => e.id === tmplEx.exerciseId);
  const isLowerBody = exercise && ['Квадрицепс', 'Бицепс бедра', 'Ягодицы', 'Икры', 'Поясница'].includes(exercise.muscleGroup);
  
  // Если все подходы прошлой тренировки были успешно выполнены, предлагаем прогрессивную перегрузку
  const lastSessionCompleted = lastLog && lastLog.sets.length > 0 && lastLog.sets.every(s => s.isCompleted);
  
  const sets: SetLog[] = Array.from({ length: tmplEx.sets }, (_, i) => {
    const prevWeight = lastLog?.sets?.[i]?.weight ?? lastLog?.weight ?? 0;
    let weight = prevWeight;
    let isOverloaded = false;
    let overloadAmount = 0;
    
    if (lastSessionCompleted && prevWeight > 0) {
      overloadAmount = isLowerBody ? 2.5 : 1.25;
      weight = prevWeight + overloadAmount;
      isOverloaded = true;
    }
    
    return {
      setIndex: i,
      reps: defaultReps,
      weight,
      isCompleted: false,
      isOverloaded,
      overloadAmount,
      prevWeight,
    };
  });
  return { exerciseId: tmplEx.exerciseId, sets, isCompleted: false };
};

const formatSeconds = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
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
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// ── Tab Bar ────────────────────────────────────────────────────────────────
const TabBar = ({
  active, onChange,
}: {
  active: 'session' | 'history' | 'programs' | 'exercises';
  onChange: (t: 'session' | 'history' | 'programs' | 'exercises') => void;
}) => {
  const tabs: { key: 'session' | 'history' | 'programs' | 'exercises'; label: string; icon: React.ReactNode }[] = [
    { key: 'session',   label: 'Тренировка',  icon: <Dumbbell size={15} fill="currentColor" fillOpacity={0.15} /> },
    { key: 'history',   label: 'История',     icon: <History size={15} fill="currentColor" fillOpacity={0.12} /> },
    { key: 'programs',  label: 'Программы',   icon: <ClipboardList size={15} fill="currentColor" fillOpacity={0.12} /> },
    { key: 'exercises', label: 'Упражнения',  icon: <Library size={15} fill="currentColor" fillOpacity={0.12} /> },
  ];
  return (
    <div className="flex gap-0.5 sm:gap-1 p-1 rounded-2xl bg-white/50 border border-gym-border shadow-sm">
      {tabs.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer btn-interactive"
          style={active === key
            ? { background: '#466bf7', color: '#fff', boxShadow: '0 2px 8px rgba(70,107,247,0.3)' }
            : { color: '#6b7280' }}
        >
          {icon} <span className="hidden min-[400px]:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SESSION TAB
// ─────────────────────────────────────────────────────────────────────────────

interface SessionTabProps {
  onTabChange?: (tab: 'session' | 'history' | 'programs' | 'exercises') => void;
}

const SessionTab: React.FC<SessionTabProps> = ({ onTabChange }) => {
  const exercises = useGymStore(s => s.exercises);
  const workoutTemplates = useGymStore(s => s.workoutTemplates);
  const workoutSessions = useGymStore(s => s.workoutSessions);
  const personalRecords = useGymStore(s => s.personalRecords);
  const profile = useGymStore(s => s.profile);
  const saveWorkoutSession = useGymStore(s => s.saveWorkoutSession);
  const updatePersonalRecord = useGymStore(s => s.updatePersonalRecord);
  const { confirm } = useDialog();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    workoutTemplates[0]?.id ?? ''
  );

  // Auto-select template if none is selected and list becomes populated
  useEffect(() => {
    if (workoutTemplates.length > 0 && (!selectedTemplateId || !workoutTemplates.some(t => t.id === selectedTemplateId))) {
      const timer = setTimeout(() => {
        setSelectedTemplateId(workoutTemplates[0].id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [workoutTemplates, selectedTemplateId]);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [logs, setLogs] = useState<Record<string, ExerciseLog>>({});
  const [sessionNotes, setSessionNotes] = useState('');
  const [stimulusScore, setStimulusScore] = useState<'low' | 'optimal' | 'extreme'>('optimal');
  const [domsScore, setDomsScore] = useState<'none' | 'mild' | 'severe'>('mild');

  const handleShiftDate = (days: number) => {
    const d = new Date(sessionDate);
    d.setDate(d.getDate() + days);
    setSessionDate(d.toISOString().split('T')[0]);
    setSaved(false);
  };
  const [saved, setSaved] = useState(false);

  // Workout Start/End tracking
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // New PR tracking
  const [newPRs, setNewPRs] = useState<string[]>([]);

  // Rest Timer State
  const [restSeconds, setRestSeconds] = useState<number>(0);
  const [restActive, setRestActive] = useState<boolean>(false);

  // AI Generator Modal state
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);

  const template = workoutTemplates.find((t) => t.id === selectedTemplateId);

  // Timer interval for elapsed time
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (workoutStarted && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.round((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      timer = setTimeout(() => {
        setElapsedTime(0);
      }, 0);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (timer) clearTimeout(timer);
    };
  }, [workoutStarted, startTime]);

  // Audio helper (Web Audio API)
  const playRestCompleteSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Rest audio failed", e);
    }
  };

  // Rest Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (restActive && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((prev) => prev - 1);
      }, 1000);
    } else if (restActive && restSeconds === 0) {
      timer = setTimeout(() => {
        setRestActive(false);
        playRestCompleteSound();
      }, 0);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (timer) clearTimeout(timer);
    };
  }, [restActive, restSeconds]);

  // Init logs when template changes
  useEffect(() => {
    if (!template) return;
    const initLogs: Record<string, ExerciseLog> = {};
    template.exercises
      .forEach((tmplEx) => {
        const lastSession = [...workoutSessions]
          .reverse()
          .find((s) => s.date !== sessionDate && s.logs[tmplEx.exerciseId]);
        const lastLog = lastSession?.logs[tmplEx.exerciseId];
        initLogs[tmplEx.exerciseId] = buildInitialLog(tmplEx, lastLog, exercises);
      });
    const timer = setTimeout(() => {
      setLogs(initLogs);
      setSaved(false);
      setNewPRs([]);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedTemplateId, sessionDate, workoutTemplates, template, workoutSessions, exercises]);

  const handleSetChange = (exId: string, setIdx: number, field: 'weight' | 'reps' | 'rpe' | 'rir', val: number) => {
    setLogs((prev) => ({
      ...prev,
      [exId]: {
        ...prev[exId],
        sets: prev[exId].sets.map((s) =>
          s.setIndex === setIdx 
            ? { 
                ...s, 
                [field]: val,
                ...(field === 'weight' ? { isOverloaded: false } : {})
              } 
            : s
        ),
      },
    }));
  };

  const handleSetComplete = (exId: string, setIdx: number) => {
    setLogs((prev) => {
      const currentCompleted = prev[exId].sets.find((s) => s.setIndex === setIdx)?.isCompleted;
      const sets = prev[exId].sets.map((s) =>
        s.setIndex === setIdx ? { ...s, isCompleted: !s.isCompleted } : s
      );
      const isCompleted = sets.every((s) => s.isCompleted);

      // Запуск таймера отдыха при завершении подхода
      if (!currentCompleted) {
        setRestSeconds(90);
        setRestActive(true);
      }

      return { ...prev, [exId]: { ...prev[exId], sets, isCompleted } };
    });
  };

  const addSet = (exId: string) => {
    setLogs((prev) => {
      const existing = prev[exId].sets;
      const last = existing[existing.length - 1];
      const newSet: SetLog = {
        setIndex: existing.length,
        reps: last?.reps ?? 10,
        weight: last?.weight ?? 0,
        isCompleted: false,
      };
      return { ...prev, [exId]: { ...prev[exId], sets: [...existing, newSet] } };
    });
  };

  const removeSet = (exId: string, setIdx: number) => {
    setLogs((prev) => {
      const sets = prev[exId].sets
        .filter((s) => s.setIndex !== setIdx)
        .map((s, i) => ({ ...s, setIndex: i }));
      return { ...prev, [exId]: { ...prev[exId], sets } };
    });
  };

  // Progress
  const totalSets = Object.values(logs).reduce((acc, l) => acc + l.sets.length, 0);
  const completedSets = Object.values(logs).reduce(
    (acc, l) => acc + l.sets.filter((s) => s.isCompleted).length, 0
  );
  const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  // Get PR for exercise
  const getPR = (exId: string): PersonalRecord | undefined =>
    personalRecords.find((pr) => pr.exerciseId === exId);

  const handleSave = () => {
    if (!template) return;
    const activeLogs = Object.fromEntries(
      Object.entries(logs).filter(([, l]) => l.sets.some((s) => s.isCompleted))
    );
    if (Object.keys(activeLogs).length === 0) return;

    // Auto-update PRs
    const detectedPRs: string[] = [];
    Object.entries(activeLogs).forEach(([exId, log]) => {
      const bestSet = log.sets
        .filter((s) => s.isCompleted && s.weight > 0 && s.reps > 0)
        .reduce(
          (best, s) => (calcEpley1RM(s.weight, s.reps) > calcEpley1RM(best.weight, best.reps) ? s : best),
          { weight: 0, reps: 1 }
        );
      if (bestSet.weight > 0) {
        const newRM = calcEpley1RM(bestSet.weight, bestSet.reps);
        const existingPR = getPR(exId);
        if (!existingPR || newRM > existingPR.weight1rm) {
          updatePersonalRecord({
            exerciseId: exId,
            weight1rm: newRM,
            date: sessionDate,
            actualWeight: bestSet.weight,
            actualReps: bestSet.reps,
          });
          detectedPRs.push(exId);
        } else {
          // Даже если это не новый абсолютный PR, зафиксируем его в истории как новый подход
          updatePersonalRecord({
            exerciseId: exId,
            weight1rm: newRM,
            date: sessionDate,
            actualWeight: bestSet.weight,
            actualReps: bestSet.reps,
          });
        }
      }
    });

    const durationMin = startTime ? Math.max(1, Math.round((Date.now() - startTime) / 60000)) : undefined;

    const session: WorkoutSession = {
      id: uid(),
      date: sessionDate,
      templateId: template.id,
      templateName: template.name,
      logs: activeLogs,
      notes: sessionNotes || undefined,
      duration: durationMin,
      stimulusScore,
      domsScore,
    };
    saveWorkoutSession(session);
    setNewPRs(detectedPRs);
    setSaved(true);
    setWorkoutStarted(false);
    setStartTime(null);
  };

  if (workoutTemplates.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center shadow-sm border border-gym-border/30 max-w-md mx-auto space-y-6 animate-fadeInUp mt-8" style={{ transition: 'none' }}>
        <div className="w-16 h-16 bg-gym-accent/10 rounded-full flex items-center justify-center mx-auto text-gym-accent shadow-xs">
          <Dumbbell size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="font-display font-bold text-gray-800 text-lg">Создайте первую программу</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            У вас пока нет шаблонов тренировочных программ. Чтобы начать отслеживать свои тренировки в дневнике, создайте свою первую тренировочную программу.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => onTabChange && onTabChange('programs')}
            className="w-full py-3 rounded-xl bg-gym-accent hover:bg-blue-600 text-white font-bold text-sm shadow-sm transition-all active:scale-95 cursor-pointer btn-interactive text-center"
          >
            Создать программу
          </button>
        </div>
      </div>
    );
  }

  const orderedExercises = template?.exercises.slice().sort((a, b) => a.order - b.order) ?? [];

  return (
    <div className="space-y-5">

      {/* Template selector */}
      <div className="overflow-x-auto -mx-4 px-4 pb-1">
        <div className="flex items-center gap-2 min-w-max">
          {workoutTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => { setSelectedTemplateId(t.id); setSaved(false); }}
              className="flex flex-col items-start px-4 py-3 rounded-2xl border transition-all text-left flex-shrink-0"
              style={{
                background: selectedTemplateId === t.id ? hex2rgba(t.color, 0.12) : 'rgba(255,255,255,0.5)',
                borderColor: selectedTemplateId === t.id ? `${t.color}80` : 'rgba(0,0,0,0.07)',
                boxShadow: selectedTemplateId === t.id ? `0 0 0 1px ${t.color}40, 0 4px 12px ${t.color}20` : 'none',
              }}
            >
              <span className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                <span className="text-xs font-bold text-gray-600">{t.name}</span>
              </span>
              <span className="text-[11px] text-gray-400">{t.exercises.length} упр.</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsAiGeneratorOpen(true)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-gym-accent hover:bg-gym-accent/90 text-white font-black text-xs shadow-md shadow-gym-accent/20 transition-all cursor-pointer flex-shrink-0 btn-interactive active:scale-95"
          >
            <Sparkles size={16} />
            <span>Смарт-Генератор</span>
          </button>
        </div>
      </div>

      <SmartWorkoutGeneratorModal
        isOpen={isAiGeneratorOpen}
        onClose={() => setIsAiGeneratorOpen(false)}
        onStartSession={(templateId) => {
          setSelectedTemplateId(templateId);
          setWorkoutStarted(true);
          setStartTime(Date.now());
          setSaved(false);
          setNewPRs([]);
        }}
      />

      {/* Session header */}
      <div className="glass-panel rounded-2xl p-5 shadow-sm relative z-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: template?.color ?? '#466bf7', boxShadow: `0 0 8px ${template?.color ?? '#466bf7'}60` }}
            />
            <h3 className="font-bold text-gray-800">{template?.name ?? '—'}</h3>
            {template?.description && (
              <span className="text-xs text-gray-400">{template.description}</span>
            )}
          </div>
          <div className="flex items-center bg-white/50 border border-gym-border/60 rounded-xl shadow-xs h-9">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="h-9 w-9 flex items-center justify-center hover:bg-gray-150 transition-all cursor-pointer text-gray-500 rounded-l-xl border-r border-gym-border/30 btn-interactive btn-interactive-nav-left"
            >
              <ChevronLeft size={14} />
            </button>
            <DatePicker
              value={sessionDate}
              onChange={(d) => { setSessionDate(d); setSaved(false); }}
              align="right"
              className="!border-0 !bg-transparent !shadow-none px-3 text-xs font-bold text-gray-700 hover:bg-gray-100/50 transition-all h-9 flex items-center justify-center"
            />
            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="h-9 w-9 flex items-center justify-center hover:bg-gray-150 transition-all cursor-pointer text-gray-500 rounded-r-xl border-l border-gym-border/30 btn-interactive btn-interactive-nav-right"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Start / Finish Controls */}
        <div className="flex gap-2 mb-4">
          {!workoutStarted ? (
            <button
              onClick={() => {
                setWorkoutStarted(true);
                setStartTime(Date.now());
                setSaved(false);
                setNewPRs([]);
              }}
              className="flex-1 py-3 rounded-xl bg-gym-accent text-white font-bold text-sm shadow-sm transition-all hover:bg-blue-600 active:scale-95 cursor-pointer text-center"
            >
              Начать тренировку
            </button>
          ) : (
            <div className="flex-1 flex gap-2 items-center">
              <div className="flex-1 bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-600">Длительность:</span>
                <span className="font-mono font-bold text-blue-700 text-sm">
                  {formatSeconds(elapsedTime)}
                </span>
              </div>
              <button
                onClick={async () => {
                  if (await confirm({
                    title: 'Сбросить таймер',
                    message: 'Сбросить текущий таймер тренировки?',
                    confirmText: 'Сбросить',
                    isDestructive: true
                  })) {
                    setWorkoutStarted(false);
                    setStartTime(null);
                  }
                }}
                className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-250 text-gray-500 transition-all font-semibold text-xs border border-gym-border/30 cursor-pointer"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {totalSets > 0 && workoutStarted && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{completedSets} / {totalSets} подходов</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${template?.color ?? '#466bf7'}, ${template?.color ?? '#466bf7'}bb)`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* PR celebration */}
      {saved && newPRs.length > 0 && (
        <div className="rounded-2xl p-4 border border-amber-300 bg-amber-50 flex items-center gap-3">
          <Trophy size={20} className="text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-amber-800 text-sm flex items-center gap-1.5">
              Новые личные рекорды! <Trophy size={14} className="text-amber-500" fill="currentColor" fillOpacity={0.15} />
            </p>
            <p className="text-xs text-amber-600">
              {newPRs.map((id) => exercises.find((e) => e.id === id)?.name).filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Saved banner */}
      {saved && newPRs.length === 0 && (
        <div className="rounded-2xl p-4 border border-emerald-200 bg-emerald-50 flex items-center gap-2 text-emerald-700 text-sm font-semibold">
          <Check size={16} /> Тренировка сохранена!
        </div>
      )}

      {/* Exercise cards */}
      {orderedExercises.map((tmplEx) => {
        const ex = exercises.find((e) => e.id === tmplEx.exerciseId);
        if (!ex) return null;
        const log = logs[tmplEx.exerciseId];
        if (!log) return null;
        const pr = getPR(tmplEx.exerciseId);
        const color = MUSCLE_COLORS[ex.muscleGroup] ?? '#007aff';
        const isNewPR = newPRs.includes(ex.id);

        const lastSession = [...workoutSessions]
          .reverse()
          .find((s) => s.date !== sessionDate && s.logs[tmplEx.exerciseId]);
        const lastSessionLog = lastSession?.logs[tmplEx.exerciseId];
        const lastValidSets = lastSessionLog?.sets.filter(s => s.isCompleted && s.weight > 0 && s.reps > 0) || [];

        return (
          <div
            key={tmplEx.exerciseId}
            className="glass-panel rounded-2xl overflow-hidden shadow-sm border transition-all"
            style={isNewPR ? { borderColor: '#f59e0b', boxShadow: '0 0 0 1px #f59e0b40, 0 4px 20px #f59e0b20' } : {}}
          >
            {/* Exercise header */}
            <div className="px-5 py-4 flex items-start justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <h4 className="font-bold text-gray-800 text-sm">{ex.name}</h4>
                  {(ex.muscleGroups || [ex.muscleGroup]).map((m, i) => (
                    <span
                      key={m}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ 
                        background: i === 0 ? hex2rgba(color, 0.1) : '#f3f4f6', 
                        color: i === 0 ? color : '#6b7280' 
                      }}
                    >
                      {m}
                    </span>
                  ))}
                  {isNewPR && (
                    <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                      <Trophy size={11} className="text-amber-500" fill="currentColor" fillOpacity={0.15} /> Рекорд!
                    </span>
                  )}
                </div>
                {pr && (
                  <p className="text-[11px] text-gray-400 mt-1 ml-4">
                    PR: <span className="font-bold text-gray-600">{pr.weight1rm} кг</span>
                    {pr.actualWeight && ` (${pr.actualWeight}×${pr.actualReps})`}
                  </p>
                )}
                {workoutStarted && (() => {
                  const autoPilotRec = calculateAutoPilotRecommendation(ex.id, workoutSessions, profile, 8);
                  return (
                    <div className="mt-2.5 space-y-1.5">
                      <div className={`p-2.5 rounded-xl text-xs border flex items-center justify-between gap-2 shadow-2xs select-none ${
                        autoPilotRec.protectionActive
                          ? 'bg-rose-50/80 border-rose-200/70 text-rose-800'
                          : 'bg-indigo-50/60 border-indigo-100/60 text-gray-800'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className={autoPilotRec.protectionActive ? 'text-rose-500 flex-shrink-0' : 'text-gym-accent flex-shrink-0'} />
                          <div className="flex flex-col">
                            <span className="font-extrabold text-xs">
                              ИИ-Автопилот: {autoPilotRec.recommendedWeight} кг × {autoPilotRec.recommendedReps} (RIR {autoPilotRec.targetRir})
                            </span>
                            <span className="text-[10px] text-gray-500 font-normal leading-tight mt-0.5">
                              {autoPilotRec.reason}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setLogs(prev => {
                              const currentSets = prev[ex.id]?.sets || [];
                              const updatedSets = currentSets.map(s => ({
                                ...s,
                                weight: autoPilotRec.recommendedWeight,
                                reps: autoPilotRec.recommendedReps,
                                rir: autoPilotRec.targetRir,
                              }));
                              return { ...prev, [ex.id]: { ...prev[ex.id], sets: updatedSets } };
                            });
                          }}
                          className="px-2.5 py-1 bg-gym-accent hover:bg-blue-600 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer flex-shrink-0"
                        >
                          Заполнить ИИ
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* Previous session history */}
              {lastValidSets.length > 0 && (
                <div className="hidden sm:block text-right ml-4">
                  <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">Прошлая тренировка</p>
                  <div className="flex flex-col gap-0.5">
                    {lastValidSets.map((s, idx) => (
                      <span key={idx} className="text-[11px] font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md inline-block whitespace-nowrap">
                        {s.weight}кг × {s.reps}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {lastValidSets.length > 0 && (
                <div className="sm:hidden text-right ml-2 flex flex-col justify-center">
                  <p className="text-[10px] text-gray-400 font-semibold mb-1">Ранее</p>
                  <span className="text-[11px] font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded inline-block whitespace-nowrap">
                    {lastValidSets[0].weight}×{lastValidSets[0].reps}
                    {lastValidSets.length > 1 && <span className="text-gray-400 ml-1">+{lastValidSets.length - 1}</span>}
                  </span>
                </div>
              )}
            </div>

            {/* Sets */}
            <div className="px-3 sm:px-5 py-3 space-y-2 w-full">
              <div className="grid grid-cols-[24px_1fr_1.5fr_1.5fr_32px] sm:grid-cols-[32px_1fr_2fr_2fr_40px] gap-2 sm:gap-4 text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                <span>#</span>
                <span></span>
                <span className="text-center">Вес (кг)</span>
                <span className="text-center">Повт.</span>
                <span></span>
              </div>

              {log.sets.map((set) => {
                const currentRir = set.rir ?? (set.rpe ? 10 - set.rpe : 0);
                const setRM = set.weight > 0 && set.reps > 0 ? calculateAdjusted1RM(set.weight, set.reps, currentRir) : null;
                const isBetter = pr && setRM != null && setRM > pr.weight1rm;
                return (
                  <div
                    key={set.setIndex}
                    className="grid grid-cols-[24px_1fr_1.5fr_1.5fr_32px] sm:grid-cols-[32px_1fr_2fr_2fr_40px] gap-2 sm:gap-4 items-center rounded-xl px-1 sm:px-2 py-1 sm:py-1.5 transition-all"
                    style={set.isCompleted ? { background: 'rgba(16, 185, 129, 0.08)' } : {}}
                  >
                    <span className="text-[10px] sm:text-xs font-bold text-gray-400 tabular-nums text-center">{set.setIndex + 1}</span>
                    <div className="flex flex-col items-center justify-center min-w-0">
                      {isBetter && <Trophy size={10} className="text-amber-500 flex-shrink-0 mb-0.5" />}
                      {set.isCompleted ? (
                        <div className="flex flex-col items-center gap-0.5 animate-fadeIn">
                          <span className="text-[8px] font-bold text-gray-400 select-none">Запас (RIR)</span>
                          <div className="flex gap-0.5">
                            {[0, 1, 2, 3].map(val => (
                              <button
                                key={val}
                                onClick={() => {
                                  handleSetChange(tmplEx.exerciseId, set.setIndex, 'rir', val);
                                  handleSetChange(tmplEx.exerciseId, set.setIndex, 'rpe', 10 - val);
                                }}
                                className={`w-[21px] h-[21px] rounded-full text-[9px] font-black flex items-center justify-center transition-all btn-interactive cursor-pointer select-none ${
                                  currentRir === val 
                                    ? 'bg-gym-accent text-white shadow-md shadow-gym-accent/30 scale-105' 
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                                title={`Запас: ${val} повт. (RPE ${10 - val})`}
                              >
                                +{val}
                              </button>
                            ))}
                          </div>
                          {setRM != null && (
                            <span className="text-[8px] font-bold text-gym-accent mt-0.5 tabular-nums">
                              ~{setRM}кг
                            </span>
                          )}
                        </div>
                      ) : (
                        setRM != null && (
                          <span className="text-[9px] sm:text-[11px] text-gray-400 tabular-nums truncate">
                            ~{setRM}кг
                          </span>
                        )
                      )}
                    </div>
                    <div className="relative w-full">
                      <label htmlFor={`weight-${tmplEx.exerciseId}-${set.setIndex}`} className="sr-only">Weight</label>
                      <input
                        id={`weight-${tmplEx.exerciseId}-${set.setIndex}`}
                        type="number"
                        step="0.5"
                        disabled={!workoutStarted}
                        value={set.weight || ''}
                        onChange={(e) => handleSetChange(tmplEx.exerciseId, set.setIndex, 'weight', parseFloat(e.target.value) || 0)}
                        placeholder="—"
                        className="w-full bg-white/80 border border-gym-border rounded-lg px-1.5 py-1 text-center font-bold text-gray-800 focus:outline-none focus:border-gym-accent text-xs sm:text-sm tabular-nums disabled:opacity-50"
                      />
                      {set.isOverloaded && (
                        <span className="absolute -top-1.5 -right-1 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white flex items-center justify-center shadow-xs select-none pointer-events-none transform scale-90 sm:scale-100">
                          +{ set.overloadAmount }кг
                        </span>
                      )}
                    </div>
                    <label htmlFor={`reps-${tmplEx.exerciseId}-${set.setIndex}`} className="sr-only">Reps</label>
                    <input
                      id={`reps-${tmplEx.exerciseId}-${set.setIndex}`}
                      type="number"
                      step="1"
                      disabled={!workoutStarted}
                      value={set.reps || ''}
                      onChange={(e) => handleSetChange(tmplEx.exerciseId, set.setIndex, 'reps', parseInt(e.target.value) || 0)}
                      placeholder="—"
                      className="w-full bg-white/80 border border-gym-border rounded-lg px-1.5 py-1 text-center font-bold text-gray-800 focus:outline-none focus:border-gym-accent text-xs sm:text-sm tabular-nums disabled:opacity-50"
                    />
                    <button
                      disabled={!workoutStarted}
                      onClick={() => handleSetComplete(tmplEx.exerciseId, set.setIndex)}
                      className="flex items-center justify-center w-full h-8 sm:h-9 rounded-lg border transition-all disabled:opacity-30 cursor-pointer shadow-sm"
                      style={set.isCompleted
                        ? { background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }
                        : { background: '#f3f4f6', borderColor: '#e5e7eb', color: '#9ca3af' }}
                    >
                      <CheckCircle size={16} className={set.isCompleted ? 'fill-emerald-100' : ''} />
                    </button>
                  </div>
                );
              })}

              {workoutStarted && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => addSet(tmplEx.exerciseId)}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gym-accent transition-colors"
                  >
                    <Plus size={12} /> Подход
                  </button>
                  {log.sets.length > 1 && (
                    <button
                      onClick={() => removeSet(tmplEx.exerciseId, log.sets.length - 1)}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-300 hover:text-rose-400 transition-colors"
                    >
                      <X size={12} /> Убрать
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Session notes + save */}
      {template && workoutStarted && (
        <form className="glass-panel p-4 space-y-4 rounded-2xl">
          <label htmlFor="session-notes" className="sr-only">Заметки</label>
          <input
            id="session-notes"
            type="text"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="Заметки к тренировке (необязательно)…"
            className="w-full bg-white/60 border border-gym-border rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-gym-accent"
          />
          <div className="space-y-3.5 pt-3 border-t border-gym-border/30">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-gym-accent" /> Оценка пампа и стимула</span>
                <span className="text-[10px] text-gray-400 font-medium">Научный анализ</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStimulusScore('low')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    stimulusScore === 'low'
                      ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                      : 'bg-white/70 border-gym-border/50 text-gray-600 hover:bg-white hover:text-gray-800'
                  }`}
                >
                  Слабый
                </button>
                <button
                  type="button"
                  onClick={() => setStimulusScore('optimal')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    stimulusScore === 'optimal'
                      ? 'bg-gym-accent border-gym-accent text-white shadow-xs'
                      : 'bg-white/70 border-gym-border/50 text-gray-600 hover:bg-white hover:text-gray-800'
                  }`}
                >
                  Оптимальный
                </button>
                <button
                  type="button"
                  onClick={() => setStimulusScore('extreme')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    stimulusScore === 'extreme'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-white/70 border-gym-border/50 text-gray-600 hover:bg-white hover:text-gray-800'
                  }`}
                >
                  Мощный
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                <span>Ожидаемая боль (DOMS)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDomsScore('none')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    domsScore === 'none'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white/70 border-gym-border/50 text-gray-600 hover:bg-white hover:text-gray-800'
                  }`}
                >
                  Без боли
                </button>
                <button
                  type="button"
                  onClick={() => setDomsScore('mild')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    domsScore === 'mild'
                      ? 'bg-gym-accent border-gym-accent text-white shadow-xs'
                      : 'bg-white/70 border-gym-border/50 text-gray-600 hover:bg-white hover:text-gray-800'
                  }`}
                >
                  Умеренная
                </button>
                <button
                  type="button"
                  onClick={() => setDomsScore('severe')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    domsScore === 'severe'
                      ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                      : 'bg-white/70 border-gym-border/50 text-gray-600 hover:bg-white hover:text-gray-800'
                  }`}
                >
                  Сильная боль
                </button>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 leading-snug">
              * Исследования Schoenfeld & Damas: Сильная крепатура указывает на микротравму фасции. Ориентируйтесь на глубокий памп при комфортном восстановлении.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saved}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #466bf7, #2555df)' }}
          >
            {saved ? <><Check size={18} /> Сохранено</> : <><ArrowRight size={18} /> Завершить тренировку</>}
          </button>
        </form>
      )}

      {/* Rest Timer Floating Overlay */}
      {restActive && restSeconds > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-gym-border/80 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3.5 z-50 animate-fadeInUp select-none min-w-[260px]">
          <div className="w-9 h-9 rounded-xl bg-gym-accent/10 text-gym-accent flex items-center justify-center flex-shrink-0 animate-pulse">
            <Clock size={18} />
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Время отдыха</span>
            <span className="font-mono font-black text-gray-800 text-base tabular-nums leading-none mt-0.5">{formatSeconds(restSeconds)}</span>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={() => setRestSeconds(prev => prev + 30)}
              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200/80 active:scale-95 text-[10px] font-bold text-gray-600 rounded-lg btn-interactive transition-all cursor-pointer"
            >
              +30с
            </button>
            <button
              onClick={() => setRestActive(false)}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-[10px] font-bold text-rose-500 rounded-lg btn-interactive transition-all cursor-pointer"
            >
              Пропуск
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAMS TAB
// ─────────────────────────────────────────────────────────────────────────────

const MUSCLE_PRIORITY: Record<string, number> = {
  'Квадрицепс': 1,
  'Ягодицы': 2,
  'Бицепс бедра': 3,
  'Приводящие': 4,
  'Абдукторы': 5,
  'Широчайшие': 6,
  'Поясница': 7,
  'Грудь': 8,
  'Трапеции': 9,
  'Плечи': 10,
  'Трицепс': 11,
  'Бицепс': 12,
  'Предплечья': 13,
  'Пресс': 14,
  'Икры': 15,
  'Зубчатые': 16,
  'Шея': 17,
  'Кардио': 18
};

const ProgramsTab: React.FC = () => {
  const exercises = useGymStore(s => s.exercises);
  const workoutTemplates = useGymStore(s => s.workoutTemplates);
  const addWorkoutTemplate = useGymStore(s => s.addWorkoutTemplate);
  const updateWorkoutTemplate = useGymStore(s => s.updateWorkoutTemplate);
  const deleteWorkoutTemplate = useGymStore(s => s.deleteWorkoutTemplate);
  const { confirm, alert } = useDialog();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<WorkoutTemplate>>({
    name: '',
    description: '',
    color: '#466bf7',
    exercises: [],
    isCustom: true,
  });
  const [exSearch, setExSearch] = useState('');

  const handleSmartSort = () => {
    setForm((prev) => {
      if (!prev.exercises) return prev;
      const sorted = [...prev.exercises].sort((a, b) => {
        const exA = exercises.find((e) => e.id === a.exerciseId);
        const exB = exercises.find((e) => e.id === b.exerciseId);
        const pA = exA ? (MUSCLE_PRIORITY[exA.muscleGroup] ?? 99) : 99;
        const pB = exB ? (MUSCLE_PRIORITY[exB.muscleGroup] ?? 99) : 99;
        return pA - pB;
      });
      return { ...prev, exercises: sorted.map((e, i) => ({ ...e, order: i })) };
    });
  };

  // editingTemplate удален, так как не используется

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', description: '', color: '#466bf7', exercises: [], isCustom: true });
    setShowForm(true);
  };

  const openEdit = (t: WorkoutTemplate) => {
    setEditingId(t.id);
    setForm({ ...t, exercises: [...t.exercises] });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name) return;

    const templateData = {
      name: form.name,
      description: form.description ?? '',
      color: form.color ?? '#466bf7',
      exercises: (form.exercises ?? []).map((e, i) => ({ ...e, order: i })),
    };

    const validation = validateData(WorkoutTemplateSchema, templateData);
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      alert(firstError, 'Ошибка валидации');
      return;
    }

    if (editingId) {
      updateWorkoutTemplate(editingId, { ...form, ...templateData });
    } else {
      addWorkoutTemplate({
        id: uid(),
        ...templateData,
        isCustom: true,
      });
    }
    setShowForm(false);
    setEditingId(null);
  };

  const addExToForm = (ex: Exercise) => {
    setForm((prev) => {
      if (prev.exercises?.some((e) => e.exerciseId === ex.id)) return prev;
      const newEx: WorkoutTemplateExercise = {
        exerciseId: ex.id,
        sets: 3,
        reps: 10,
        restSec: 90,
        order: (prev.exercises?.length ?? 0),
      };
      return { ...prev, exercises: [...(prev.exercises ?? []), newEx] };
    });
  };

  const removeExFromForm = (exId: string) => {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises?.filter((e) => e.exerciseId !== exId).map((e, i) => ({ ...e, order: i })),
    }));
  };

  const moveEx = (idx: number, dir: -1 | 1) => {
    setForm((prev) => {
      const arr = [...(prev.exercises ?? [])];
      const swap = idx + dir;
      if (swap < 0 || swap >= arr.length) return prev;
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
      return { ...prev, exercises: arr.map((e, i) => ({ ...e, order: i })) };
    });
  };

  const updateExField = (exId: string, field: keyof WorkoutTemplateExercise, val: string | number) => {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises?.map((e) =>
        e.exerciseId === exId ? { ...e, [field]: val } : e
      ),
    }));
  };

  const filteredExercises = exercises.filter(
    (e) => e && e.name && !form.exercises?.some((fe) => fe.exerciseId === e.id) &&
      e.name.toLowerCase().includes(exSearch.toLowerCase())
  );

  if (showForm) {
    return (
      <div className="space-y-5">
        {/* Form header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowForm(false); setEditingId(null); }}
            className="p-2 rounded-xl hover:bg-white/40 text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
          <h3 className="font-bold text-gray-800">
            {editingId ? 'Редактировать программу' : 'Новая программа'}
          </h3>
        </div>

        {/* Name + color */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Название</label>
              <input
                value={form.name ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Например: Жимовой день"
                className="w-full bg-white/70 border border-gym-border rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-gym-accent text-sm"
              />
            </div>
            <div className="flex-shrink-0 min-w-[210px]">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Цвет программы</label>
              <div className="flex items-center gap-2 h-11">
                {['#466bf7', '#8b5cf6', '#10b981', '#06b6d4', '#f97316', '#f43f5e'].map((color) => {
                  const isSelected = (form.color || '#466bf7') === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, color }))}
                      className={`w-7.5 h-7.5 rounded-full border-2 transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center ${
                        isSelected ? 'border-gray-800 scale-105 shadow-xs' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Выбрать цвет ${color}`}
                    >
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-white block shadow-xs" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Описание</label>
            <input
              value={form.description ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Необязательно…"
              className="w-full bg-white/70 border border-gym-border rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-gym-accent text-sm"
            />
          </div>
        </div>

        {/* Exercises in template */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-700 text-sm">Упражнения в программе</h4>
            {(form.exercises ?? []).length > 1 && (
              <button
                type="button"
                onClick={handleSmartSort}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gym-accent bg-gym-accent/10 hover:bg-gym-accent hover:text-white transition-all cursor-pointer btn-interactive active:scale-95"
              >
                <Layers size={12} />
                Умная сортировка
              </button>
            )}
          </div>
          {(form.exercises ?? []).length === 0 && (
            <p className="text-sm text-gray-400 py-2">Добавьте упражнения ниже</p>
          )}
          {(form.exercises ?? []).map((tmplEx, idx) => {
            const ex = exercises.find((e) => e.id === tmplEx.exerciseId);
            if (!ex) return null;
            const color = MUSCLE_COLORS[ex.muscleGroup] ?? '#007aff';
            const muscleList = ex.muscleGroups || [ex.muscleGroup];
            return (
              <div key={tmplEx.exerciseId} className="flex flex-col gap-2 p-3 rounded-xl border border-gym-border/30 bg-white/30">
                <div className="flex items-center gap-2">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button onClick={() => moveEx(idx, -1)} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 cursor-pointer">
                      <ChevronUp size={14} />
                    </button>
                    <button onClick={() => moveEx(idx, 1)} disabled={idx === (form.exercises?.length ?? 0) - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 cursor-pointer">
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  {/* Info */}
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold text-gray-700 truncate">{ex.name}</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {muscleList.map((m, i) => (
                        <span
                          key={m}
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                          style={{
                            background: i === 0 ? hex2rgba(color, 0.1) : '#f3f4f6',
                            color: i === 0 ? color : '#6b7280'
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => removeExFromForm(ex.id)} className="text-gray-300 hover:text-rose-400 transition-colors ml-auto cursor-pointer flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
                {/* Config row */}
                <div className="flex items-center gap-2 ml-6 flex-wrap">
                  <div className="flex items-center gap-1 bg-white/60 border border-gym-border/40 rounded-lg px-2 py-1">
                    <span className="text-[10px] text-gray-400 font-semibold">Подходы</span>
                    <input
                      type="number" min={1}
                      value={tmplEx.sets}
                      onChange={(e) => updateExField(ex.id, 'sets', parseInt(e.target.value) || 1)}
                      className="w-8 text-center bg-transparent text-sm font-bold text-gray-700 focus:outline-none"
                    />
                  </div>
                  <span className="text-gray-300 text-xs">×</span>
                  <div className="flex items-center gap-1 bg-white/60 border border-gym-border/40 rounded-lg px-2 py-1">
                    <span className="text-[10px] text-gray-400 font-semibold">Повт.</span>
                    <input
                      type="text"
                      value={String(tmplEx.reps)}
                      onChange={(e) => updateExField(ex.id, 'reps', e.target.value)}
                      className="w-10 text-center bg-transparent text-sm font-bold text-gray-700 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-white/60 border border-gym-border/40 rounded-lg px-2 py-1">
                    <Clock size={10} className="text-gray-400 flex-shrink-0" />
                    <input
                      type="number" min={0} step={5}
                      value={tmplEx.restSec ?? 90}
                      onChange={(e) => updateExField(ex.id, 'restSec', parseInt(e.target.value) || 0)}
                      className="w-10 text-center bg-transparent text-sm font-bold text-gray-700 focus:outline-none"
                      title="Отдых (сек)"
                    />
                    <span className="text-[10px] text-gray-400 font-semibold">сек</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Exercise picker */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <h4 className="font-bold text-gray-700 text-sm">Добавить упражнение</h4>
          <div className="relative flex items-center w-full">
            <input
              value={exSearch}
              onChange={(e) => setExSearch(e.target.value)}
              placeholder="Поиск упражнений…"
              className="w-full bg-white/70 border border-gym-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-gym-accent"
            />
            <Search size={14} className="text-gym-accent/70 absolute left-3 fill-gym-accent/5" />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {filteredExercises.map((ex) => {
              const color = MUSCLE_COLORS[ex.muscleGroup] ?? '#007aff';
              const muscleList = ex.muscleGroups || [ex.muscleGroup];
              return (
                <div
                  key={ex.id}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all border border-transparent hover:bg-white/30 hover:border-gym-border/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-gray-700 truncate">{ex.name}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {muscleList.map((m, idx) => (
                          <span
                            key={m}
                            className="text-[9px] font-semibold px-2 py-0.5 rounded-md"
                            style={{
                              background: idx === 0 ? hex2rgba(color, 0.1) : '#f3f4f6',
                              color: idx === 0 ? color : '#6b7280'
                            }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => addExToForm(ex)}
                    className="group relative p-2.5 rounded-xl bg-gym-accent/10 hover:bg-gym-accent text-gym-accent hover:text-white transition-all cursor-pointer flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow-md hover:shadow-gym-accent/30 active:scale-90"
                    title="Добавить в программу"
                    style={{ transition: 'background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s' }}
                  >
                    <Plus size={14} className="transition-transform group-hover:rotate-90 duration-200" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save / Cancel */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!form.name}
            className="flex-1 py-3 rounded-xl font-bold text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #466bf7, #2555df)' }}
          >
            <Check size={16} className="inline mr-2" />
            {editingId ? 'Сохранить изменения' : 'Создать программу'}
          </button>
          <button
            onClick={() => { setShowForm(false); setEditingId(null); }}
            className="px-5 py-3 rounded-xl font-semibold text-gray-600 bg-white/60 border border-gym-border"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={openCreate}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gym-border text-sm font-semibold text-gray-500 hover:border-gym-accent hover:text-gym-accent transition-colors"
      >
        <Plus size={16} /> Создать новую программу
      </button>

      {workoutTemplates.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center space-y-4 border border-gym-border/30 animate-fadeIn">
          <ClipboardList size={32} className="text-gray-300 mx-auto" />
          <div className="space-y-1">
            <h4 className="font-bold text-gray-700 text-sm">Шаблоны программ отсутствуют</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">Создайте свою первую программу тренировок с помощью кнопки выше, чтобы быстро запускать её в дневнике.</p>
          </div>
        </div>
      ) : (
        workoutTemplates.map((t) => {
          const groups = [...new Set(
            t.exercises.map((te) => exercises.find((e) => e.id === te.exerciseId)?.muscleGroup).filter(Boolean)
          )];
          return (
            <div
              key={t.id}
              className="glass-panel rounded-2xl p-5 shadow-sm border transition-all"
              style={{ borderColor: `${t.color}30` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: t.color }} />
                  <div>
                    <h4 className="font-bold text-gray-800">{t.name}</h4>
                    {t.description && <p className="text-xs text-gray-400">{t.description}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(t)}
                    className="p-2 rounded-xl hover:bg-blue-50 text-blue-400 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={async () => {
                      if (await confirm({
                        title: 'Удалить программу',
                        message: `Удалить программу «${t.name}»?`,
                        confirmText: 'Удалить',
                        isDestructive: true
                      })) {
                        deleteWorkoutTemplate(t.id);
                      }
                    }}
                    className="p-2 rounded-xl hover:bg-rose-50 text-rose-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {groups.map((g) => (
                  <span
                    key={g}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: hex2rgba(MUSCLE_COLORS[g!] ?? '#000000', 0.1), color: MUSCLE_COLORS[g!] ?? '#000000' }}
                  >
                    {g}
                  </span>
                ))}
              </div>

              <p className="text-xs text-gray-400">{t.exercises.length} упражнений</p>
            </div>
          );
        })
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISES TAB
// ─────────────────────────────────────────────────────────────────────────────

const ExercisesTab: React.FC = () => {
  const exercises = useGymStore(s => s.exercises);
  const personalRecords = useGymStore(s => s.personalRecords);
  const prHistory = useGymStore(s => s.prHistory);
  const addExercise = useGymStore(s => s.addExercise);
  const updateExercise = useGymStore(s => s.updateExercise);
  const deleteExercise = useGymStore(s => s.deleteExercise);
  const { confirm, alert } = useDialog();


  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Exercise>>({
    muscleGroup: MUSCLE_GROUPS[0],
    muscleGroups: [MUSCLE_GROUPS[0]],
    equipment: 'Гантели',
    repScheme: '3x10',
    color: MUSCLE_COLORS[MUSCLE_GROUPS[0]],
    isCustom: true,
  });

  const filteredExercises = useMemo(() =>
    exercises.filter((e) => {
      // Ищем совпадение либо по основной мышечной группе, либо по дополнительным в muscleGroups
      const matchGroup = !filterGroup || 
        e.muscleGroup === filterGroup || 
        (e.muscleGroups && e.muscleGroups.includes(filterGroup));
      const matchSearch = !searchQuery || (e.name && e.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchGroup && matchSearch;
    }),
    [exercises, filterGroup, searchQuery]
  );



  const openCreate = () => {
    setEditingId(null);
    setForm({ 
      muscleGroup: MUSCLE_GROUPS[0], 
      muscleGroups: [MUSCLE_GROUPS[0]], 
      equipment: 'Гантели', 
      repScheme: '3x10', 
      color: MUSCLE_COLORS[MUSCLE_GROUPS[0]], 
      isCustom: true 
    });
    setShowForm(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditingId(ex.id);
    setForm({ 
      ...ex,
      muscleGroups: ex.muscleGroups || [ex.muscleGroup]
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.muscleGroup) {
      alert('Укажите название упражнения и мышечную группу!', 'Ошибка');
      return;
    }

    const allGroups = [form.muscleGroup, ...(form.muscleGroups || [])].filter((v, i, a) => a.indexOf(v) === i);
    
    const exerciseData = {
      name: form.name,
      muscleGroup: form.muscleGroup,
      muscleGroups: allGroups,
      equipment: form.equipment ?? 'Вес тела',
      repScheme: form.repScheme ?? '3x10',
      technique: form.technique ?? '',
      color: form.color || MUSCLE_COLORS[form.muscleGroup!] || '#007aff',
      isCustom: true,
    };

    const validation = validateData(ExerciseSchema, exerciseData);
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      alert(firstError, 'Ошибка валидации');
      return;
    }

    if (editingId) {
      updateExercise(editingId, { ...form, ...exerciseData });
    } else {
      addExercise({
        id: uid(),
        ...exerciseData,
      });
    }
    setShowForm(false);
    setEditingId(null);
  };

  if (showForm) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-2 rounded-xl hover:bg-white/40 text-gray-500">
            <X size={18} />
          </button>
          <h3 className="font-bold text-gray-800">{editingId ? 'Редактировать упражнение' : 'Новое упражнение'}</h3>
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Название</label>
            <input
              value={form.name ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Например: Тяга верхнего блока"
              className="w-full bg-white/70 border border-gym-border rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-gym-accent text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Группа мышц</label>
              <select
                value={form.muscleGroup ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, muscleGroup: e.target.value, color: MUSCLE_COLORS[e.target.value] }))}
                className="w-full bg-white/70 border border-gym-border rounded-xl px-3 py-3 text-gray-800 focus:outline-none focus:border-gym-accent text-sm"
              >
                {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Снаряд</label>
              <select
                value={form.equipment ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, equipment: e.target.value }))}
                className="w-full bg-white/70 border border-gym-border rounded-xl px-3 py-3 text-gray-800 focus:outline-none focus:border-gym-accent text-sm"
              >
                {EQUIPMENT_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Схема подходов/повторений</label>
            <input
              value={form.repScheme ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, repScheme: e.target.value }))}
              placeholder="4x5 или 3x10"
              className="w-full bg-white/70 border border-gym-border rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-gym-accent text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Дополнительные мышцы (синергисты)</label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-white/40 border border-gym-border rounded-xl">
              {MUSCLE_GROUPS.map((g) => {
                if (g === form.muscleGroup) return null;
                const isChecked = form.muscleGroups?.includes(g) ?? false;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      const current = form.muscleGroups || [];
                      const updated = current.includes(g)
                        ? current.filter((x) => x !== g)
                        : [...current, g];
                      setForm((p) => ({ ...p, muscleGroups: updated }));
                    }}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer"
                    style={isChecked
                      ? { background: MUSCLE_COLORS[g], color: '#fff', borderColor: MUSCLE_COLORS[g] }
                      : { background: 'transparent', color: '#6b7280', borderColor: 'rgba(0,0,0,0.1)' }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Техника выполнения</label>
            <textarea
              value={form.technique ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, technique: e.target.value }))}
              placeholder="Опишите технику выполнения…"
              rows={3}
              className="w-full bg-white/70 border border-gym-border rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-gym-accent text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!form.name}
            className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #466bf7, #2555df)' }}
          >
            <Check size={16} className="inline mr-2" />
            {editingId ? 'Сохранить' : 'Добавить упражнение'}
          </button>
          <button
            onClick={() => { setShowForm(false); setEditingId(null); }}
            className="px-5 py-3 rounded-xl font-semibold text-gray-600 bg-white/60 border border-gym-border"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Левая колонка - Анатомический атлас (всегда виден) */}
      <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-gym-border/30 bg-white/40 shadow-sm lg:sticky lg:top-5">
        <div className="flex items-center justify-between border-b border-gym-border pb-3 mb-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Muscle size={14} className="text-gym-accent" />
            Интерактивный атлас
          </h3>
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold border border-slate-200">
            <button
              onClick={() => setFilterGroup(null)}
              className={`px-2 py-0.5 rounded-md transition-all ${
                !filterGroup ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              Все
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <AnatomyModel
            selectedFilter={filterGroup}
            onSelectMuscle={setFilterGroup}
          />
          {filterGroup && (
            <div className="flex items-center justify-between p-2.5 bg-gym-accent/10 rounded-xl border border-gym-accent/20 text-xs">
              <span className="font-semibold text-gym-accent">Фильтр: {filterGroup}</span>
              <button
                onClick={() => setFilterGroup(null)}
                className="text-slate-400 hover:text-slate-700 font-bold underline"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Правая колонка - Поиск и список упражнений */}
      <div className="lg:col-span-8 space-y-4">
        {/* Search */}
        <div className="relative flex items-center w-full">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск упражнений…"
            className="w-full bg-white/70 border border-gym-border rounded-2xl pl-9 pr-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-gym-accent shadow-sm"
          />
          <Search size={14} className="text-gym-accent/70 absolute left-3 fill-gym-accent/5" />
        </div>

        {/* Muscle group chips */}
        <div className="overflow-x-auto -mx-4 px-4 pb-1">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setFilterGroup(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              style={!filterGroup
                ? { background: '#466bf7', color: '#fff' }
                : { background: 'rgba(255,255,255,0.6)', color: '#6b7280', border: '1px solid rgba(0,0,0,0.07)' }}
            >
              Все ({exercises.length})
            </button>
            {MUSCLE_GROUPS.map((g) => {
              const cnt = exercises.filter((e) => e.muscleGroup === g || (e.muscleGroups && e.muscleGroups.includes(g))).length;
              const color = MUSCLE_COLORS[g];
              const isActive = filterGroup === g;
              return (
                <button
                  key={g}
                  onClick={() => setFilterGroup(isActive ? null : g)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  style={isActive
                    ? { background: color, color: '#fff', boxShadow: `0 2px 8px ${color}40` }
                    : { background: hex2rgba(color, 0.1), color, border: `1px solid ${hex2rgba(color, 0.2)}` }}
                >
                  {g} ({cnt})
                </button>
              );
            })}
          </div>
        </div>

        {/* Exercises List */}
        <div className="space-y-3">
          {/* Add button */}
          <button
            onClick={openCreate}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gym-border text-sm font-semibold text-gray-500 hover:border-gym-accent hover:text-gym-accent transition-colors cursor-pointer"
          >
            <Plus size={16} /> Добавить своё упражнение
          </button>

          {/* Exercise list */}
          <div className="space-y-2">
            {filteredExercises.map((ex) => {
              const pr = personalRecords.find((p) => p.exerciseId === ex.id);
              const color = MUSCLE_COLORS[ex.muscleGroup] ?? '#007aff';
              const isExpanded = expandedId === ex.id;
              return (
                <div key={ex.id} className="glass-panel rounded-2xl overflow-hidden transition-all duration-300" style={isExpanded ? { boxShadow: '0 8px 24px rgba(0,0,0,0.04)', borderColor: `${color}40` } : {}}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/20 transition-colors text-left cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{ex.name}</p>
                      
                      {/* Tags for Muscle Groups and Equipment */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(ex.muscleGroups || [ex.muscleGroup]).map((g, idx) => (
                          <span
                            key={g}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                            style={idx === 0
                              ? { background: hex2rgba(MUSCLE_COLORS[g] ?? '#007aff', 0.12), color: MUSCLE_COLORS[g] ?? '#007aff' }
                              : { background: 'rgba(0,0,0,0.03)', color: '#6b7280' }
                            }
                          >
                            {g}
                          </span>
                        ))}
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-400 border border-gray-100">
                          {ex.equipment}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-400 border border-gray-100">
                          {ex.repScheme}
                        </span>
                      </div>
                    </div>
                    {pr && (
                      <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
                        <Trophy size={12} />
                        <span className="text-xs font-bold">{pr.weight1rm}кг</span>
                      </div>
                    )}
                    <ChevronRight
                      size={14}
                      className="text-gray-400 flex-shrink-0 transition-transform"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gym-border/20 pt-3 space-y-3">
                      {ex.technique && (
                        <p className="text-xs text-slate-500/90 leading-relaxed font-sans antialiased whitespace-pre-wrap">{ex.technique}</p>
                      )}
                      {pr && (
                        <div
                          className="flex flex-col gap-2 p-3 rounded-xl border border-gym-border bg-white/40"
                        >
                          <div className="flex items-center gap-2">
                            <Trophy size={14} style={{ color }} />
                            <span className="text-xs font-bold text-gray-700">Личный рекорд (1RM): {pr.weight1rm} кг</span>
                          </div>
                          {/* История достижений */}
                          <div className="border-t border-gym-border/30 pt-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">История достижений</span>
                            <div className="space-y-1 max-h-24 overflow-y-auto font-mono text-[10px]">
                              {(prHistory || [])
                                .filter((h) => h.exerciseId === ex.id)
                                .slice()
                                .reverse()
                                .map((h, i) => (
                                  <div key={i} className="flex justify-between text-gray-500">
                                    <span>{h.date.split('-').reverse().join('.')}</span>
                                    <span className="font-bold text-gray-700">{h.weight1rm} кг 1RM <span className="text-gray-400">({h.actualWeight}×{h.actualReps})</span></span>
                                  </div>
                                ))}
                              {!(prHistory || []).some((h) => h.exerciseId === ex.id) && (
                                <div className="flex justify-between text-gray-500">
                                  <span>{pr.date.split('-').reverse().join('.')}</span>
                                  <span className="font-bold text-gray-700">{pr.weight1rm} кг 1RM <span className="text-gray-400">({pr.actualWeight}×{pr.actualReps})</span></span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(ex)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Pencil size={12} /> Редактировать
                        </button>
                        {ex.isCustom && (
                          <button
                            onClick={async () => {
                              if (await confirm({
                                title: 'Удалить упражнение',
                                message: `Удалить «${ex.name}»?`,
                                confirmText: 'Удалить',
                                isDestructive: true
                              })) {
                                deleteExercise(ex.id);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} /> Удалить
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredExercises.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">Ничего не найдено</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY TAB
// ─────────────────────────────────────────────────────────────────────────────

const HistoryTab: React.FC = () => {
  const workoutSessions = useGymStore(s => s.workoutSessions);
  const workoutTemplates = useGymStore(s => s.workoutTemplates);
  const exercises = useGymStore(s => s.exercises);
  const deleteWorkoutSession = useGymStore(s => s.deleteWorkoutSession);
  const { confirm } = useDialog();
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Общий тоннаж
  const totalVolume = useMemo(() => {
    let volKg = 0;
    workoutSessions.forEach((s) => {
      Object.values(s.logs).forEach((log) => {
        if (log.sets) {
          log.sets.forEach((set) => {
            if (set.isCompleted && set.weight > 0 && set.reps > 0) {
              volKg += set.weight * set.reps;
            }
          });
        }
      });
    });
    return (volKg / 1000).toFixed(1);
  }, [workoutSessions]);

  // Всего тренировок
  const totalSessions = workoutSessions.length;

  // Среднее время
  const avgDuration = useMemo(() => {
    const sessionsWithDuration = workoutSessions.filter((s) => s.duration && s.duration > 0);
    if (sessionsWithDuration.length === 0) return 0;
    const sum = sessionsWithDuration.reduce((acc, s) => acc + (s.duration || 0), 0);
    return Math.round(sum / sessionsWithDuration.length);
  }, [workoutSessions]);

  return (
    <div className="space-y-6">
      {/* Дашборд аналитики */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div 
          className="glass-panel rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xs border border-gym-border/30" 
          style={{ background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.04), rgba(255,255,255,0.75))' }}
        >
          <Dumbbell className="text-blue-500 w-5 h-5 mb-1.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Объем</span>
          <span className="text-base sm:text-lg font-black text-gray-800 tracking-tight mt-0.5">{totalVolume} т</span>
        </div>

        <div 
          className="glass-panel rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xs border border-gym-border/30" 
          style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04), rgba(255,255,255,0.75))' }}
        >
          <Trophy className="text-emerald-500 w-5 h-5 mb-1.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Сессии</span>
          <span className="text-base sm:text-lg font-black text-gray-800 tracking-tight mt-0.5">{totalSessions}</span>
        </div>

        <div 
          className="glass-panel rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xs border border-gym-border/30" 
          style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04), rgba(255,255,255,0.75))' }}
        >
          <Clock className="text-purple-500 w-5 h-5 mb-1.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ср. время</span>
          <span className="text-base sm:text-lg font-black text-gray-800 tracking-tight mt-0.5">{avgDuration} м</span>
        </div>
      </div>

      {/* Журнал тренировок */}
      <div className="glass-panel rounded-3xl p-5 shadow-sm space-y-4">
        <h4 className="font-display font-bold text-gray-800 text-base border-b border-gym-border/40 pb-3 flex items-center gap-2">
          <History size={18} className="text-gym-accent" />
          Журнал тренировок
        </h4>

        <div className="space-y-3">
          {workoutSessions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 space-y-3">
              <Dumbbell size={30} className="text-gray-300 mx-auto" />
              <p className="text-sm">История пуста. Выполните свою первую тренировку!</p>
            </div>
          ) : (
            workoutSessions.slice().reverse().map((session) => {
              const tmpl = workoutTemplates.find((t) => t.id === session.templateId);
              const color = tmpl?.color ?? '#007aff';
              const isExpanded = expandedSessionId === session.id;
              const completedExercises = Object.values(session.logs).filter(
                (l) => l.sets?.some((s) => s.isCompleted) || l.isCompleted
              );

              const sessionVolume = Object.values(session.logs).reduce((acc, log) => {
                if (!log.sets) return acc;
                return acc + log.sets.reduce((sAcc, s) => {
                  if (s.isCompleted && s.weight > 0 && s.reps > 0) {
                    return sAcc + s.weight * s.reps;
                  }
                  return sAcc;
                }, 0);
              }, 0);

              return (
                <div 
                  key={session.id} 
                  className="rounded-2xl border border-gym-border/30 overflow-hidden bg-white/35 backdrop-blur-xs transition-all hover:border-gym-border/60"
                >
                  <div
                    onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/30 transition-colors text-left"
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-extrabold text-gray-700">
                          {session.templateName || session.workoutType || 'Тренировка'}
                        </p>
                        {sessionVolume > 0 && (
                          <span className="text-[10px] font-bold bg-blue-50/80 text-blue-600 border border-blue-100/50 px-2 py-0.5 rounded-md">
                            {sessionVolume} кг
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {session.date.split('-').reverse().join('.')} · {completedExercises.length} упр. {session.duration ? `· ${session.duration} мин` : ''}
                      </p>
                    </div>
                    
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (await confirm({
                          title: 'Удалить тренировку',
                          message: 'Вы действительно хотите удалить эту тренировку из истории?',
                          confirmText: 'Удалить',
                          isDestructive: true
                        })) {
                          deleteWorkoutSession(session.id);
                        }
                      }}
                      className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 transition-all mr-1 cursor-pointer active:scale-90"
                    >
                      <Trash2 size={14} />
                    </button>

                    <ChevronRight
                      size={16}
                      className="text-gray-400 transition-transform duration-250"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}
                    />
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gym-border/20 pt-4 space-y-4 bg-white/10">
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                        {Object.entries(session.logs).map(([exId, log]) => {
                          const ex = exercises.find((e) => e.id === exId);
                          const exColor = MUSCLE_COLORS[ex?.muscleGroup ?? ''] ?? '#007aff';
                          return (
                            <div key={exId} className="bg-white/40 border border-gym-border/30 rounded-xl p-3 space-y-1.5 shadow-2xs">
                              <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: exColor }} />
                                {ex?.name ?? exId}
                              </p>
                              <div className="space-y-1">
                                {log.sets?.filter((s) => s.isCompleted).map((s) => (
                                  <p key={s.setIndex} className="text-[11px] text-gray-400 ml-3 tabular-nums">
                                    Подход {s.setIndex + 1}: <span className="font-semibold text-gray-600">{s.weight} кг</span> × {s.reps} повт.
                                    {' '}
                                    <span className="text-[10px] text-gray-300">
                                      (~{calcEpley1RM(s.weight, s.reps)} кг 1RM)
                                    </span>
                                  </p>
                                ))}
                                {!log.sets && log.weight != null && (
                                  <p className="text-[11px] text-gray-400 ml-3">{log.weight} кг</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {session.notes && (
                        <div className="text-xs text-gray-500 italic bg-gray-50/50 border-l-2 border-gym-accent/40 pl-3 py-1.5 mt-2 rounded-r-lg">
                          Заметки: {session.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main WorkoutTab
// ─────────────────────────────────────────────────────────────────────────────

export const WorkoutTab: React.FC = React.memo(() => {
  const [activeTab, setActiveTab] = useState<'session' | 'history' | 'programs' | 'exercises'>('session');

  return (
    <div className="space-y-5">
      <TabBar active={activeTab} onChange={setActiveTab} />
      {activeTab === 'session'   && <SessionTab onTabChange={setActiveTab} />}
      {activeTab === 'history'   && <HistoryTab />}
      {activeTab === 'programs'  && <ProgramsTab />}
      {activeTab === 'exercises' && <ExercisesTab />}
    </div>
  );
});
