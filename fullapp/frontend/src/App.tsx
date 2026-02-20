import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { TabBar } from './components/TabBar';
import { CelebrationModal } from './components/CelebrationModal';
import { HomePage } from './pages/HomePage';
import { RoutinePage } from './pages/RoutinePage';
import { TasksPage } from './pages/TasksPage';
import { RewardsPage } from './pages/RewardsPage';
import { SettingsPage } from './pages/SettingsPage';
import './styles/theme.css';
import './App.css';

function App() {
  const { activeTab, isLoading, showCelebration, setCelebration, initializeApp } = useAppStore();
  
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);
  
  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'routine':
        return <RoutinePage />;
      case 'tasks':
        return <TasksPage />;
      case 'rewards':
        return <RewardsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading your journey...</p>
      </div>
    );
  }
  
  return (
    <div className="app">
      <main className="main-content">
        {renderPage()}
      </main>
      <TabBar />
      <CelebrationModal isOpen={showCelebration} onClose={() => setCelebration(false)} />
    </div>
  );
}

export default App;
