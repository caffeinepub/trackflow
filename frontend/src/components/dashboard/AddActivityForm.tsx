import React, { useState } from 'react';
import { useLogActivity } from '../../hooks/useQueries';
import type { Habit } from '../../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddActivityFormProps {
  habits: Habit[];
  userId: string;
  selectedDate: string;
}

export default function AddActivityForm({ habits, selectedDate }: AddActivityFormProps) {
  const logActivity = useLogActivity();

  const [habitId, setHabitId] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isProductive, setIsProductive] = useState(true);
  const [earnings, setEarnings] = useState('0');
  const [notes, setNotes] = useState('');

  const calculateDuration = (): number => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    return Math.max(0, endMins - startMins);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!habitId) {
      toast.error('Please select a habit');
      return;
    }
    if (!customName.trim()) {
      toast.error('Please enter an activity name');
      return;
    }

    const duration = calculateDuration();
    if (duration <= 0) {
      toast.error('End time must be after start time');
      return;
    }

    // Build timestamps from selectedDate + time
    const dateBase = new Date(selectedDate);
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    const startDate = new Date(dateBase);
    startDate.setHours(sh, sm, 0, 0);
    const endDate = new Date(dateBase);
    endDate.setHours(eh, em, 0, 0);

    const dateTimestamp = new Date(selectedDate);
    dateTimestamp.setHours(0, 0, 0, 0);

    try {
      await logActivity.mutateAsync({
        habitId: BigInt(habitId),
        customName: customName.trim(),
        startTime: BigInt(startDate.getTime()) * 1_000_000n,
        endTime: BigInt(endDate.getTime()) * 1_000_000n,
        duration: BigInt(duration),
        isProductive,
        earnings: BigInt(Math.round(parseFloat(earnings) || 0)),
        notes: notes.trim(),
        date: BigInt(dateTimestamp.getTime()) * 1_000_000n,
      });

      toast.success('Activity logged successfully!');
      // Reset form
      setCustomName('');
      setStartTime('09:00');
      setEndTime('10:00');
      setIsProductive(true);
      setEarnings('0');
      setNotes('');
      setHabitId('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to log activity';
      toast.error(msg);
    }
  };

  const duration = calculateDuration();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Log Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Habit Selector */}
            <div className="space-y-1">
              <Label htmlFor="habit">Habit</Label>
              <Select value={habitId} onValueChange={setHabitId}>
                <SelectTrigger id="habit">
                  <SelectValue placeholder="Select a habit" />
                </SelectTrigger>
                <SelectContent>
                  {habits.length === 0 ? (
                    <SelectItem value="none" disabled>No habits yet</SelectItem>
                  ) : (
                    habits.map((h) => (
                      <SelectItem key={h.id.toString()} value={h.id.toString()}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: h.color }}
                          />
                          {h.name}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Activity Name */}
            <div className="space-y-1">
              <Label htmlFor="customName">Activity Name</Label>
              <Input
                id="customName"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="What did you work on?"
              />
            </div>

            {/* Start Time */}
            <div className="space-y-1">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            {/* End Time */}
            <div className="space-y-1">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            {/* Earnings */}
            <div className="space-y-1">
              <Label htmlFor="earnings">Earnings (₹)</Label>
              <Input
                id="earnings"
                type="number"
                min="0"
                value={earnings}
                onChange={(e) => setEarnings(e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Duration display */}
            <div className="space-y-1">
              <Label>Duration</Label>
              <div className="flex items-center h-10 px-3 border border-border rounded-md bg-muted text-muted-foreground text-sm">
                {duration > 0 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : '—'}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this activity..."
            />
          </div>

          {/* Productive checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="productive"
              checked={isProductive}
              onCheckedChange={(v) => setIsProductive(!!v)}
            />
            <Label htmlFor="productive" className="cursor-pointer">
              Mark as productive
            </Label>
          </div>

          <Button
            type="submit"
            disabled={logActivity.isPending || habits.length === 0}
            className="w-full"
          >
            {logActivity.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Log Activity
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
