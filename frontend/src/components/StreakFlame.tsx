import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import './StreakFlame.css';

interface StreakFlameProps {
  streak: number;
  size?: 'small' | 'medium' | 'large';
}

export const StreakFlame: React.FC<StreakFlameProps> = ({ streak, size = 'medium' }) => {
  const sizeConfig = {
    small: { icon: 24, container: 40, font: 12 },
    medium: { icon: 40, container: 70, font: 16 },
    large: { icon: 64, container: 100, font: 20 },
  };
  
  const config = sizeConfig[size];
  
  const getFlameColor = () => {
    if (streak === 0) return '#71717A';
    if (streak < 3) return '#FF6B35';
    if (streak < 7) return '#F7931A';
    if (streak < 14) return '#FFD700';
    return '#FFF8DC';
  };
  
  return (
    <div className="streak-flame" style={{ width: config.container, height: config.container }}>
      <motion.div
        className="flame-container"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <Flame size={config.icon} color={getFlameColor()} fill={streak > 0 ? getFlameColor() : 'transparent'} />
        {streak >= 7 && (
          <div className="glow-effect" style={{ backgroundColor: getFlameColor() }} />
        )}
      </motion.div>
      <span className="streak-number" style={{ fontSize: config.font }}>{streak}</span>
    </div>
  );
};
