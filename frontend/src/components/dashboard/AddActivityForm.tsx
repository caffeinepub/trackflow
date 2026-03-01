import React, { useState, useEffect } from 'react';
import { Habit } from '../../backend';
import { useLogActivity } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface AddActivityFormProps {
  habits: Habit[];
  onSuccess?: () => void;
}

export default function AddActivityForm({
  habits,
  onSuccess,
}: AddActivityFormProps) {
  const logActivity = useLogActivity();

  const [habitId, setHabitId] = useState('');
  const [customName, setCustomName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isProductive, setIsProductive] = useState(true);
  const [earnings, setEarnings] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill start time with current time
  useEffect(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setStartTime(`${hh}:${mm}`);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!habitId) newErrors.habitId = 'Please select a habit.';
    if (!customName.trim()) newErrors.customName = 'Activity name is required.';
    if (!startTime) newErrors.startTime = 'Start time is required.';
    if (!endTime) newErrors.endTime = 'End time is required.';
    if (startTime && endTime && endTime <= startTime) {
      newErrors.endTime = 'End time must be after start time.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateNs = BigInt(today.getTime()) * 1_000_000n;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startDate = new Date(today);
    startDate.setHours(startH, startM, 0, 0);
    const endDate = new Date(today);
    endDate.setHours(endH, endM, 0, 0);

    const startNs = BigInt(startDate.getTime()) * 1_000_000n;
    const endNs = BigInt(endDate.getTime()) * 1_000_000n;
    const durationMinutes = BigInt(
      Math.round((endDate.getTime() - startDate.getTime()) / 60000)
    );

    try {
      await logActivity.mutateAsync({
        habitId: BigInt(habitId),
        customName: customName.trim(),
        startTime: startNs,
        endTime: endNs,
        duration: durationMinutes,
        isProductive,
        earnings: BigInt(Math.round(Number(earnings) || 0)),
        notes: notes.trim(),
        date: dateNs,
      });

      // Reset form
      setHabitId('');
      setCustomName('');
      setEndTime('');
      setIsProductive(true);
      setEarnings('');
      setNotes('');
      setErrors({});
      onSuccess?.();
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  const activeHabits = habits.filter((h) => h.isActive);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Habit */}
        <div className="space-y-1.5">
          <Label htmlFor="habit-select">Habit *</Label>
          <Select value={habitId} onValueChange={setHabitId}>
            <SelectTrigger id="habit-select" className={errors.habitId ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select a habit" />
            </SelectTrigger>
            <SelectContent>
              {activeHabits.length === 0 ? (
                <SelectItem value="__none__" disabled>
                  No habits yet — create one first
                </SelectItem>
              ) : (
                activeHabits.map((h) => (
                  <SelectItem key={h.id.toString()} value={h.id.toString()}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: h.color }}
                      />
                      {h.name}
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.habitId && (
            <p className="text-xs text-destructive">{errors.habitId}</p>
          )}
        </div>

        {/* Activity Name */}
        <div className="space-y-1.5">
          <Label htmlFor="activity-name">Activity Name *</Label>
          <Input
            id="activity-name"
            placeholder="e.g. Morning coding session"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className={errors.customName ? 'border-destructive' : ''}
          />
          {errors.customName && (
            <p className="text-xs text-destructive">{errors.customName}</p>
          )}
        </div>

        {/* Start Time */}
        <div className="space-y-1.5">
          <Label htmlFor="start-time">Start Time *</Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={errors.startTime ? 'border-destructive' : ''}
          />
          {errors.startTime && (
            <p className="text-xs text-destructive">{errors.startTime}</p>
          )}
        </div>

        {/* End Time */}
        <div className="space-y-1.5">
          <Label htmlFor="end-time">End Time *</Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={errors.endTime ? 'border-destructive' : ''}
          />
          {errors.endTime && (
            <p className="text-xs text-destructive">{errors.endTime}</p>
          )}
        </div>

        {/* Earnings */}
        <div className="space-y-1.5">
          <Label htmlFor="earnings">Earnings / Income (₹)</Label>
          <Input
            id="earnings"
            type="number"
            min="0"
            placeholder="0"
            value={earnings}
            onChange={(e) => setEarnings(e.target.value)}
          />
        </div>

        {/* Productive */}
        <div className="space-y-1.5 flex flex-col justify-end">
          <div className="flex items-center gap-2 pb-1">
            <Checkbox
              id="is-productive"
              checked={isProductive}
              onCheckedChange={(v) => setIsProductive(!!v)}
            />
            <Label htmlFor="is-productive" className="cursor-pointer">
              Mark as Productive
            </Label>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any notes about this activity..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        {logActivity.isError && (
          <p className="text-xs text-destructive self-center">
            Failed to log activity. Please try again.
          </p>
        )}
        <Button type="submit" disabled={logActivity.isPending}>
          {logActivity.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging...
            </>
          ) : (
            'Log Activity'
          )}
        </Button>
      </div>
    </form>
  );
}
