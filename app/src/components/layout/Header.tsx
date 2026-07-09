/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { User, Activity, TrendingUp, Dumbbell, Trophy, Settings as SettingsIcon } from '../BroskyIcon';

export const tabs = [
  { id: 'profile', name: 'Профиль', icon: User },
  { id: 'nutrition', name: 'Сегодня', icon: Activity },
  { id: 'progress', name: 'Прогресс', icon: TrendingUp },
  { id: 'workout', name: 'Тренировки', icon: Dumbbell },
  { id: 'achievements', name: 'Достижения', icon: Trophy },
  { id: 'settings', name: 'Настройки', icon: SettingsIcon },
] as const;

export type TabId = typeof tabs[number]['id'];

interface HeaderProps {
  isOnline: boolean;
  peersCount: number;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const Header: React.FC<HeaderProps> = ({ isOnline, peersCount, activeTab, setActiveTab }) => {
  return (
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

        {/* Баланс колонок для сетки и статус подключения */}
        <div className="hidden md:flex justify-end items-center">
          {isOnline ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold shadow-xs select-none transition-all">
              <span className={`w-1.5 h-1.5 rounded-full ${peersCount > 0 ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
              В сети {peersCount > 0 ? `(Пиров: ${peersCount})` : '(P2P: Ожидание)'}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-600 rounded-full text-[10px] font-bold shadow-xs select-none animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Оффлайн-режим (Данные в безопасности)
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
