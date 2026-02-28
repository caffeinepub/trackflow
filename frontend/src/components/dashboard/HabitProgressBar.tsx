import React, { useMemo } from 'react';
import type { Habit, Activity } from '../../backend';
import { HabitGoal } from '../../backend';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface HabitProgressBarProps {
  habit: Habit;
  activities: Activity[];
  selectedDate: string;
}

export default function HabitProgressBar({ habit, activities, selectedDate }: HabitProgressBarProps) {
  const progress = useMemo(() => {
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    let filtered: Activity[];

    if (habit.goalType === HabitGoal.weekly) {
      // Get start of week (Monday)
      const day = selected.getDay();
      const diff = selected.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(selected);
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      filtered = activities.filter((a) => {
        if (a.habitId !== habit.id) return false;
        const actMs = Number(a.date) / 1_000_000;
        return actMs >= weekStart.getTime() && actMs < weekEnd.getTime();
      });
    } else {
      // Daily
      const dayEnd = new Date(selected);
      dayEnd.setHours(23, 59, 59, 999);

      filtered = activities.filter((a) => {
        if (a.habitId !== habit.id) return false;
        const actMs = Number(a.date) / 1_000_000;
        return actMs >= selected.getTime() && actMs <= dayEnd.getTime();
      });
    }

    const totalMinutes = filtered.reduce((sum, a) => sum + Number(a.duration), 0);
    const totalHours = totalMinutes / 60;
    const goalHours = Number(habit.goalValue);
    const percentage = goalHours > 0 ? Math.min(100, (totalHours / goalHours) * 100) : 0;

    return { totalHours, goalHours, percentage };
  }, [habit, activities, selectedDate]);

  return (
    <Card className="p-3">
      <CardContent className="p-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: habit.color }}
            />
            <span className="text-sm font-medium text-foreground truncate">{habit.name}</span>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {progress.totalHours.toFixed(1)}h / {progress.goalHours}h
          </span>
        </div>
        <Progress value={progress.percentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{habit.goalType === HabitGoal.weekly ? 'Weekly' : 'Daily'} goal</span>
          <span>{Math.round(progress.percentage)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
