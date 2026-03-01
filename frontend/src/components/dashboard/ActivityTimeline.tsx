import React, { useState } from 'react';
import { Activity, Habit } from '../../backend';
import { Edit2, Trash2, CheckCircle, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EditActivityModal from '../activities/EditActivityModal';
import { useDeleteActivity } from '../../hooks/useQueries';

interface ActivityTimelineProps {
  activities: Activity[];
  habits: Habit[];
}

function formatTime(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatCurrency(amount: bigint): string {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function formatDuration(minutes: bigint): string {
  const m = Number(minutes);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

export default function ActivityTimeline({
  activities,
  habits,
}: ActivityTimelineProps) {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const deleteActivity = useDeleteActivity();

  const handleDelete = async (activityId: bigint) => {
    if (!confirm('Delete this activity?')) return;
    await deleteActivity.mutateAsync(activityId);
  };

  return (
    <>
      <div className="space-y-3">
        {activities.map((activity, index) => {
          const habit = habits.find((h) => h.id === activity.habitId);
          return (
            <div key={activity.id.toString()} className="flex gap-3">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div
                  className="w-3 h-3 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: habit?.color ?? '#6366f1' }}
                />
                {index < activities.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {activity.customName}
                      </span>
                      <Badge
                        variant={activity.isProductive ? 'default' : 'secondary'}
                        className="text-xs px-1.5 py-0"
                      >
                        {activity.isProductive ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Productive
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Coffee className="w-3 h-3" /> Leisure
                          </span>
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {habit?.name ?? 'Unknown Habit'} •{' '}
                      {formatTime(activity.startTime)} –{' '}
                      {formatTime(activity.endTime)} •{' '}
                      {formatDuration(activity.duration)}
                    </p>
                    {Number(activity.earnings) > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                        {formatCurrency(activity.earnings)}
                      </p>
                    )}
                    {activity.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingActivity(activity)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(activity.id)}
                      disabled={deleteActivity.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          habits={habits}
          onClose={() => setEditingActivity(null)}
        />
      )}
    </>
  );
}
