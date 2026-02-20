import React from 'react';
import { Shield, Medal, Trophy, Star, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { StreakFlame } from '../components/StreakFlame';
import { getXPProgressInLevel, getXPForNextLevel } from '../utils/helpers';
import './RewardsPage.css';

const ALL_BADGES = [
  { id: 'week_streak', name: 'Consistency Rookie', description: 'Complete a 7-day streak', icon: Medal, color: '#CD7F32' },
  { id: 'two_week_streak', name: 'Building Momentum', description: 'Complete a 14-day streak', icon: Medal, color: '#C0C0C0' },
  { id: 'month_streak', name: 'Unstoppable', description: 'Complete a 30-day streak', icon: Trophy, color: '#FFD700' },
  { id: 'xp_500', name: 'XP Hunter', description: 'Earn 500 XP', icon: Star, color: '#9370DB' },
  { id: 'xp_1000', name: 'XP Master', description: 'Earn 1000 XP', icon: Star, color: '#4169E1' },
  { id: 'xp_5000', name: 'XP Legend', description: 'Earn 5000 XP', icon: Star, color: '#FFD700' },
  { id: 'perfect_week', name: 'Perfect Week', description: 'Complete all 5 weekdays', icon: CheckCircle2, color: '#32CD32' },
];

export const RewardsPage: React.FC = () => {
  const { profile } = useAppStore();
  
  const earnedBadges = profile?.badges || [];
  const xpProgress = profile ? getXPProgressInLevel(profile.total_xp, profile.level) : 0;
  const xpForNext = profile ? getXPForNextLevel(profile.level) : 100;
  
  return (
    <div className="rewards-page">
      {/* Header */}
      <div className="page-header">
        <h1>Rewards</h1>
        <p className="subtitle">Track your achievements</p>
      </div>
      
      {/* Level Card */}
      <motion.div
        className="level-card gradient-primary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="level-badge">
          <Shield size={48} color="var(--accent)" />
          <span className="level-number">{profile?.level || 1}</span>
        </div>
        <h2 className="level-title">{profile?.level_title || 'Rookie'}</h2>
        <div className="xp-section">
          <div className="xp-bar-container">
            <div className="xp-bar" style={{ width: `${xpProgress * 100}%` }} />
          </div>
          <span className="xp-text">{profile?.total_xp || 0} / {xpForNext} XP</span>
        </div>
        <span className="next-level-text">
          {Math.round((1 - xpProgress) * (xpForNext - (profile?.total_xp || 0)))} XP to Level {(profile?.level || 1) + 1}
        </span>
      </motion.div>
      
      {/* Streak Card */}
      <motion.div
        className="streak-card gradient-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="streak-header">
          <StreakFlame streak={profile?.current_streak || 0} size="large" />
          <div className="streak-info">
            <span className="streak-label">Current Streak</span>
            <span className="streak-value">{profile?.current_streak || 0} Days</span>
          </div>
        </div>
        <div className="streak-divider" />
        <div className="streak-stats">
          <div className="streak-stat">
            <span className="streak-stat-label">Longest Streak</span>
            <span className="streak-stat-value">{profile?.longest_streak || 0} days</span>
          </div>
          <div className="streak-stat">
            <span className="streak-stat-label">Total XP</span>
            <span className="streak-stat-value">{profile?.total_xp || 0} XP</span>
          </div>
        </div>
      </motion.div>
      
      {/* Badges Section */}
      <h2 className="section-title">Badge Collection</h2>
      
      <div className="badges-grid">
        {ALL_BADGES.map((badge, index) => {
          const isEarned = earnedBadges.includes(badge.id);
          const Icon = badge.icon;
          
          return (
            <motion.div
              key={badge.id}
              className={`badge-card gradient-card ${!isEarned ? 'locked' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <div
                className="badge-icon"
                style={{ backgroundColor: isEarned ? `${badge.color}30` : 'var(--border)' }}
              >
                <Icon size={32} color={isEarned ? badge.color : 'var(--text-muted)'} />
                {!isEarned && (
                  <div className="lock-overlay">
                    <Lock size={14} color="var(--text-muted)" />
                  </div>
                )}
              </div>
              <span className={`badge-name ${!isEarned ? 'muted' : ''}`}>{badge.name}</span>
              <span className={`badge-description ${!isEarned ? 'muted' : ''}`}>{badge.description}</span>
              {isEarned && (
                <div className="earned-tag">
                  <CheckCircle2 size={12} color="var(--success)" />
                  <span>Earned</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Motivational Message */}
      <div className="motivation-card gradient-card">
        <Sparkles size={24} color="var(--accent)" />
        <p>
          {earnedBadges.length === 0
            ? "Start your journey! Complete tasks to earn your first badge."
            : earnedBadges.length < ALL_BADGES.length
            ? `Amazing progress! ${ALL_BADGES.length - earnedBadges.length} badges left to unlock.`
            : "Incredible! You've earned all available badges! You're a legend!"}
        </p>
      </div>
    </div>
  );
};
