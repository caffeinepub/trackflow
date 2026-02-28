import React, { useState, useEffect } from 'react';
import { useUpdateActivity } from '../../hooks/useQueries';
import type { Activity, Habit } from '../../backend';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditActivityModalProps {
  activity: Activity;
  habits: Habit[];
  open: boolean;
  onClose: () => void;
}

function nsToTimeString(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  const d = new Date(ms);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function EditActivityModal({ activity, habits, open, onClose }: EditActivityModalProps) {
  const updateActivity = useUpdateActivity();

  const [habitId, setHabitId] = useState(activity.habitId.toString());
  const [customName, setCustomName] = useState(activity.customName);
  const [startTime, setStartTime] = useState(nsToTimeString(activity.startTime));
  const [endTime, setEndTime] = useState(nsToTimeString(activity.endTime));
  const [isProductive, setIsProductive] = useState(activity.isProductive);
  const [earnings, setEarnings] = useState(Number(activity.earnings).toString());
  const [notes, setNotes] = useState(activity.notes);

  useEffect(() => {
    if (open) {
      setHabitId(activity.habitId.toString());
      setCustomName(activity.customName);
      setStartTime(nsToTimeString(activity.startTime));
      setEndTime(nsToTimeString(activity.endTime));
      setIsProductive(activity.isProductive);
      setEarnings(Number(activity.earnings).toString());
      setNotes(activity.notes);
    }
  }, [activity, open]);

  const calculateDuration = (): number => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const duration = calculateDuration();
    if (duration <= 0) {
      toast.error('End time must be after start time');
      return;
    }

    // Reconstruct timestamps using the original date
    const originalDateMs = Number(activity.date) / 1_000_000;
    const dateBase = new Date(originalDateMs);
    dateBase.setHours(0, 0, 0, 0);

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    const startDate = new Date(dateBase);
    startDate.setHours(sh, sm, 0, 0);
    const endDate = new Date(dateBase);
    endDate.setHours(eh, em, 0, 0);

    try {
      await updateActivity.mutateAsync({
        activityId: activity.id,
        habitId: BigInt(habitId),
        customName: customName.trim(),
        startTime: BigInt(startDate.getTime()) * 1_000_000n,
        endTime: BigInt(endDate.getTime()) * 1_000_000n,
        duration: BigInt(duration),
        isProductive,
        earnings: BigInt(Math.round(parseFloat(earnings) || 0)),
        notes: notes.trim(),
        date: activity.date,
      });
      toast.success('Activity updated!');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update activity';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <Label>Habit</Label>
              <Select value={habitId} onValueChange={setHabitId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {habits.map((h) => (
                    <SelectItem key={h.id.toString()} value={h.id.toString()}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 col-span-2">
              <Label>Activity Name</Label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Activity name"
              />
            </div>

            <div className="space-y-1">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="space-y-1 col-span-2">
              <Label>Earnings (₹)</Label>
              <Input
                type="number"
                min="0"
                value={earnings}
                onChange={(e) => setEarnings(e.target.value)}
              />
            </div>

            <div className="space-y-1 col-span-2">
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="editProductive"
              checked={isProductive}
              onCheckedChange={(v) => setIsProductive(!!v)}
            />
            <Label htmlFor="editProductive" className="cursor-pointer">
              Mark as productive
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={updateActivity.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateActivity.isPending}>
              {updateActivity.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
