import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, AlertCircle, MinusCircle, CheckCircle } from 'lucide-react';
import './AddTaskModal.css';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    notes: string | null;
    due_date: string | null;
    priority: 'high' | 'medium' | 'low';
  }) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  
  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      notes: notes.trim() || null,
      due_date: dueDate || null,
      priority,
    });
    setTitle('');
    setNotes('');
    setDueDate('');
    setPriority('medium');
    onClose();
  };
  
  const priorities = [
    { value: 'high' as const, label: 'High', icon: AlertCircle, color: 'var(--priority-high)' },
    { value: 'medium' as const, label: 'Medium', icon: MinusCircle, color: 'var(--priority-medium)' },
    { value: 'low' as const, label: 'Low', icon: CheckCircle, color: 'var(--priority-low)' },
  ];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Add New Task</h2>
              <button className="close-btn" onClick={onClose}>
                <X size={24} />
              </button>
            </div>
            
            <div className="form-group">
              <label>Task Title *</label>
              <input
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                placeholder="Add any details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label>Due Date (optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Priority</label>
              <div className="priority-buttons">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    className={`priority-btn ${priority === p.value ? 'active' : ''}`}
                    style={{
                      borderColor: priority === p.value ? p.color : 'var(--border)',
                      backgroundColor: priority === p.value ? `${p.color}20` : 'transparent',
                    }}
                    onClick={() => setPriority(p.value)}
                  >
                    <p.icon size={20} color={priority === p.value ? p.color : 'var(--text-muted)'} />
                    <span style={{ color: priority === p.value ? p.color : 'var(--text-muted)' }}>
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <button
              className={`submit-btn ${!title.trim() ? 'disabled' : ''}`}
              onClick={handleSubmit}
              disabled={!title.trim()}
            >
              <Plus size={24} />
              Add Task
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
