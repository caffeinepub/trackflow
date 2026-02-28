import { useState } from 'react';
import { useCreateHabit, useUpdateHabit } from '../../hooks/useQueries';
import { Habit, HabitGoal } from '../../backend';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface HabitFormModalProps {
  habit: Habit | null;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#4f46e5', '#7c3aed', '#0ea5e9', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#64748b',
];

export default function HabitFormModal({ habit, onClose }: HabitFormModalProps) {
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();

  const [name, setName] = useState(habit?.name || '');
  const [goalType, setGoalType] = useState<HabitGoal>(habit?.goalType || HabitGoal.daily);
  const [goalValue, setGoalValue] = useState(habit ? String(habit.goalValue) : '1');
  const [color, setColor] = useState(habit?.color || '#4f46e5');

  const isEditing = !!habit;
  const isPending = createHabit.isPending || updateHabit.isPending;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a habit name');
      return;
    }
    const gv = parseInt(goalValue);
    if (!gv || gv < 1) {
      toast.error('Goal value must be at least 1 hour');
      return;
    }

    try {
      if (isEditing) {
        await updateHabit.mutateAsync({
          habitId: habit.id,
          name: name.trim(),
          goalType,
          goalValue: BigInt(gv),
          color,
        });
        toast.success('Habit updated!');
      } else {
        await createHabit.mutateAsync({
          name: name.trim(),
          goalType,
          goalValue: BigInt(gv),
          color,
        });
        toast.success('Habit created!');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save habit');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Habit Name *</Label>
            <Input
              placeholder="e.g. Morning Exercise, Reading..."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Goal Type</Label>
              <Select value={goalType} onValueChange={v => setGoalType(v as HabitGoal)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={HabitGoal.daily}>Daily</SelectItem>
                  <SelectItem value={HabitGoal.weekly}>Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Goal (hours)</Label>
              <Input
                type="number"
                min="1"
                max="24"
                value={goalValue}
                onChange={e => setGoalValue(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border-0 p-0"
                title="Custom color"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              isEditing ? 'Update Habit' : 'Create Habit'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
