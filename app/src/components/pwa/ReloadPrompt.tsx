import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles } from '../BroskyIcon';

export const ReloadPrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (import.meta.env.DEV) console.log('SW registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 bg-white/95 text-gray-800 border border-gym-border/80 backdrop-blur-xl shadow-2xl rounded-3xl p-5 z-[9999] flex flex-col gap-4 animate-fadeInUp animate-duration-300">
      <div className="flex gap-3">
        <div className="p-2.5 bg-gradient-to-br from-gym-accent to-blue-600 rounded-2xl text-white shadow-md shadow-blue-500/10 flex items-center justify-center h-10 w-10 shrink-0">
          <Sparkles size={18} />
        </div>
        <div className="flex flex-col gap-0.5">
          <h4 className="font-extrabold text-sm tracking-tight text-gray-800 font-display">
            Доступно обновление!
          </h4>
          <p className="text-[11px] text-gray-500 font-medium leading-relaxed font-sans">
            Добавлены новые фичи и улучшения интерфейса. Обновите приложение, чтобы применить их.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2.5 border-t border-gym-border/30 pt-3">
        <button
          onClick={() => setNeedRefresh(false)}
          className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
        >
          Позже
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-gym-accent hover:bg-gym-accent/90 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-gym-accent/15 flex items-center gap-1.5 cursor-pointer btn-interactive"
        >
          Обновить
        </button>
      </div>
    </div>
  );
};
