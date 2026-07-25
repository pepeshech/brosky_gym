import React from 'react';
import { tabs, type TabId } from './Header';

interface BottomNavProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="bottom-nav-bar md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gym-border/60 pb-[env(safe-area-inset-bottom,8px)] pt-0 flex justify-around items-stretch shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`bottom-nav-btn ${isActive ? 'nav-active' : ''}`}
          >
            <span className="nav-icon">
              <Icon
                style={{ width: '100%', height: '100%' }}
                className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}
              />
            </span>
            <span className="nav-label">{tab.name}</span>
          </button>
        );
      })}
    </nav>
  );
};
