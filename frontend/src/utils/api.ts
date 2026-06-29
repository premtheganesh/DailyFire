import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// ── Helpers ────────────────────────────────────────────────────────────────────

function getDayType(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const wd = d.getDay();
  if (wd === 6) return 'saturday';
  if (wd === 0) return 'sunday';
  return 'weekday';
}

function taskMatchesDayType(dayTypes: string, dayType: string): boolean {
  return (dayTypes || 'weekday').split(',').map(s => s.trim()).includes(dayType);
}

function calculateLevel(xp: number): number {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
  for (let lvl = thresholds.length - 1; lvl >= 0; lvl--) {
    if (xp >= thresholds[lvl]) return lvl < 9 ? lvl + 1 : 10 + Math.floor((xp - 4500) / 1000);
  }
  return 1;
}

function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: 'Rookie', 2: 'Apprentice', 3: 'Rising Star', 4: 'Focused Warrior',
    5: 'Champion', 6: 'Master', 7: 'Legend', 8: 'Elite', 9: 'Unstoppable', 10: 'Grandmaster',
  };
  return level > 10 ? `Grandmaster Level ${level - 9}` : (titles[level] ?? 'Rookie');
}

function checkBadges(profile: any, daysCompleted: number): string[] {
  const current: string[] = typeof profile.badges === 'string' ? JSON.parse(profile.badges) : (profile.badges ?? []);
  const checks: [string, boolean][] = [
    ['first_task',      profile.total_xp >= 10],
    ['week_streak',     profile.current_streak >= 7],
    ['two_week_streak', profile.current_streak >= 14],
    ['month_streak',    profile.current_streak >= 30],
    ['xp_500',          profile.total_xp >= 500],
    ['xp_1000',         profile.total_xp >= 1000],
    ['xp_5000',         profile.total_xp >= 5000],
    ['level_5',         profile.level >= 5],
    ['level_10',        profile.level >= 10],
    ['perfect_week',    daysCompleted >= 5],
  ];
  return checks.filter(([id, cond]) => cond && !current.includes(id)).map(([id]) => id);
}

async function getProfileRaw() {
  const { data } = await supabase.from('user_profile').select('*').limit(1).single();
  return data;
}

async function addXPInternal(amount: number) {
  const p = await getProfileRaw();
  if (!p) return;
  const badges: string[] = typeof p.badges === 'string' ? JSON.parse(p.badges) : (p.badges ?? []);
  const newXP = Math.max(0, p.total_xp + amount);
  const newLevel = calculateLevel(newXP);
  const newBadges = checkBadges({ ...p, total_xp: newXP, level: newLevel }, p.weekly_completed_days ?? 0);
  await supabase.from('user_profile').update({
    total_xp: newXP,
    level: newLevel,
    badges: JSON.stringify([...badges, ...newBadges]),
  }).eq('id', p.id);
}

async function updateStreakInternal(dateStr: string) {
  const p = await getProfileRaw();
  if (!p) return;
  let streak = p.current_streak ?? 0;
  let longest = p.longest_streak ?? 0;
  if (p.last_active_date) {
    const last = new Date(p.last_active_date + 'T00:00:00');
    const cur  = new Date(dateStr + 'T00:00:00');
    const diff = Math.round((cur.getTime() - last.getTime()) / 86400000);
    if (diff === 1) streak += 1;
    else if (diff > 1) streak = 1;
  } else {
    streak = 1;
  }
  longest = Math.max(longest, streak);
  await supabase.from('user_profile').update({
    current_streak: streak,
    longest_streak: longest,
    last_active_date: dateStr,
  }).eq('id', p.id);
}

const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
];

const BADGES_INFO: Record<string, any> = {
  week_streak:     { id: 'week_streak',     name: '7-Day Streak',   description: 'Complete a 7-day streak',    color: '#CD7F32' },
  two_week_streak: { id: 'two_week_streak',  name: '14-Day Streak',  description: '14-day consistency',          color: '#C0C0C0' },
  month_streak:    { id: 'month_streak',     name: '30-Day Streak',  description: 'Unstoppable 30-day run',      color: '#FFD700' },
  first_task:      { id: 'first_task',       name: 'First Step',     description: 'Complete your first task',    color: '#FF6B35' },
  xp_500:          { id: 'xp_500',           name: 'XP Hunter',      description: 'Earn 500 XP',                color: '#9370DB' },
  xp_1000:         { id: 'xp_1000',          name: 'XP Master',      description: 'Earn 1000 XP',               color: '#4169E1' },
  xp_5000:         { id: 'xp_5000',          name: 'XP Legend',      description: 'Earn 5000 XP',               color: '#FFD700' },
  level_5:         { id: 'level_5',          name: 'Level 5',        description: 'Reach Level 5',              color: '#8B5CF6' },
  level_10:        { id: 'level_10',         name: 'Level 10',       description: 'Reach Level 10',             color: '#FFD700' },
  perfect_week:    { id: 'perfect_week',     name: 'Perfect Week',   description: 'Complete all 5 weekdays',    color: '#10B981' },
};

// ── API ────────────────────────────────────────────────────────────────────────

export const api = {

  // ── Profile ──────────────────────────────────────────────────────────────────

  getProfile: async () => {
    let { data } = await supabase.from('user_profile').select('*').limit(1).single();
    if (!data) {
      const { data: inserted } = await supabase.from('user_profile').insert({
        id: uuidv4(), current_streak: 0, longest_streak: 0, total_xp: 0,
        level: 1, badges: '[]', created_at: new Date().toISOString(),
      }).select().single();
      data = inserted;
    }
    const badges = typeof data.badges === 'string' ? JSON.parse(data.badges) : (data.badges ?? []);
    return { ...data, badges, level_title: getLevelTitle(data.level) };
  },

  addXP: async (amount: number) => {
    await addXPInternal(amount);
    return api.getProfile();
  },

  // ── Routine Tasks ─────────────────────────────────────────────────────────────

  getRoutineTasks: async (dayType?: string) => {
    const { data } = await supabase.from('routine_tasks').select('*').order('task_order', { ascending: true });
    const tasks = (data ?? []).map(r => ({ ...r, order: r.task_order, day_types: r.day_types || 'weekday' }));
    if (dayType) return tasks.filter(t => taskMatchesDayType(t.day_types, dayType));
    return tasks;
  },

  createRoutineTask: async (task: any) => {
    const { data: maxRow } = await supabase.from('routine_tasks').select('task_order').order('task_order', { ascending: false }).limit(1).single();
    const order = task.order > 0 ? task.order : ((maxRow?.task_order ?? 0) + 1);
    const id = uuidv4();
    const { data } = await supabase.from('routine_tasks').insert({
      id, time_label: task.time_label, title: task.title,
      icon: task.icon ?? 'checkbox-outline', is_critical: task.is_critical ?? false,
      task_order: order, day_types: task.day_types ?? 'weekday',
    }).select().single();
    return { ...data, order: data.task_order };
  },

  updateRoutineTask: async (taskId: string, task: any) => {
    const updates: any = {};
    if (task.time_label !== undefined) updates.time_label = task.time_label;
    if (task.title !== undefined) updates.title = task.title;
    if (task.icon !== undefined) updates.icon = task.icon;
    if (task.is_critical !== undefined) updates.is_critical = task.is_critical;
    if (task.order !== undefined) updates.task_order = task.order;
    if (task.day_types !== undefined) updates.day_types = task.day_types;
    const { data } = await supabase.from('routine_tasks').update(updates).eq('id', taskId).select().single();
    return { ...data, order: data.task_order, day_types: data.day_types || 'weekday' };
  },

  reorderRoutineTasks: async (orderedIds: string[], _dayType: string) => {
    await Promise.all(orderedIds.map((id, idx) =>
      supabase.from('routine_tasks').update({ task_order: idx + 1 }).eq('id', id)
    ));
    return { message: 'Reordered' };
  },

  deleteRoutineTask: async (taskId: string) => {
    await supabase.from('routine_tasks').delete().eq('id', taskId);
    return { message: 'Task deleted' };
  },

  // ── Daily Progress ────────────────────────────────────────────────────────────

  getDailyProgress: async (date: string) => {
    const { data } = await supabase.from('daily_progress').select('*').eq('date', date).single();
    if (!data) return {
      id: uuidv4(), date, completed_routine_task_ids: [],
      day_type: getDayType(date), total_xp_earned: 0, is_day_complete: false,
    };
    return {
      ...data,
      completed_routine_task_ids: typeof data.completed_routine_task_ids === 'string'
        ? JSON.parse(data.completed_routine_task_ids) : (data.completed_routine_task_ids ?? []),
    };
  },

  toggleRoutineTask: async (taskId: string, date: string) => {
    const dayType = getDayType(date);
    const existing = await api.getDailyProgress(date);
    let completedIds: string[] = [...(existing.completed_routine_task_ids ?? [])];
    const wasComplete = existing.is_day_complete;

    let xpChange = 0;
    if (completedIds.includes(taskId)) {
      completedIds = completedIds.filter(id => id !== taskId);
      xpChange = -10;
    } else {
      completedIds.push(taskId);
      xpChange = 10;
      if (completedIds.length === 1) await updateStreakInternal(date);
    }

    const { data: allTasks } = await supabase.from('routine_tasks').select('id, day_types');
    const dayTasks = (allTasks ?? []).filter(t => taskMatchesDayType(t.day_types || 'weekday', dayType));
    const isComplete = completedIds.length === dayTasks.length && dayTasks.length > 0;

    if (isComplete && !wasComplete) xpChange += 50;
    const newXP = Math.max(0, (existing.total_xp_earned ?? 0) + xpChange);

    if (existing.completed_routine_task_ids.length === 0 && !await progressExists(date)) {
      await supabase.from('daily_progress').insert({
        id: uuidv4(), date,
        completed_routine_task_ids: JSON.stringify(completedIds),
        day_type: dayType, total_xp_earned: newXP,
        is_day_complete: isComplete, created_at: new Date().toISOString(),
      });
    } else {
      await supabase.from('daily_progress').upsert({
        id: existing.id, date,
        completed_routine_task_ids: JSON.stringify(completedIds),
        day_type: dayType, total_xp_earned: newXP, is_day_complete: isComplete,
      });
    }

    if (xpChange !== 0) await addXPInternal(xpChange);

    if (isComplete && !wasComplete) {
      const d = new Date(date + 'T00:00:00');
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      let completedWeekdays = 0;
      for (let i = 0; i < 5; i++) {
        const checkDate = new Date(weekStart);
        checkDate.setDate(weekStart.getDate() + i);
        const checkStr = checkDate.toISOString().split('T')[0];
        const { data: cr } = await supabase.from('daily_progress').select('is_day_complete').eq('date', checkStr).single();
        if (cr?.is_day_complete) completedWeekdays++;
      }
      const p = await getProfileRaw();
      if (p) {
        const badges: string[] = typeof p.badges === 'string' ? JSON.parse(p.badges) : (p.badges ?? []);
        const newBadges = checkBadges({ ...p, weekly_completed_days: completedWeekdays }, completedWeekdays);
        await supabase.from('user_profile').update({
          weekly_completed_days: completedWeekdays,
          ...(newBadges.length > 0 ? { badges: JSON.stringify([...badges, ...newBadges]) } : {}),
        }).eq('id', p.id);
      }
    }

    const progress = await api.getDailyProgress(date);
    return { progress, xp_change: xpChange, is_day_complete: isComplete };
  },

  // ── One-off Tasks ─────────────────────────────────────────────────────────────

  getTasks: async (includeCompleted = false) => {
    const query = supabase.from('one_off_tasks').select('*');
    const { data } = includeCompleted ? await query : await query.eq('is_completed', false);
    const tasks = data ?? [];
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return tasks.sort((a, b) =>
      (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1) ||
      (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')
    );
  },

  createTask: async (task: any) => {
    const id = uuidv4();
    const { data } = await supabase.from('one_off_tasks').insert({
      id, title: task.title, notes: task.notes ?? null,
      due_date: task.due_date ?? null, priority: task.priority ?? 'medium',
      is_completed: false, created_at: new Date().toISOString(),
    }).select().single();
    return data;
  },

  updateTask: async (taskId: string, task: any) => {
    const updates: any = {};
    if (task.title !== undefined) updates.title = task.title;
    if (task.notes !== undefined) updates.notes = task.notes;
    if (task.due_date !== undefined) updates.due_date = task.due_date;
    if (task.priority !== undefined) updates.priority = task.priority;
    const { data } = await supabase.from('one_off_tasks').update(updates).eq('id', taskId).select().single();
    return data;
  },

  completeTask: async (taskId: string) => {
    const { data: task } = await supabase.from('one_off_tasks').select('priority').eq('id', taskId).single();
    await supabase.from('one_off_tasks').update({ is_completed: true, completed_at: new Date().toISOString() }).eq('id', taskId);
    const xpMap: Record<string, number> = { high: 25, medium: 15, low: 10 };
    const xp = xpMap[task?.priority ?? 'medium'] ?? 15;
    await addXPInternal(xp);
    return { message: 'Task completed!', xp_earned: xp };
  },

  deleteTask: async (taskId: string) => {
    await supabase.from('one_off_tasks').delete().eq('id', taskId);
    return { message: 'Task deleted' };
  },

  // ── Daily Notes ───────────────────────────────────────────────────────────────

  getDailyNote: async (date: string) => {
    const { data } = await supabase.from('daily_notes').select('*').eq('date', date).single();
    return data ?? { date, note: '' };
  },

  saveDailyNote: async (date: string, note: string) => {
    const now = new Date().toISOString();
    const { data: existing } = await supabase.from('daily_notes').select('id').eq('date', date).single();
    if (existing) {
      const { data } = await supabase.from('daily_notes').update({ note, updated_at: now }).eq('date', date).select().single();
      return data;
    }
    const { data } = await supabase.from('daily_notes').insert({ id: uuidv4(), date, note, created_at: now, updated_at: now }).select().single();
    return data;
  },

  getRecentNotes: async (limit = 7) => {
    const { data } = await supabase.from('daily_notes').select('*').order('date', { ascending: false }).limit(limit);
    return data ?? [];
  },

  // ── Weekly Summary ────────────────────────────────────────────────────────────

  getWeeklySummary: async (weekStart?: string) => {
    const today = new Date();
    const startDate = weekStart
      ? new Date(weekStart + 'T00:00:00')
      : (() => { const d = new Date(today); d.setDate(d.getDate() - d.getDay() + 1); return d; })();

    const days = [];
    let totalXP = 0, completedDays = 0, totalTasksCompleted = 0;

    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      const dayStr = day.toISOString().split('T')[0];

      const { data: prog } = await supabase.from('daily_progress').select('*').eq('date', dayStr).single();
      const completedIds = prog ? (typeof prog.completed_routine_task_ids === 'string'
        ? JSON.parse(prog.completed_routine_task_ids) : prog.completed_routine_task_ids) : [];
      const xp = prog?.total_xp_earned ?? 0;
      const isComplete = prog?.is_day_complete ?? false;

      const { data: noteRow } = await supabase.from('daily_notes').select('note').eq('date', dayStr).single();

      totalXP += xp;
      if (isComplete) completedDays++;
      totalTasksCompleted += completedIds.length;
      days.push({
        date: dayStr,
        day_name: day.toLocaleDateString('en-US', { weekday: 'short' }),
        xp_earned: xp, is_complete: isComplete,
        tasks_completed: completedIds.length,
        note: noteRow?.note ?? '',
        is_past: day <= today,
      });
    }

    return { week_start: startDate.toISOString().split('T')[0], days, total_xp: totalXP, completed_days: completedDays, total_tasks_completed: totalTasksCompleted };
  },

  // ── Analytics ─────────────────────────────────────────────────────────────────

  getAnalytics: async (days = 30) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - days + 1);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const [{ data: progRows }, { count: completedCount }, { count: totalCount }, profile] = await Promise.all([
      supabase.from('daily_progress').select('*').gte('date', startStr).lte('date', endStr).order('date'),
      supabase.from('one_off_tasks').select('*', { count: 'exact', head: true }).eq('is_completed', true),
      supabase.from('one_off_tasks').select('*', { count: 'exact', head: true }),
      api.getProfile(),
    ]);

    const dailyData = (progRows ?? []).map(r => {
      const ids = typeof r.completed_routine_task_ids === 'string' ? JSON.parse(r.completed_routine_task_ids) : r.completed_routine_task_ids;
      return { date: r.date, xp_earned: r.total_xp_earned, tasks_completed: ids.length, is_complete: r.is_day_complete };
    });

    return {
      daily_data: dailyData,
      total_completed_tasks: completedCount ?? 0,
      total_tasks: totalCount ?? 0,
      completion_rate: totalCount ? Math.round((completedCount ?? 0) / totalCount * 100) : 0,
      total_xp: profile.total_xp,
      current_streak: profile.current_streak,
      longest_streak: profile.longest_streak,
      days_tracked: dailyData.length,
      perfect_days: dailyData.filter(d => d.is_complete).length,
    };
  },

  // ── Goals & Milestones ────────────────────────────────────────────────────────

  getGoals: async () => {
    const { data: goals } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
    const result = [];
    for (const g of goals ?? []) {
      const { data: ms } = await supabase.from('milestones').select('*').eq('goal_id', g.id).order('milestone_order');
      result.push({ ...g, milestones: (ms ?? []).map(m => ({ ...m, order: m.milestone_order })) });
    }
    return result;
  },

  createGoal: async (goal: any) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const { data } = await supabase.from('goals').insert({
      id, title: goal.title, description: goal.description ?? null,
      target_date: goal.target_date ?? null, color: goal.color ?? '#6366F1',
      is_completed: false, created_at: now,
    }).select().single();
    return { ...data, milestones: [] };
  },

  updateGoal: async (goalId: string, goal: any) => {
    const updates: any = {};
    if (goal.title !== undefined) updates.title = goal.title;
    if (goal.description !== undefined) updates.description = goal.description;
    if (goal.target_date !== undefined) updates.target_date = goal.target_date;
    if (goal.color !== undefined) updates.color = goal.color;
    if (goal.is_completed !== undefined) {
      updates.is_completed = goal.is_completed;
      updates.completed_at = goal.is_completed ? new Date().toISOString() : null;
    }
    const { data } = await supabase.from('goals').update(updates).eq('id', goalId).select().single();
    const { data: ms } = await supabase.from('milestones').select('*').eq('goal_id', goalId).order('milestone_order');
    return { ...data, milestones: (ms ?? []).map(m => ({ ...m, order: m.milestone_order })) };
  },

  deleteGoal: async (goalId: string) => {
    await supabase.from('milestones').delete().eq('goal_id', goalId);
    await supabase.from('goals').delete().eq('id', goalId);
    return { message: 'Goal deleted' };
  },

  addMilestone: async (goalId: string, title: string) => {
    const { data: maxRow } = await supabase.from('milestones').select('milestone_order').eq('goal_id', goalId).order('milestone_order', { ascending: false }).limit(1).single();
    const order = (maxRow?.milestone_order ?? 0) + 1;
    const { data } = await supabase.from('milestones').insert({
      id: uuidv4(), goal_id: goalId, title, is_completed: false,
      milestone_order: order, created_at: new Date().toISOString(),
    }).select().single();
    return { ...data, order: data.milestone_order };
  },

  updateMilestone: async (msId: string, updates: any) => {
    const { data } = await supabase.from('milestones').update(updates).eq('id', msId).select().single();
    return { ...data, order: data.milestone_order };
  },

  deleteMilestone: async (msId: string) => {
    await supabase.from('milestones').delete().eq('id', msId);
    return { message: 'Milestone deleted' };
  },

  // ── Quick Notes ───────────────────────────────────────────────────────────────

  getQuickNotes: async () => {
    const { data } = await supabase.from('quick_notes').select('*').order('updated_at', { ascending: false });
    return data ?? [];
  },

  createQuickNote: async (content: string) => {
    const now = new Date().toISOString();
    const { data } = await supabase.from('quick_notes').insert({ id: uuidv4(), content, created_at: now, updated_at: now }).select().single();
    return data;
  },

  updateQuickNote: async (noteId: string, content: string) => {
    const { data } = await supabase.from('quick_notes').update({ content, updated_at: new Date().toISOString() }).eq('id', noteId).select().single();
    return data;
  },

  deleteQuickNote: async (noteId: string) => {
    await supabase.from('quick_notes').delete().eq('id', noteId);
    return { message: 'Note deleted' };
  },

  // ── Intentions ────────────────────────────────────────────────────────────────

  getIntentions: async (date: string) => {
    const { data } = await supabase.from('daily_intentions').select('*').eq('date', date).single();
    if (!data) return { date, intentions: [] };
    return { ...data, intentions: typeof data.intentions === 'string' ? JSON.parse(data.intentions) : data.intentions };
  },

  saveIntentions: async (date: string, intentions: string[]) => {
    const now = new Date().toISOString();
    const val = JSON.stringify(intentions.slice(0, 3));
    const { data: existing } = await supabase.from('daily_intentions').select('id').eq('date', date).single();
    if (existing) {
      const { data } = await supabase.from('daily_intentions').update({ intentions: val, updated_at: now }).eq('date', date).select().single();
      return { ...data, intentions: JSON.parse(data.intentions) };
    }
    const { data } = await supabase.from('daily_intentions').insert({ id: uuidv4(), date, intentions: val, created_at: now, updated_at: now }).select().single();
    return { ...data, intentions: JSON.parse(data.intentions) };
  },

  // ── Vision Board ──────────────────────────────────────────────────────────────

  getVisionCards: async () => {
    const { data } = await supabase.from('vision_cards').select('*').order('card_order');
    return data ?? [];
  },

  createVisionCard: async (card: any) => {
    const { data: maxRow } = await supabase.from('vision_cards').select('card_order').order('card_order', { ascending: false }).limit(1).single();
    const order = (maxRow?.card_order ?? 0) + 1;
    const { data } = await supabase.from('vision_cards').insert({
      id: uuidv4(), text: card.text, emoji: card.emoji ?? '🔥',
      color: card.color ?? '#6366F1', card_order: order, created_at: new Date().toISOString(),
    }).select().single();
    return data;
  },

  updateVisionCard: async (cardId: string, card: any) => {
    const { data } = await supabase.from('vision_cards').update(card).eq('id', cardId).select().single();
    return data;
  },

  deleteVisionCard: async (cardId: string) => {
    await supabase.from('vision_cards').delete().eq('id', cardId);
    return { message: 'Card deleted' };
  },

  // ── Streak Freeze ─────────────────────────────────────────────────────────────

  getStreakFreezeStatus: async () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const { count } = await supabase.from('streak_freezes').select('*', { count: 'exact', head: true }).gte('used_at', weekStartStr);
    const { data: recent } = await supabase.from('streak_freezes').select('*').order('used_at', { ascending: false }).limit(5);
    return { freezes_available: Math.max(0, 1 - (count ?? 0)), used_this_week: count ?? 0, recent_freezes: recent ?? [] };
  },

  useStreakFreeze: async (date: string) => {
    const status = await api.getStreakFreezeStatus();
    if (status.freezes_available < 1) throw new Error('No streak freezes available this week');
    const p = await getProfileRaw();
    if (p) await supabase.from('user_profile').update({ last_active_date: date }).eq('id', p.id);
    await supabase.from('streak_freezes').insert({ id: uuidv4(), date, used_at: new Date().toISOString() });
    return { message: 'Streak freeze applied!', date };
  },

  // ── Push Notifications ────────────────────────────────────────────────────────

  savePushSubscription: async (subscription: PushSubscription) => {
    await supabase.from('push_subscriptions').delete().neq('id', '');
    await supabase.from('push_subscriptions').insert({
      id: uuidv4(), subscription: JSON.stringify(subscription.toJSON()),
      created_at: new Date().toISOString(),
    });
    return { message: 'Subscription saved' };
  },

  // ── Quote & Badges ────────────────────────────────────────────────────────────

  getQuoteOfDay: async () => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return QUOTES[dayOfYear % QUOTES.length];
  },

  getBadgesInfo: async () => BADGES_INFO,
};

// ── Internal helpers ──────────────────────────────────────────────────────────

async function progressExists(date: string): Promise<boolean> {
  const { data } = await supabase.from('daily_progress').select('id').eq('date', date).single();
  return !!data;
}
