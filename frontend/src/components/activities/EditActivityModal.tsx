import { useState } from 'react';
import { useUpdateActivity } from '../../hooks/useQueries';
import { Activity, Habit } from '../../backend';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface EditActivityModalProps {
  activity: Activity;
  habits: Habit[];
  onClose: () => void;
}

function tsToTimeString(ts: bigint): string {
  const d = new Date(Number(ts) / 1_000_000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function EditActivityModal({ activity, habits, onClose }: EditActivityModalProps) {
  const updateActivity = useUpdateActivity();

  const [habitId, setHabitId] = useState(String(activity.habitId));
  const [customName, setCustomName] = useState(activity.customName);
  const [startTime, setStartTime] = useState(tsToTimeString(activity.startTime));
  const [endTime, setEndTime] = useState(tsToTimeString(activity.endTime));
  const [isProductive, setIsProductive] = useState(activity.isProductive);
  const [earnings, setEarnings] = useState(String(activity.earnings));
  const [notes, setNotes] = useState(activity.notes);

  const calcDuration = (): number => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  };

  const handleSave = async () => {
    const duration = calcDuration();
    if (duration <= 0) {
      toast.error('End time must be after start time');
      return;
    }

    const dateStr = new Date(Number(activity.date) / 1_000_000).toISOString().split('T')[0];
    const startDate = new Date(`${dateStr}T${startTime}:00`);
    const endDate = new Date(`${dateStr}T${endTime}:00`);

    try {
      await updateActivity.mutateAsync({
        activityId: activity.id,
        habitId: BigInt(habitId),
        customName: customName.trim(),
        startTime: BigInt(startDate.getTime()) * BigInt(1_000_000),
        endTime: BigInt(endDate.getTime()) * BigInt(1_000_000),
        duration: BigInt(duration),
        isProductive,
        earnings: BigInt(parseInt(earnings) || 0),
        notes: notes.trim(),
        date: activity.date,
      });
      toast.success('Activity updated');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update activity');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Habit</Label>
              <Select value={habitId} onValueChange={setHabitId}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No habit</SelectItem>
                  {habits.map(h => (
                    <SelectItem key={String(h.id)} value={String(h.id)}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Activity Name</Label>
              <Input
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Earnings (₹)</Label>
              <Input
                type="number"
                min="0"
                value={earnings}
                onChange={e => setEarnings(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-productive"
                  checked={isProductive}
                  onCheckedChange={v => setIsProductive(!!v)}
                />
                <Label htmlFor="edit-productive" className="text-sm cursor-pointer">Productive</Label>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={updateActivity.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {updateActivity.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
