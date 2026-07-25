/* eslint-disable react-refresh/only-export-components */
import React, { useState } from 'react';
import { User, Coffee, TrendingUp, Dumbbell, Trophy, Settings as SettingsIcon, LogOut, AlertTriangle } from '../BroskyIcon';

export const tabs = [
  { id: 'profile', name: 'Главная', icon: User },
  { id: 'nutrition', name: 'Питание', icon: Coffee },
  { id: 'progress', name: 'Прогресс', icon: TrendingUp },
  { id: 'workout', name: 'Тренировки', icon: Dumbbell },
  { id: 'achievements', name: 'Достижения', icon: Trophy },
  { id: 'settings', name: 'Настройки', icon: SettingsIcon },
] as const;

export type TabId = typeof tabs[number]['id'];

interface HeaderProps {
  isOnline: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const Header: React.FC<HeaderProps> = ({ isOnline, activeTab, setActiveTab }) => {
  const [showExitModal, setShowExitModal] = useState(false);

  const handleConfirmExit = () => {
    try {
      window.close();
    } catch {
      // Игнорируем ошибку полиси браузера
    }
    setTimeout(() => {
      window.location.href = 'about:blank';
    }, 150);
  };

  return (
    <>
      <header className="bg-white border-b border-gym-border sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between md:grid md:grid-cols-3 md:items-center">
          
          {/* Стилизованный логотип Brosky Gym */}
          <div className="flex items-center gap-2.5 select-none md:justify-start">
            <div className="p-2 bg-gradient-to-br from-gym-accent to-blue-600 rounded-xl text-white shadow-md shadow-blue-500/10 flex items-center justify-center transform hover:rotate-6 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 12h12M6 8h12M6 16h12M18 6v12M6 6v12" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight font-sans text-gray-800 leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
                BROSKY<span className="text-gym-accent">GYM</span>
              </span>
              {!isOnline && (
                <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100 rounded px-1 py-0.5 mt-0.5 leading-none w-max animate-pulse">
                  Оффлайн
                </span>
              )}
            </div>
          </div>

          {/* Десктопные навигационные табы по центру */}
          <div className="hidden md:flex justify-center">
            <div className="flex items-center gap-1.5 bg-white/40 border border-gym-border/40 p-1.5 rounded-2xl shadow-xs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabId)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer btn-interactive ${
                      isActive
                        ? 'bg-gym-accent text-white shadow-md shadow-gym-accent/25'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Кнопка Обновить (Сброс кэша) и Выйти в правой части шапки */}
          <div className="flex justify-end items-center gap-2">
            <button
              onClick={async () => {
                try {
                  if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    for (const r of regs) await r.unregister();
                  }
                  if ('caches' in window) {
                    const keys = await caches.keys();
                    for (const k of keys) await caches.delete(k);
                  }
                } catch {
                  // Игнорируем ошибки кэша
                }
                window.location.reload();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-gym-accent rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer btn-interactive"
              title="Сбросить кэш и загрузить свежий интерфейс"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Обновить</span>
            </button>
            <button
              onClick={() => setShowExitModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-600 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer btn-interactive"
              title="Закрыть проект"
            >
              <LogOut size={14} />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* Модальное окно подтверждения выхода */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gym-border space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">Закрыть проект Brosky Gym?</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Вы действительно хотите выйти и закрыть текущую вкладку приложения?
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 font-medium">
              Ваши данные в безопасности и сохранены в локальном IndexedDB-хранилище на вашем устройстве.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 border border-gym-border transition-all cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmExit}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all cursor-pointer"
              >
                Закрыть и выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
