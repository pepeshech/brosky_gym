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
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 bg-slate-950/95 text-white border border-slate-800/80 backdrop-blur-xl shadow-2xl rounded-3xl p-5 z-[9999] flex flex-col gap-4 animate-fadeInUp animate-duration-300">
      <div className="flex gap-3">
        <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/10 flex items-center justify-center h-10 w-10 shrink-0">
          <Sparkles size={18} />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="font-extrabold text-sm tracking-tight text-white font-sans" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Доступно обновление!
          </h4>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed font-sans">
            Добавлены новые фичи и улучшения интерфейса. Обновите приложение, чтобы применить их.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2.5 border-t border-slate-900 pt-3">
        <button
          onClick={() => setNeedRefresh(false)}
          className="text-slate-400 hover:text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          Позже
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-gym-accent hover:bg-blue-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-gym-accent/20 flex items-center gap-1.5 cursor-pointer"
        >
          Обновить
        </button>
      </div>
    </div>
  );
};
