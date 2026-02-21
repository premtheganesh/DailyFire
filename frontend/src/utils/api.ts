const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // Profile
  getProfile: async () => {
    const res = await fetch(`${API_BASE}/profile`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },
  
  updateStreak: async (date: string) => {
    const res = await fetch(`${API_BASE}/profile/update-streak?date_str=${date}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to update streak');
    return res.json();
  },
  
  addXP: async (amount: number) => {
    const res = await fetch(`${API_BASE}/profile/add-xp?xp_amount=${amount}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to add XP');
    return res.json();
  },
  
  // Routine Tasks
  getRoutineTasks: async () => {
    const res = await fetch(`${API_BASE}/routine-tasks`);
    if (!res.ok) throw new Error('Failed to fetch routine tasks');
    return res.json();
  },

  createRoutineTask: async (task: any) => {
    const res = await fetch(`${API_BASE}/routine-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to create routine task');
    return res.json();
  },
  
  updateRoutineTask: async (taskId: string, task: any) => {
    const res = await fetch(`${API_BASE}/routine-tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to update routine task');
    return res.json();
  },
  
  deleteRoutineTask: async (taskId: string) => {
    const res = await fetch(`${API_BASE}/routine-tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete routine task');
    return res.json();
  },
  
  // Daily Progress
  getDailyProgress: async (date: string) => {
    const res = await fetch(`${API_BASE}/daily-progress/${date}`);
    if (!res.ok) throw new Error('Failed to fetch daily progress');
    return res.json();
  },
  
  toggleRoutineTask: async (taskId: string, date: string) => {
    const res = await fetch(`${API_BASE}/daily-progress/toggle-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, date }),
    });
    if (!res.ok) throw new Error('Failed to toggle task');
    return res.json();
  },
  
  // One-off Tasks
  getTasks: async (includeCompleted = false) => {
    const res = await fetch(`${API_BASE}/tasks?include_completed=${includeCompleted}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },
  
  createTask: async (task: any) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },
  
  completeTask: async (taskId: string) => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to complete task');
    return res.json();
  },
  
  deleteTask: async (taskId: string) => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },
  
  // Quote
  getQuoteOfDay: async () => {
    const res = await fetch(`${API_BASE}/quote-of-day`);
    if (!res.ok) throw new Error('Failed to fetch quote');
    return res.json();
  },
  
  // Badges
  getBadgesInfo: async () => {
    const res = await fetch(`${API_BASE}/badges-info`);
    if (!res.ok) throw new Error('Failed to fetch badges info');
    return res.json();
  },
};
