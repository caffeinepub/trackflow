import React, { useState } from 'react';
import type { Activity, Habit } from '../../backend';
import { useDeleteActivity } from '../../hooks/useQueries';
import EditActivityModal from '../activities/EditActivityModal';
import { Clock, Pencil, Trash2, Zap, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivityTimelineProps {
  activities: Activity[];
  habits: Habit[];
}

function formatTime(nanoseconds: bigint | number): string {
  const ms = Number(nanoseconds) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function ActivityTimeline({ activities, habits }: ActivityTimelineProps) {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const deleteActivity = useDeleteActivity();

  const safeActivities = Array.isArray(activities) ? activities : [];
  const safeHabits = Array.isArray(habits) ? habits : [];

  const sorted = [...safeActivities].sort(
    (a, b) => Number(a.startTime) - Number(b.startTime)
  );

  const getHabitName = (habitId: bigint) => {
    const habit = safeHabits.find((h) => h.id === habitId);
    return habit?.name ?? 'Unknown Habit';
  };

  const getHabitColor = (habitId: bigint) => {
    const habit = safeHabits.find((h) => h.id === habitId);
    return habit?.color ?? '#6366f1';
  };

  const handleDelete = async (activityId: bigint) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await deleteActivity.mutateAsync(activityId);
    } catch (err) {
      console.error('Failed to delete activity:', err);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Today's Activities</h2>
        <span className="ml-auto text-xs text-muted-foreground">{sorted.length} logged</span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-8">
          <Coffee className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No activities logged yet.</p>
          <p className="text-muted-foreground text-xs mt-1">Use the form above to log your first activity!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((activity) => (
            <div
              key={String(activity.id)}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              {/* Color dot */}
              <div
                className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: getHabitColor(activity.habitId) }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground truncate">
                    {activity.customName || getHabitName(activity.habitId)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${
                      activity.isProductive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}
                  >
                    {activity.isProductive ? <Zap className="h-3 w-3" /> : <Coffee className="h-3 w-3" />}
                    {activity.isProductive ? 'Productive' : 'Leisure'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span>{formatTime(activity.startTime)} – {formatTime(activity.endTime)}</span>
                  <span>{formatDuration(Number(activity.duration))}</span>
                  {Number(activity.earnings) > 0 && (
                    <span className="text-green-600 dark:text-green-400">₹{Number(activity.earnings).toLocaleString()}</span>
                  )}
                </div>
                {activity.notes && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{activity.notes}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditingActivity(activity)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(activity.id)}
                  disabled={deleteActivity.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EditActivityModal — no `open` prop; it controls its own Dialog open state */}
      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          habits={safeHabits}
          onClose={() => setEditingActivity(null)}
        />
      )}
    </div>
  );
}
