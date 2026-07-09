import React from 'react';

// Скелетон-загрузчик в фирменном Bento-стиле
export const SkeletonLoader: React.FC = () => {
  return (
    <div className="w-full space-y-6 animate-pulse mt-1 select-none">
      {/* 1. Заголовок таба */}
      <div className="h-10 bg-white/40 border border-gym-border/30 rounded-2xl w-1/4 min-w-[180px]"></div>

      {/* 2. Основная Bento-сетка скелетона */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Левая колонка */}
        <div className="lg:col-span-7 space-y-6">
          <div className="h-[260px] bg-white/35 rounded-3xl border border-gym-border/30 p-6 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="h-6 bg-white/50 rounded-xl w-1/3"></div>
              <div className="h-4 bg-white/40 rounded-lg w-2/3"></div>
            </div>
            <div className="h-11 bg-white/50 rounded-xl w-full"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-32 bg-white/35 rounded-3xl border border-gym-border/30"></div>
            <div className="h-32 bg-white/35 rounded-3xl border border-gym-border/30"></div>
          </div>

          <div className="h-[140px] bg-white/35 rounded-3xl border border-gym-border/30"></div>
        </div>

        {/* Правая колонка */}
        <div className="lg:col-span-5 space-y-6">
          <div className="h-[310px] bg-white/35 rounded-3xl border border-gym-border/30 p-6 space-y-5">
            <div className="h-5 bg-white/50 rounded-lg w-2/5 border-b border-gym-border/20 pb-2.5"></div>
            <div className="space-y-3">
              <div className="h-11 bg-white/45 rounded-xl w-full"></div>
              <div className="h-11 bg-white/45 rounded-xl w-full"></div>
              <div className="h-11 bg-white/45 rounded-xl w-full"></div>
            </div>
          </div>
          
          <div className="h-[160px] bg-white/35 rounded-3xl border border-gym-border/30"></div>
        </div>
      </div>
    </div>
  );
};
