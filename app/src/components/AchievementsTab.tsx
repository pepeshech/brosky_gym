import React from 'react';
import { AchievementsPanel } from './AchievementsPanel';
import { Trophy } from './BroskyIcon';

export const AchievementsTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500 shadow-xs">
          <Trophy size={22} />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-800 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Достижения
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Ваш прогресс, рекорды и уровень атлета</p>
        </div>
      </div>

      <AchievementsPanel />
    </div>
  );
};
