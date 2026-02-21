import React, { useState, useEffect } from 'react';
import { Bed, Lightbulb, Plus, Trash2, Pencil, Check, X, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '../store/appStore';
import { TaskCard } from '../components/TaskCard';
import { ProgressRing } from '../components/ProgressRing';
import { CalendarStrip } from '../components/CalendarStrip';
import { getTodayString, getDayName, isWeekday, getProgressMessage } from '../utils/helpers';
import { api } from '../utils/api';
import './RoutinePage.css';

export const RoutinePage: React.FC = () => {
  const { routineTasks, dailyProgress, toggleRoutineTask, addRoutineTask, deleteRoutineTask, updateRoutineTask } = useAppStore();

  const todayStr = getTodayString();
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Progress for the selected date (if not today, fetched separately)
  const [selectedProgress, setSelectedProgress] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const isToday = selectedDate === todayStr;
  const dayName = getDayName(selectedDate);
  const isWeekdaySelected = isWeekday(selectedDate);

  // Determine if selected date is in the past (read-only) or future
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const todayDateObj = new Date(todayStr + 'T00:00:00');
  const isPast = selectedDateObj < todayDateObj;
  const isFuture = selectedDateObj > todayDateObj;
  const isReadOnly = isPast || isFuture;

  // Active progress: today uses live store data, others use fetched
  const activeProgress = isToday ? dailyProgress : selectedProgress;
  const completedIds: string[] = activeProgress?.completed_routine_task_ids || [];
  const completedTasks = completedIds.length;
  const totalTasks = routineTasks?.length || 0;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;

  // Edit/Add state (only for today)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');

  // Fetch progress for non-today dates
  useEffect(() => {
    if (isToday) {
      setSelectedProgress(null);
      return;
    }
    const fetch = async () => {
      setLoadingProgress(true);
      try {
        const prog = await api.getDailyProgress(selectedDate);
        setSelectedProgress(prog);
      } catch {
        setSelectedProgress(null);
      } finally {
        setLoadingProgress(false);
      }
    };
    fetch();
  }, [selectedDate, isToday]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowAddForm(false);
    setEditingId(null);
  };

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

  const formatSelectedDate = (ds: string) => {
    const d = new Date(ds + 'T00:00:00');
    return format(d, 'EEEE, MMM d');
  };

  return (
    <div className="routine-page">
      <div className="page-header">
        <h1>Daily Routine</h1>
        <p className="subtitle">{isToday ? `Today – ${dayName}` : formatSelectedDate(selectedDate)}</p>
      </div>

      {/* Calendar Strip */}
      <CalendarStrip
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        totalTasks={totalTasks}
      />

      {isWeekdaySelected ? (
        <>
          {/* Read-only banner for past/future */}
          {isReadOnly && (
            <div className={`readonly-banner ${isPast ? 'readonly-banner--past' : 'readonly-banner--future'}`}>
              <Lock size={14} />
              <span>
                {isPast
                  ? `Viewing ${formatSelectedDate(selectedDate)} — read-only`
                  : `${formatSelectedDate(selectedDate)} — upcoming tasks`}
              </span>
            </div>
          )}

          <div className="progress-section gradient-primary">
            {loadingProgress ? (
              <div className="progress-loading">Loading…</div>
            ) : (
              <>
                <ProgressRing progress={progress} completed={completedTasks} total={totalTasks} size={100} />
                <div className="progress-info">
                  <p className="progress-message">
                    {isFuture
                      ? 'Upcoming routine — stay ready!'
                      : getProgressMessage(completedTasks, totalTasks)}
                  </p>
                  <span className="xp-earned">+{activeProgress?.total_xp_earned || 0} XP earned</span>
                </div>
              </>
            )}
          </div>

          <div className="task-list">
            {routineTasks.map((task) => {
              const isCompleted = completedIds.includes(task.id);

              if (editingId === task.id && isToday) {
                return (
                  <div key={task.id} className="task-row">
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
                  </div>
                );
              }

              return (
                <div key={task.id} className="task-row">
                  <TaskCard
                    id={task.id}
                    timeLabel={task.time_label}
                    title={task.title}
                    icon={task.icon}
                    isCritical={task.is_critical}
                    isCompleted={isCompleted}
                    onToggle={isToday ? toggleRoutineTask : () => {}}
                  />
                  {isToday && (
                    <div className="task-actions">
                      <button className="btn-icon btn-edit" onClick={() => handleEditStart(task)}><Pencil size={14} /></button>
                      <button className="btn-icon btn-delete" onClick={() => deleteRoutineTask(task.id)}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add form + FAB only for today */}
          {isToday && (
            <>
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
          )}
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
