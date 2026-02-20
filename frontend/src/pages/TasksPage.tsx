import React, { useState } from 'react';
import { Plus, AlertCircle, Clock, ListTodo, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { OneOffTaskCard } from '../components/OneOffTaskCard';
import { AddTaskModal } from '../components/AddTaskModal';
import './TasksPage.css';

export const TasksPage: React.FC = () => {
  const { oneOffTasks, createOneOffTask, completeOneOffTask, deleteOneOffTask } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  
  const pendingTasks = oneOffTasks.filter((t) => !t.is_completed);
  const highPriorityCount = pendingTasks.filter((t) => t.priority === 'high').length;
  const urgentCount = pendingTasks.filter((t) => {
    if (!t.due_date) return false;
    const diff = Math.ceil((new Date(t.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff <= 1;
  }).length;
  
  const handleDelete = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteOneOffTask(taskId);
    }
  };
  
  return (
    <div className="tasks-page">
      {/* Header */}
      <div className="page-header">
        <h1>Pending Tasks</h1>
        <div className="badge-row">
          <span className="badge">{pendingTasks.length} tasks</span>
          {urgentCount > 0 && (
            <span className="badge urgent">
              <AlertCircle size={14} />
              {urgentCount} urgent
            </span>
          )}
        </div>
      </div>
      
      {/* Stats Card */}
      <div className="stats-card gradient-primary">
        <div className="stat-item">
          <div className="stat-icon high">
            <AlertCircle size={20} />
          </div>
          <span className="stat-value">{highPriorityCount}</span>
          <span className="stat-label">High Priority</span>
        </div>
        
        <div className="stat-divider" />
        
        <div className="stat-item">
          <div className="stat-icon warning">
            <Clock size={20} />
          </div>
          <span className="stat-value">{urgentCount}</span>
          <span className="stat-label">Due Soon</span>
        </div>
        
        <div className="stat-divider" />
        
        <div className="stat-item">
          <div className="stat-icon success">
            <ListTodo size={20} />
          </div>
          <span className="stat-value">{pendingTasks.length}</span>
          <span className="stat-label">Total</span>
        </div>
      </div>
      
      {/* Task List */}
      {pendingTasks.length > 0 ? (
        <div className="task-list">
          {pendingTasks.map((task) => (
            <OneOffTaskCard
              key={task.id}
              id={task.id}
              title={task.title}
              notes={task.notes}
              dueDate={task.due_date}
              priority={task.priority}
              onComplete={completeOneOffTask}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="empty-card gradient-card">
          <div className="empty-icon">
            <CheckCircle size={64} color="var(--success)" />
          </div>
          <h2>All caught up!</h2>
          <p>No pending tasks. Add new tasks using the + button below.</p>
        </div>
      )}
      
      {/* FAB */}
      <motion.button
        className="fab"
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Plus size={32} />
      </motion.button>
      
      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={createOneOffTask}
      />
    </div>
  );
};
