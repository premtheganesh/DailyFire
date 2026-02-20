import React, { useState, useEffect } from 'react';
import { Bell, Send, Info, Flame } from 'lucide-react';
import './SettingsPage.css';

const DEFAULT_REMINDERS = [
  { id: 'morning_routine', title: 'Morning Routine', time: '7:30 AM' },
  { id: 'job_applications_1', title: 'Job Applications', time: '9:00 AM' },
  { id: 'study_time', title: 'Study Time', time: '11:00 AM' },
  { id: 'job_applications_2', title: 'Job Applications', time: '2:00 PM' },
  { id: 'gym_time', title: 'Gym Time', time: '6:00 PM' },
  { id: 'tablets', title: '💊 TAKE TABLETS', time: '9:00 PM', critical: true },
  { id: 'sleep_time', title: 'Sleep Time', time: '11:15 PM' },
];

export const SettingsPage: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    // Check if notifications were enabled
    const enabled = localStorage.getItem('notifications_enabled') === 'true';
    setNotificationsEnabled(enabled);
  }, []);
  
  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }
    
    if (!notificationsEnabled) {
      // Request permission
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('notifications_enabled', 'true');
        alert('Reminders enabled! You will receive daily notifications.');
      } else {
        alert('Please enable notifications in your browser settings.');
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('notifications_enabled', 'false');
    }
  };
  
  const handleTestNotification = () => {
    if (notificationPermission !== 'granted') {
      alert('Please enable notifications first');
      return;
    }
    
    new Notification('🔥 DailyFire Test', {
      body: 'Notifications are working! Stay focused and crush your goals!',
      icon: '/favicon.ico',
    });
  };
  
  return (
    <div className="settings-page">
      {/* Header */}
      <div className="page-header">
        <h1>Settings</h1>
        <p className="subtitle">Customize your experience</p>
      </div>
      
      {/* Notifications Section */}
      <div className="section-card gradient-card">
        <div className="section-header">
          <Bell size={24} color="var(--primary)" />
          <h2>Notifications</h2>
        </div>
        
        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-label">Daily Reminders</span>
            <span className="setting-description">Get notified for your routine tasks</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={handleToggleNotifications}
            />
            <span className="toggle-slider" />
          </label>
        </div>
        
        {notificationsEnabled && (
          <div className="scheduled-info">
            <span>✅ {DEFAULT_REMINDERS.length} reminders ready</span>
          </div>
        )}
        
        <button className="test-button" onClick={handleTestNotification}>
          <Send size={18} />
          Send Test Notification
        </button>
      </div>
      
      {/* Reminder Schedule */}
      {notificationsEnabled && (
        <div className="section-card gradient-card">
          <div className="section-header">
            <Bell size={24} color="var(--secondary)" />
            <h2>Reminder Schedule</h2>
          </div>
          
          {DEFAULT_REMINDERS.map((reminder) => (
            <div key={reminder.id} className="reminder-item">
              <span className="reminder-time">{reminder.time}</span>
              <span className={`reminder-title ${reminder.critical ? 'critical' : ''}`}>
                {reminder.title}
              </span>
              <Bell size={16} color={reminder.critical ? 'var(--error)' : 'var(--success)'} />
            </div>
          ))}
        </div>
      )}
      
      {/* About Section */}
      <div className="section-card gradient-card">
        <div className="section-header">
          <Info size={24} color="var(--accent)" />
          <h2>About</h2>
        </div>
        
        <div className="about-item">
          <span className="about-label">App Name</span>
          <span className="about-value">DailyFire</span>
        </div>
        <div className="about-item">
          <span className="about-label">Version</span>
          <span className="about-value">1.0.0</span>
        </div>
        <div className="about-item">
          <span className="about-label">Platform</span>
          <span className="about-value">Web</span>
        </div>
      </div>
      
      {/* Footer Message */}
      <div className="footer-message">
        <Flame size={24} color="var(--flame2)" />
        <span>Stay consistent. Your future self will thank you.</span>
      </div>
    </div>
  );
};
