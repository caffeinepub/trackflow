import React, { useState, useEffect } from 'react';
import { useCreateHabit, useUpdateHabit } from '../../hooks/useQueries';
import type { Habit } from '../../backend';
import { HabitGoal } from '../../backend';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
];

interface HabitFormModalProps {
  open: boolean;
  onClose: () => void;
  habit?: Habit;
}

export default function HabitFormModal({ open, onClose, habit }: HabitFormModalProps) {
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();

  const isEditing = !!habit;

  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState<HabitGoal>(HabitGoal.daily);
  const [goalValue, setGoalValue] = useState('1');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setGoalType(habit.goalType as HabitGoal);
      setGoalValue(Number(habit.goalValue).toString());
      setColor(habit.color);
    } else {
      setName('');
      setGoalType(HabitGoal.daily);
      setGoalValue('1');
      setColor(PRESET_COLORS[0]);
    }
  }, [habit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a habit name');
      return;
    }

    const goalValueNum = parseInt(goalValue, 10);
    if (isNaN(goalValueNum) || goalValueNum <= 0) {
      toast.error('Goal value must be a positive number');
      return;
    }

    try {
      if (isEditing && habit) {
        await updateHabit.mutateAsync({
          habitId: habit.id,
          name: name.trim(),
          goalType,
          goalValue: BigInt(goalValueNum),
          color,
        });
        toast.success('Habit updated successfully!');
      } else {
        await createHabit.mutateAsync({
          name: name.trim(),
          goalType,
          goalValue: BigInt(goalValueNum),
          color,
        });
        toast.success('Habit created successfully!');
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'create'} habit`;
      toast.error(msg);
    }
  };

  const isPending = createHabit.isPending || updateHabit.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="habitName">Habit Name</Label>
            <Input
              id="habitName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Exercise"
              autoFocus
            />
          </div>

          {/* Goal Type */}
          <div className="space-y-1">
            <Label htmlFor="goalType">Goal Type</Label>
            <Select value={goalType} onValueChange={(v) => setGoalType(v as HabitGoal)}>
              <SelectTrigger id="goalType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={HabitGoal.daily}>Daily</SelectItem>
                <SelectItem value={HabitGoal.weekly}>Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Goal Value */}
          <div className="space-y-1">
            <Label htmlFor="goalValue">Goal (hours)</Label>
            <Input
              id="goalValue"
              type="number"
              min="1"
              max="24"
              value={goalValue}
              onChange={(e) => setGoalValue(e.target.value)}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Save Changes' : 'Create Habit'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
