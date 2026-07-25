import { useState, useEffect, lazy, Suspense, useTransition } from 'react';
import { ReloadPrompt } from './components/pwa/ReloadPrompt';
import { useGymStore } from './store/gymStore';
import { Onboarding } from './components/Onboarding';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { SkeletonLoader } from './components/layout/SkeletonLoader';
import type { TabId } from './components/layout/Header';

const HomeTab = lazy(() => import('./components/HomeTab').then(m => ({ default: m.HomeTab })));
const NutritionTab = lazy(() => import('./components/NutritionTab').then(m => ({ default: m.NutritionTab })));
const ProgressTab = lazy(() => import('./components/ProgressTab').then(m => ({ default: m.ProgressTab })));
const WorkoutTab = lazy(() => import('./components/WorkoutTab').then(m => ({ default: m.WorkoutTab })));
const SettingsTab = lazy(() => import('./components/SettingsTab').then(m => ({ default: m.SettingsTab })));
const AchievementsTab = lazy(() => import('./components/AchievementsTab').then(m => ({ default: m.AchievementsTab })));

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [renderedTab, setRenderedTab] = useState<TabId>('profile');
  const [, startTransition] = useTransition();

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    startTransition(() => {
      setRenderedTab(tab);
    });
  };

  const profile = useGymStore(s => s.profile);
  const isHydrated = true;
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col">
        <Header isOnline={isOnline} activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6 md:gap-8 pb-[calc(env(safe-area-inset-bottom,16px)+68px)] md:pb-8">
          <SkeletonLoader />
        </main>
      </div>
    );
  }

  if (!profile.isOnboarded) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col justify-center items-center py-12">
        <Onboarding />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Header isOnline={isOnline} activeTab={activeTab} setActiveTab={handleTabChange} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6 md:gap-8 pb-[calc(env(safe-area-inset-bottom,16px)+68px)] md:pb-8">
        <div key={renderedTab} className="flex-1 animate-fadeIn">
          <Suspense fallback={<SkeletonLoader />}>
            {renderedTab === 'profile' && <HomeTab />}
            {renderedTab === 'nutrition' && <NutritionTab />}
            {renderedTab === 'progress' && <ProgressTab />}
            {renderedTab === 'workout' && <WorkoutTab />}
            {renderedTab === 'achievements' && <AchievementsTab />}
            {renderedTab === 'settings' && <SettingsTab />}
          </Suspense>
        </div>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />

      <footer className="hidden md:block border-t border-gym-border/40 py-6 text-center text-xs text-gray-400 bg-white/10 backdrop-blur-sm">
        <p>© 2026 Brosky Gym. Все расчеты сверены и скорректированы по методикам ACSM, WHO и Helms 2014.</p>
      </footer>

      <ReloadPrompt />
    </div>
  );
}

export default App;
