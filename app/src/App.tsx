import { useState, useEffect, lazy, Suspense } from 'react';
import { ReloadPrompt } from './components/pwa/ReloadPrompt';
import { useGymStore } from './store/gymStore';
import { getWebrtcProvider, indexeddbProvider } from './store/yjsProvider';
import { Onboarding } from './components/Onboarding';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { SkeletonLoader } from './components/layout/SkeletonLoader';
import type { TabId } from './components/layout/Header';

const ProfileTab = lazy(() => import('./components/ProfileTab').then(m => ({ default: m.ProfileTab })));
const NutritionTab = lazy(() => import('./components/NutritionTab').then(m => ({ default: m.NutritionTab })));
const ProgressTab = lazy(() => import('./components/ProgressTab').then(m => ({ default: m.ProgressTab })));
const WorkoutTab = lazy(() => import('./components/WorkoutTab').then(m => ({ default: m.WorkoutTab })));
const SettingsTab = lazy(() => import('./components/SettingsTab').then(m => ({ default: m.SettingsTab })));
const AchievementsTab = lazy(() => import('./components/AchievementsTab').then(m => ({ default: m.AchievementsTab })));

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const profile = useGymStore(s => s.profile);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [peersCount, setPeersCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const provider = getWebrtcProvider();
      if (provider) {
        try {
          const peers = provider.awareness.getStates().size;
          setPeersCount(Math.max(0, peers - 1));
        } catch {
          setPeersCount(0);
        }
      } else {
        setPeersCount(0);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    if (indexeddbProvider.synced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsHydrated(true);
    } else {
      const handleSynced = () => setIsHydrated(true);
      indexeddbProvider.on('synced', handleSynced);
      const fallback = setTimeout(() => setIsHydrated(true), 500);
      return () => {
        indexeddbProvider.off('synced', handleSynced);
        clearTimeout(fallback);
      };
    }
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col">
        <Header isOnline={isOnline} peersCount={peersCount} activeTab={activeTab} setActiveTab={setActiveTab} />
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
      <Header isOnline={isOnline} peersCount={peersCount} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6 md:gap-8 pb-[calc(env(safe-area-inset-bottom,16px)+68px)] md:pb-8">
        <div key={activeTab} className="flex-1 animate-fadeIn">
          <Suspense fallback={<SkeletonLoader />}>
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'nutrition' && <NutritionTab />}
            {activeTab === 'progress' && <ProgressTab />}
            {activeTab === 'workout' && <WorkoutTab />}
            {activeTab === 'achievements' && <AchievementsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </Suspense>
        </div>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <footer className="hidden md:block border-t border-gym-border/40 py-6 text-center text-xs text-gray-400 bg-white/10 backdrop-blur-sm">
        <p>© 2026 Gym Tracker Pro. Все расчеты сверены и скорректированы по методикам ACSM, WHO и Helms 2014.</p>
      </footer>

      <ReloadPrompt />
    </div>
  );
}

export default App;
