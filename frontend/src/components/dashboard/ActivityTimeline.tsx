import React, { useState } from 'react';
import { useDeleteActivity } from '../../hooks/useQueries';
import type { Activity, Habit } from '../../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Clock, List } from 'lucide-react';
import { toast } from 'sonner';
import EditActivityModal from '../activities/EditActivityModal';

interface ActivityTimelineProps {
  activities: Activity[];
  habits: Habit[];
  selectedDate: string;
}

export default function ActivityTimeline({ activities, habits, selectedDate }: ActivityTimelineProps) {
  const deleteActivity = useDeleteActivity();
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const sorted = [...activities].sort((a, b) => Number(a.startTime) - Number(b.startTime));

  const getHabit = (habitId: bigint) => habits.find((h) => h.id === habitId);

  const formatTime = (ns: bigint) => {
    const ms = Number(ns) / 1_000_000;
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDelete = async (activityId: bigint) => {
    try {
      await deleteActivity.mutateAsync(activityId);
      toast.success('Activity deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete activity';
      toast.error(msg);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <List className="w-4 h-4" />
            Activities — {new Date(selectedDate).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No activities logged for this date.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((activity) => {
                const habit = getHabit(activity.habitId);
                return (
                  <div
                    key={activity.id.toString()}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
                  >
                    {/* Color dot */}
                    <div
                      className="w-3 h-3 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: habit?.color || '#6366f1' }}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground truncate">
                          {activity.customName}
                        </span>
                        <Badge variant={activity.isProductive ? 'default' : 'secondary'} className="text-xs">
                          {activity.isProductive ? 'Productive' : 'Leisure'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{habit?.name || 'Unknown habit'}</span>
                        <span>·</span>
                        <span>{formatTime(activity.startTime)} – {formatTime(activity.endTime)}</span>
                        <span>·</span>
                        <span>{Math.floor(Number(activity.duration) / 60)}h {Number(activity.duration) % 60}m</span>
                        {Number(activity.earnings) > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-green-600 dark:text-green-400">₹{Number(activity.earnings).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                      {activity.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{activity.notes}</p>
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          habits={habits}
          open={!!editingActivity}
          onClose={() => setEditingActivity(null)}
        />
      )}
    </>
  );
}
