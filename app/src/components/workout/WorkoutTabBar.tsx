import React from 'react';
import { Dumbbell, History, ClipboardList, Library } from '../BroskyIcon';

export type WorkoutSubTab = 'session' | 'history' | 'programs' | 'exercises';

interface WorkoutTabBarProps {
  active: WorkoutSubTab;
  onChange: (t: WorkoutSubTab) => void;
}

export const WorkoutTabBar: React.FC<WorkoutTabBarProps> = ({ active, onChange }) => {
  const tabs: { key: WorkoutSubTab; label: string; icon: React.ReactNode }[] = [
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
