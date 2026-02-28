import { useMemo } from 'react';
import { Habit, Activity } from '../../backend';

interface HabitProgressBarProps {
  habit: Habit;
  activities: Activity[];
  selectedDate: Date;
}

function isSameDay(ts: bigint, date: Date): boolean {
  const d = new Date(Number(ts) / 1_000_000);
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
}

function isSameWeek(ts: bigint, date: Date): boolean {
  const d = new Date(Number(ts) / 1_000_000);
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

export default function HabitProgressBar({ habit, activities, selectedDate }: HabitProgressBarProps) {
  const { currentMinutes, goalMinutes, percentage } = useMemo(() => {
    const isDaily = habit.goalType === 'daily';
    const relevant = activities.filter(a => {
      if (String(a.habitId) !== String(habit.id)) return false;
      return isDaily ? isSameDay(a.date, selectedDate) : isSameWeek(a.date, selectedDate);
    });
    const currentMinutes = relevant.reduce((s, a) => s + Number(a.duration), 0);
    const goalMinutes = Number(habit.goalValue) * 60;
    const percentage = goalMinutes > 0 ? Math.min(100, (currentMinutes / goalMinutes) * 100) : 0;
    return { currentMinutes, goalMinutes, percentage };
  }, [habit, activities, selectedDate]);

  const currentHours = (currentMinutes / 60).toFixed(1);
  const goalHours = Number(habit.goalValue);
  const isComplete = percentage >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: habit.color || '#4f46e5' }}
          />
          <span className="text-sm font-medium text-slate-700 truncate">{habit.name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="text-xs text-slate-500">
            {currentHours}h / {goalHours}h
          </span>
          {isComplete && (
            <span className="text-xs text-emerald-600 font-bold">✓</span>
          )}
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: isComplete ? '#10b981' : (habit.color || '#4f46e5'),
          }}
        />
      </div>
      <p className="text-xs text-slate-400">
        {habit.goalType === 'daily' ? 'Daily' : 'Weekly'} goal · {Math.round(percentage)}%
      </p>
    </div>
  );
}
