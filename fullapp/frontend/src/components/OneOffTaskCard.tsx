import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Trash2, Calendar } from 'lucide-react';
import { formatDueDate } from '../utils/helpers';
import './OneOffTaskCard.css';

interface OneOffTaskCardProps {
  id: string;
  title: string;
  notes?: string | null;
  dueDate?: string | null;
  priority: 'high' | 'medium' | 'low';
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const OneOffTaskCard: React.FC<OneOffTaskCardProps> = ({
  id,
  title,
  notes,
  dueDate,
  priority,
  onComplete,
  onDelete,
}) => {
  const priorityConfig = {
    high: { color: 'var(--priority-high)', label: 'High' },
    medium: { color: 'var(--priority-medium)', label: 'Medium' },
    low: { color: 'var(--priority-low)', label: 'Low' },
  };
  
  const { color: priorityColor, label: priorityLabel } = priorityConfig[priority];
  const dueDateInfo = dueDate ? formatDueDate(dueDate) : null;
  
  return (
    <motion.div
      className="oneoff-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="priority-strip" style={{ backgroundColor: priorityColor }} />
      
      <div className="card-content">
        <div className="main-content">
          <div className="card-header">
            <span className="priority-badge" style={{ backgroundColor: `${priorityColor}20`, color: priorityColor }}>
              {priorityLabel}
            </span>
            
            {dueDateInfo && (
              <span className={`due-badge ${dueDateInfo.isUrgent ? 'urgent' : ''}`}>
                <Calendar size={12} />
                {dueDateInfo.label}
              </span>
            )}
          </div>
          
          <h3 className="card-title">{title}</h3>
          
          {notes && <p className="card-notes">{notes}</p>}
        </div>
        
        <div className="card-actions">
          <button className="action-btn complete" onClick={() => onComplete(id)}>
            <CheckCircle size={28} />
          </button>
          <button className="action-btn delete" onClick={() => onDelete(id)}>
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
