import React from 'react';
import { Shield, MessageCircle, Bed, CheckCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { StreakFlame } from '../components/StreakFlame';
import { ProgressRing } from '../components/ProgressRing';
import {
  getTimeGreeting,
  getTodayString,
  getDayName,
  isWeekday,
  getProgressMessage,
  getStreakMessage,
  getXPProgressInLevel,
  getXPForNextLevel,
  getDailyMotivationalImage,
} from '../utils/helpers';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const { profile, routineTasks, dailyProgress, quote, oneOffTasks } = useAppStore();
  
  const today = getTodayString();
  const dayName = getDayName(today);
  const isWeekdayToday = isWeekday(today);
  
  const completedTasks = dailyProgress?.completed_routine_task_ids?.length || 0;
  const totalTasks = routineTasks?.length || 0;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;
  
  const pendingTasksCount = oneOffTasks?.filter(t => !t.is_completed)?.length || 0;
  const urgentTasksCount = oneOffTasks?.filter(t => {
    if (!t.due_date) return false;
    const diff = Math.ceil((new Date(t.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff <= 1;
  })?.length || 0;
  
  const xpProgress = profile ? getXPProgressInLevel(profile.total_xp, profile.level) : 0;
  const xpForNext = profile ? getXPForNextLevel(profile.level) : 100;
  const motivationalImage = getDailyMotivationalImage();
  
  return (
    <div className="home-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Good {getTimeGreeting()}</h1>
          <p className="date-text">{dayName}, {today}</p>
        </div>
        <StreakFlame streak={profile?.current_streak || 0} size="medium" />
      </div>
      
      {/* Quote Card */}
      {quote && (
        <div className="quote-card gradient-primary">
          <MessageCircle size={24} color="var(--accent)" />
          <p className="quote-text">"{quote.text}"</p>
          <span className="quote-author">— {quote.author}</span>
        </div>
      )}
      
      {/* Motivational Image */}
      <div className="motivational-banner">
        <img src={motivationalImage.url} alt={motivationalImage.title} />
        <div className="image-overlay">
          <h3>{motivationalImage.title}</h3>
          <p>{motivationalImage.description}</p>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card gradient-card">
          <div className="stat-icon">
            <Shield size={24} color="var(--primary)" />
          </div>
          <span className="stat-value">Level {profile?.level || 1}</span>
          <span className="stat-label">{profile?.level_title || 'Rookie'}</span>
          <div className="xp-bar-container">
            <div className="xp-bar" style={{ width: `${xpProgress * 100}%` }} />
          </div>
          <span className="xp-text">{profile?.total_xp || 0} / {xpForNext} XP</span>
        </div>
        
        <div className="stat-card gradient-card">
          <StreakFlame streak={profile?.current_streak || 0} size="small" />
          <span className="stat-value">{profile?.current_streak || 0} Days</span>
          <span className="stat-label">Current Streak</span>
          <span className="streak-message">{getStreakMessage(profile?.current_streak || 0)}</span>
        </div>
      </div>
      
      {/* Today's Progress */}
      <div className="progress-card gradient-card">
        <div className="progress-header">
          <h2>Today's Routine</h2>
          {!isWeekdayToday && <span className="weekend-badge">Weekend</span>}
        </div>
        
        {isWeekdayToday ? (
          <div className="progress-content">
            <ProgressRing progress={progress} completed={completedTasks} total={totalTasks} />
            <div className="progress-info">
              <p className="progress-message">{getProgressMessage(completedTasks, totalTasks)}</p>
              {progress === 1 && (
                <div className="completed-badge">
                  <CheckCircle size={20} color="var(--success)" />
                  <span>Day Complete!</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="weekend-content">
            <Bed size={48} color="var(--text-muted)" />
            <h3>Rest Day</h3>
            <p>Add your weekend routine</p>
          </div>
        )}
      </div>
      
      {/* Pending Tasks Summary */}
      <div className="tasks-card gradient-card">
        <h2>Pending Tasks</h2>
        <div className="tasks-stats">
          <div className="task-stat">
            <span className="task-stat-value">{pendingTasksCount}</span>
            <span className="task-stat-label">Total Pending</span>
          </div>
          {urgentTasksCount > 0 && (
            <div className="task-stat urgent">
              <span className="task-stat-value">{urgentTasksCount}</span>
              <span className="task-stat-label">Due Soon</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
