import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Habit } from '../../backend';

interface HabitProgressBarProps {
  habit: Habit;
  currentMinutes: number;
  goalMinutes: number;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function HabitProgressBar({
  habit,
  currentMinutes,
  goalMinutes,
}: HabitProgressBarProps) {
  const percentage =
    goalMinutes > 0 ? Math.min((currentMinutes / goalMinutes) * 100, 100) : 0;
  const isCompleted = currentMinutes >= goalMinutes && goalMinutes > 0;
  const goalLabel = habit.goalType === 'daily' ? 'today' : 'this week';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: habit.color }}
          />
          <span className="text-sm font-medium text-foreground truncate">
            {habit.name}
          </span>
          {isCompleted && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
          {formatMinutes(currentMinutes)} / {formatMinutes(goalMinutes)}{' '}
          {goalLabel}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: isCompleted ? '#10b981' : habit.color,
          }}
        />
      </div>
    </div>
  );
}
