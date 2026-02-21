import React, { useState } from 'react';
import { Bed, Lightbulb, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { TaskCard } from '../components/TaskCard';
import { ProgressRing } from '../components/ProgressRing';
import { getTodayString, getDayName, isWeekday, getProgressMessage } from '../utils/helpers';
import './RoutinePage.css';

export const RoutinePage: React.FC = () => {
  const { routineTasks, dailyProgress, toggleRoutineTask, addRoutineTask, deleteRoutineTask, updateRoutineTask } = useAppStore();
  
  const today = getTodayString();
  const dayName = getDayName(today);
  const isWeekdayToday = isWeekday(today);
  
  const completedIds = dailyProgress?.completed_routine_task_ids || [];
  const completedTasks = completedIds.length;
  const totalTasks = routineTasks?.length || 0;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addRoutineTask({ title: newTitle.trim(), time_label: newTime.trim() || 'Anytime', icon: '✅', is_critical: false });
    setNewTitle('');
    setNewTime('');
    setShowAddForm(false);
  };

  const handleEditStart = (task: any) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditTime(task.time_label);
  };

  const handleEditSave = () => {
    if (!editTitle.trim() || !editingId) return;
    updateRoutineTask(editingId, { title: editTitle.trim(), time_label: editTime.trim() });
    setEditingId(null);
  };

  return (
    <div className="routine-page">
      <div className="page-header">
        <h1>Daily Routine</h1>
        <p className="subtitle">{dayName}</p>
      </div>
      
      {isWeekdayToday ? (
        <>
          <div className="progress-section gradient-primary">
            <ProgressRing progress={progress} completed={completedTasks} total={totalTasks} size={100} />
            <div className="progress-info">
              <p className="progress-message">{getProgressMessage(completedTasks, totalTasks)}</p>
              <span className="xp-earned">+{dailyProgress?.total_xp_earned || 0} XP earned today</span>
            </div>
          </div>
          
          <div className="task-list">
            {routineTasks.map((task) => (
              <div key={task.id} className="task-row">
                {editingId === task.id ? (
                  <div className="edit-form">
                    <input
                      className="edit-input"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder="Task name"
                    />
                    <input
                      className="edit-input"
                      value={editTime}
                      onChange={e => setEditTime(e.target.value)}
                      placeholder="Time (e.g. 7:30 AM)"
                    />
                    <div className="edit-actions">
                      <button className="btn-icon btn-confirm" onClick={handleEditSave}><Check size={16} /></button>
                      <button className="btn-icon btn-cancel" onClick={() => setEditingId(null)}><X size={16} /></button>
                    </div>
                  </div>
                ) : (
                  <>
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
                    <div className="task-actions">
                      <button className="btn-icon btn-edit" onClick={() => handleEditStart(task)}><Pencil size={14} /></button>
                      <button className="btn-icon btn-delete" onClick={() => deleteRoutineTask(task.id)}><Trash2 size={14} /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {showAddForm && (
            <div className="add-form">
              <input
                className="edit-input"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Task name e.g. Drink protein shake"
                autoFocus
              />
              <input
                className="edit-input"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                placeholder="Time e.g. 8:00 AM (optional)"
              />
              <div className="edit-actions">
                <button className="btn-icon btn-confirm" onClick={handleAdd}><Check size={16} /></button>
                <button className="btn-icon btn-cancel" onClick={() => setShowAddForm(false)}><X size={16} /></button>
              </div>
            </div>
          )}

          <button className="fab-button" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={24} />
            <span>Add Task</span>
          </button>
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
