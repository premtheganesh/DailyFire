import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import './TaskCard.css';

interface TaskCardProps {
  id: string;
  timeLabel: string;
  title: string;
  icon: string;
  isCritical?: boolean;
  isCompleted: boolean;
  onToggle: (id: string) => void;
}

const iconMap: Record<string, any> = {
  'sunny-outline': Icons.Sun,
  'document-text-outline': Icons.FileText,
  'water-outline': Icons.Droplets,
  'infinite-outline': Icons.Infinity,
  'nutrition-outline': Icons.Apple,
  'book-outline': Icons.BookOpen,
  'cafe-outline': Icons.Coffee,
  'fitness-outline': Icons.Dumbbell,
  'medkit-outline': Icons.Pill,
  'moon-outline': Icons.Moon,
  'checkbox-outline': Icons.CheckSquare,
};

export const TaskCard: React.FC<TaskCardProps> = ({
  id,
  timeLabel,
  title,
  icon,
  isCritical = false,
  isCompleted,
  onToggle,
}) => {
  const IconComponent = iconMap[icon] || Icons.CheckSquare;
  
  return (
    <motion.div
      className={`task-card ${isCritical ? 'critical' : ''} ${isCompleted ? 'completed' : ''}`}
      whileTap={{ scale: 0.98 }}
      onClick={() => onToggle(id)}
    >
      <div className="task-content">
        <div className={`checkbox ${isCompleted ? 'checked' : ''} ${isCritical && !isCompleted ? 'critical-border' : ''}`}>
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              <Check size={16} color="white" />
            </motion.div>
          )}
        </div>
        
        <div className="task-info">
          <span className={`time-label ${isCritical ? 'critical-text' : ''}`}>{timeLabel}</span>
          <span className={`task-title ${isCritical ? 'critical-text' : ''} ${isCompleted ? 'completed-text' : ''}`}>
            {title}
          </span>
        </div>
        
        <div className={`icon-container ${isCritical ? 'critical-icon' : ''}`}>
          <IconComponent size={24} color={isCritical ? 'var(--critical)' : 'var(--primary)'} />
        </div>
      </div>
      
      {isCritical && (
        <div className="critical-badge">CRITICAL</div>
      )}
    </motion.div>
  );
};
