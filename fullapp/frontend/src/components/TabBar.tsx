import React from 'react';
import { Home, Calendar, ListTodo, Trophy, Settings } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import './TabBar.css';

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'routine', label: 'Routine', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'rewards', label: 'Rewards', icon: Trophy },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();
  
  return (
    <nav className="tab-bar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            className={`tab-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <div className={`tab-icon ${isActive ? 'active' : ''}`}>
              <Icon size={24} />
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
