import React from 'react';
import type { Habit, Activity } from '../../backend';

interface HabitProgressBarProps {
  habit: Habit;
  activities: Activity[];
}

export default function HabitProgressBar({ habit, activities }: HabitProgressBarProps) {
  if (!habit) return null;

  const safeActivities = Array.isArray(activities) ? activities : [];

  // Calculate total minutes logged for this habit
  const totalMinutes = safeActivities.reduce((sum, a) => sum + Number(a.duration ?? 0), 0);
  const totalHours = totalMinutes / 60;

  // Goal value is stored as hours in the backend
  const goalHours = Number(habit.goalValue ?? 0);
  const progress = goalHours > 0 ? Math.min((totalHours / goalHours) * 100, 100) : 0;

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const goalLabel = habit.goalType === 'daily' ? 'today' : 'this week';
  const isComplete = progress >= 100;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: habit.color || '#6366f1' }}
          />
          <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
            {habit.name || 'Unnamed Habit'}
          </span>
        </div>
        <span className={`text-xs font-medium ${isComplete ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
          {isComplete ? '✓ Done' : `${formatTime(totalHours)} / ${goalHours}h`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            backgroundColor: isComplete ? '#22c55e' : (habit.color || '#6366f1'),
          }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Goal: {goalHours}h {goalLabel}
        {habit.streakCount > 0 && (
          <span className="ml-2 text-orange-500">🔥 {String(habit.streakCount)} day streak</span>
        )}
      </p>
    </div>
  );
}
