import { useState } from 'react';
import { useLogActivity } from '../../hooks/useQueries';
import { Habit, HabitGoal } from '../../backend';
import { Clock, DollarSign, FileText, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AddActivityFormProps {
  habits: Habit[];
  selectedDate: Date;
  onSuccess: () => void;
}

export default function AddActivityForm({ habits, selectedDate, onSuccess }: AddActivityFormProps) {
  const logActivity = useLogActivity();

  const [habitId, setHabitId] = useState<string>('0');
  const [customName, setCustomName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isProductive, setIsProductive] = useState(true);
  const [earnings, setEarnings] = useState('0');
  const [notes, setNotes] = useState('');

  const calcDuration = (): number => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    return Math.max(0, endMins - startMins);
  };

  const duration = calcDuration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedHabit = habits.find(h => String(h.id) === habitId);
    const activityName = customName.trim() || selectedHabit?.name || '';

    if (!activityName) {
      toast.error('Please enter an activity name or select a habit');
      return;
    }
    if (duration <= 0) {
      toast.error('End time must be after start time');
      return;
    }

    // Build timestamps from selected date + time
    const dateStr = selectedDate.toISOString().split('T')[0];
    const startDate = new Date(`${dateStr}T${startTime}:00`);
    const endDate = new Date(`${dateStr}T${endTime}:00`);
    const dateTs = new Date(dateStr).getTime();

    try {
      await logActivity.mutateAsync({
        habitId: BigInt(habitId),
        customName: activityName,
        startTime: BigInt(startDate.getTime()) * BigInt(1_000_000),
        endTime: BigInt(endDate.getTime()) * BigInt(1_000_000),
        duration: BigInt(duration),
        isProductive,
        earnings: BigInt(Math.max(0, parseInt(earnings) || 0)),
        notes: notes.trim(),
        date: BigInt(dateTs) * BigInt(1_000_000),
      });
      toast.success('Activity logged!');
      // Reset form
      setHabitId('0');
      setCustomName('');
      setStartTime('09:00');
      setEndTime('10:00');
      setIsProductive(true);
      setEarnings('0');
      setNotes('');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to log activity');
    }
  };

  return (
    <Card className="border-0 shadow-sm border-l-4 border-l-indigo-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-800">Log Activity</CardTitle>
          <button onClick={onSuccess} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Habit selector */}
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Habit (optional)</Label>
              <Select value={habitId} onValueChange={setHabitId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select habit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No habit / Custom</SelectItem>
                  {habits.filter(h => h.isActive).map(h => (
                    <SelectItem key={String(h.id)} value={String(h.id)}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: h.color || '#4f46e5' }}
                        />
                        {h.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom name */}
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Activity Name</Label>
              <Input
                placeholder="e.g. Deep work, Reading..."
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Start time */}
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Start Time
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="h-9"
              />
            </div>

            {/* End time */}
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> End Time
              </Label>
              <Input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Earnings */}
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Earnings (₹)
              </Label>
              <Input
                type="number"
                min="0"
                value={earnings}
                onChange={e => setEarnings(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Duration display */}
            <div className="flex items-end">
              <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm w-full">
                <span className="text-slate-500 text-xs">Duration: </span>
                <span className="font-semibold text-slate-700">
                  {duration > 0 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Notes (optional)
            </Label>
            <Textarea
              placeholder="Any notes about this activity..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Productive checkbox + submit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="productive"
                checked={isProductive}
                onCheckedChange={v => setIsProductive(!!v)}
              />
              <Label htmlFor="productive" className="text-sm text-slate-600 cursor-pointer">
                Productive activity
              </Label>
            </div>
            <Button
              type="submit"
              disabled={logActivity.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {logActivity.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </span>
              ) : (
                'Log Activity'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
