import React from 'react';
import { Bed, Lightbulb } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { TaskCard } from '../components/TaskCard';
import { ProgressRing } from '../components/ProgressRing';
import { getTodayString, getDayName, isWeekday, getProgressMessage } from '../utils/helpers';
import './RoutinePage.css';

export const RoutinePage: React.FC = () => {
  const { routineTasks, dailyProgress, toggleRoutineTask } = useAppStore();
  
  const today = getTodayString();
  const dayName = getDayName(today);
  const isWeekdayToday = isWeekday(today);
  
  const completedIds = dailyProgress?.completed_routine_task_ids || [];
  const completedTasks = completedIds.length;
  const totalTasks = routineTasks?.length || 0;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;
  
  return (
    <div className="routine-page">
      {/* Header */}
      <div className="page-header">
        <h1>Daily Routine</h1>
        <p className="subtitle">{dayName}</p>
      </div>
      
      {isWeekdayToday ? (
        <>
          {/* Progress Section */}
          <div className="progress-section gradient-primary">
            <ProgressRing progress={progress} completed={completedTasks} total={totalTasks} size={100} />
            <div className="progress-info">
              <p className="progress-message">{getProgressMessage(completedTasks, totalTasks)}</p>
              <span className="xp-earned">+{dailyProgress?.total_xp_earned || 0} XP earned today</span>
            </div>
          </div>
          
          {/* Task List */}
          <div className="task-list">
            {routineTasks.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                timeLabel={task.time_label}
                title={task.title}
                icon={task.icon}
                isCritical={task.is_critical}
                isCompleted={completedIds.includes(task.id)}
                onToggle={toggleRoutineTask}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="weekend-card gradient-card">
          <div className="weekend-icon">
            <Bed size={64} color="var(--text-muted)" />
          </div>
          <h2>Rest Day</h2>
          <p>Add your weekend routine</p>
          <div className="weekend-tip">
            <Lightbulb size={20} color="var(--accent)" />
            <span>Weekends are for recovery and reflection. You can add custom weekend tasks in settings.</span>
          </div>
        </div>
      )}
    </div>
  );
};
