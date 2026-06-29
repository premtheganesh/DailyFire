import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, parseISO, isBefore, isAfter, isToday } from 'date-fns';
import { api } from '../utils/api';
import './CalendarStrip.css';

interface DayProgress {
  date: string;
  completed_routine_task_ids: string[];
  is_day_complete: boolean;
  total_xp_earned: number;
}

interface CalendarStripProps {
  onDateSelect: (date: string) => void;
  selectedDate: string;
  totalTasks: number;
}

const getDotColor = (progress: DayProgress | null, totalTasks: number): 'green' | 'orange' | 'red' | 'grey' => {
  if (!progress || progress.completed_routine_task_ids.length === 0) return 'grey';
  const pct = totalTasks > 0 ? progress.completed_routine_task_ids.length / totalTasks : 0;
  if (pct >= 0.8) return 'green';
  if (pct >= 0.5) return 'orange';
  return 'red';
};

export const CalendarStrip: React.FC<CalendarStripProps> = ({ onDateSelect, selectedDate, totalTasks }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [progressCache, setProgressCache] = useState<Record<string, DayProgress | null>>({});
  const todayRef = useRef<HTMLButtonElement>(null);

  // Compute Mon–Sun for current week offset
  const baseMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStart = weekOffset === 0 ? baseMonday : addWeeks(baseMonday, weekOffset);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Fetch progress for all past days in the current week view
  useEffect(() => {
    const fetchWeekProgress = async () => {
      const toFetch = days.filter(d => {
        const ds = format(d, 'yyyy-MM-dd');
        return (isBefore(d, today) || format(d, 'yyyy-MM-dd') === todayStr) && !(ds in progressCache);
      });
      if (toFetch.length === 0) return;

      const results = await Promise.allSettled(
        toFetch.map(d => api.getDailyProgress(format(d, 'yyyy-MM-dd')))
      );

      const newCache: Record<string, DayProgress | null> = {};
      toFetch.forEach((d, i) => {
        const ds = format(d, 'yyyy-MM-dd');
        const r = results[i];
        newCache[ds] = r.status === 'fulfilled' ? r.value : null;
      });
      setProgressCache(prev => ({ ...prev, ...newCache }));
    };
    fetchWeekProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  const handlePrev = () => setWeekOffset(w => w - 1);
  const handleNext = () => {
    if (weekOffset < 0) setWeekOffset(w => w + 1);
  };

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="calendar-strip">
      <div className="calendar-strip__nav">
        <button className="calendar-strip__arrow" onClick={handlePrev} aria-label="Previous week">
          <ChevronLeft size={18} />
        </button>
        <span className="calendar-strip__week-label">
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </span>
        <button
          className="calendar-strip__arrow"
          onClick={handleNext}
          disabled={weekOffset >= 0}
          aria-label="Next week"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="calendar-strip__days">
        {days.map((d, i) => {
          const ds = format(d, 'yyyy-MM-dd');
          const isSelected = ds === selectedDate;
          const isTodayDay = ds === todayStr;
          const isPast = isBefore(d, today) && !isTodayDay;
          const isFuture = isAfter(d, today);
          const prog = progressCache[ds] ?? null;
          const dotColor = (isPast || isTodayDay) ? getDotColor(prog, totalTasks) : null;

          return (
            <button
              key={ds}
              ref={isTodayDay ? todayRef : undefined}
              className={[
                'calendar-strip__day',
                isSelected ? 'calendar-strip__day--selected' : '',
                isTodayDay ? 'calendar-strip__day--today' : '',
                isPast ? 'calendar-strip__day--past' : '',
                isFuture ? 'calendar-strip__day--future' : '',
              ].join(' ')}
              onClick={() => onDateSelect(ds)}
              aria-label={`${DAY_LABELS[i]} ${format(d, 'MMM d')}`}
            >
              <span className="calendar-strip__day-name">{DAY_LABELS[i]}</span>
              <span className="calendar-strip__day-num">{format(d, 'd')}</span>
              {dotColor && (
                <span className={`calendar-strip__dot calendar-strip__dot--${dotColor}`} />
              )}
              {isFuture && <span className="calendar-strip__dot calendar-strip__dot--empty" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
