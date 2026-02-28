import { useState } from 'react';
import { useUpdateActivity, useDeleteActivity } from '../../hooks/useQueries';
import { Activity, Habit } from '../../backend';
import { Edit2, Trash2, Clock, DollarSign, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ActivityTimelineProps {
  activities: Activity[];
  habits: Habit[];
  isLoading: boolean;
}

function formatTime(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: bigint): string {
  const m = Number(minutes);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ''}`.trim();
}

export default function ActivityTimeline({ activities, habits, isLoading }: ActivityTimelineProps) {
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEarnings, setEditEarnings] = useState('');

  const sorted = [...activities].sort((a, b) => Number(a.startTime) - Number(b.startTime));

  const handleEditStart = (activity: Activity) => {
    setEditingId(String(activity.id));
    setEditName(activity.customName);
    setEditEarnings(String(activity.earnings));
  };

  const handleEditSave = async (activity: Activity) => {
    try {
      await updateActivity.mutateAsync({
        activityId: activity.id,
        habitId: activity.habitId,
        customName: editName.trim() || activity.customName,
        startTime: activity.startTime,
        endTime: activity.endTime,
        duration: activity.duration,
        isProductive: activity.isProductive,
        earnings: BigInt(parseInt(editEarnings) || 0),
        notes: activity.notes,
        date: activity.date,
      });
      setEditingId(null);
      toast.success('Activity updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update');
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await deleteActivity.mutateAsync(id);
      toast.success('Activity deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800">
          Today's Timeline
          {activities.length > 0 && (
            <span className="ml-2 text-xs font-normal text-slate-400">
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No activities logged yet today.</p>
            <p className="text-slate-300 text-xs mt-1">Click "Add Activity" to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(activity => {
              const habit = habits.find(h => String(h.id) === String(activity.habitId));
              const name = activity.customName || habit?.name || 'Unnamed';
              const isEditing = editingId === String(activity.id);

              return (
                <div
                  key={String(activity.id)}
                  className="flex gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-colors group"
                >
                  {/* Time indicator */}
                  <div className="flex flex-col items-center pt-0.5">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: habit?.color || (activity.isProductive ? '#4f46e5' : '#94a3b8') }}
                    />
                    <div className="w-px flex-1 bg-slate-200 mt-1" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="h-8 text-sm"
                          placeholder="Activity name"
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editEarnings}
                            onChange={e => setEditEarnings(e.target.value)}
                            className="h-8 text-sm w-28"
                            placeholder="Earnings ₹"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleEditSave(activity)}
                            disabled={updateActivity.isPending}
                            className="h-8 bg-indigo-600 hover:bg-indigo-700"
                          >
                            {updateActivity.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            className="h-8"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 text-sm truncate">{name}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-slate-400">
                                {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                {formatDuration(activity.duration)}
                              </span>
                              {Number(activity.earnings) > 0 && (
                                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                                  <DollarSign className="w-3 h-3" />
                                  ₹{Number(activity.earnings).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Badge
                              className={`text-xs border-0 ${
                                activity.isProductive
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {activity.isProductive ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {activity.isProductive ? 'Productive' : 'Leisure'}
                            </Badge>
                            <button
                              onClick={() => handleEditStart(activity)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(activity.id)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {activity.notes && (
                          <p className="text-xs text-slate-400 mt-1 truncate">{activity.notes}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
