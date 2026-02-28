import { useState } from 'react';
import { useGetCallerUserProfile, useGetHabits, useDeleteHabit } from '../hooks/useQueries';
import { Habit } from '../backend';
import { Plus, Flame, Edit2, Trash2, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import HabitFormModal from '../components/habits/HabitFormModal';
import UpgradePlanModal from '../components/habits/UpgradePlanModal';

const PLAN_LIMITS: Record<string, number | null> = {
  free: 3,
  starter: 10,
  premium: null,
};

export default function HabitsPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: habits = [], isLoading } = useGetHabits();
  const deleteHabit = useDeleteHabit();

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const plan = userProfile?.plan || 'free';
  const limit = PLAN_LIMITS[plan as string];
  const activeHabits = habits.filter(h => h.isActive);
  const atLimit = limit !== null && activeHabits.length >= limit;

  const handleAddClick = () => {
    if (atLimit) {
      setShowUpgrade(true);
    } else {
      setShowForm(true);
    }
  };

  const handleDelete = async (habitId: bigint) => {
    if (!confirm('Delete this habit? This cannot be undone.')) return;
    try {
      await deleteHabit.mutateAsync(habitId);
      toast.success('Habit deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete habit');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Habits</h1>
          <p className="text-slate-500 text-sm">
            {activeHabits.length}{limit !== null ? `/${limit}` : ''} habits
            {limit !== null && ` (${plan} plan)`}
          </p>
        </div>
        <Button onClick={handleAddClick} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Plus className="w-4 h-4" />
          Add Habit
        </Button>
      </div>

      {/* Plan limit bar */}
      {limit !== null && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 font-medium">Habit Slots Used</span>
            <span className="text-slate-500">{activeHabits.length} / {limit}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${atLimit ? 'bg-red-500' : 'bg-indigo-600'}`}
              style={{ width: `${(activeHabits.length / limit) * 100}%` }}
            />
          </div>
          {atLimit && (
            <p className="text-red-500 text-xs mt-2">
              Limit reached.{' '}
              <button onClick={() => setShowUpgrade(true)} className="underline font-medium">
                Upgrade to add more
              </button>
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : habits.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No habits yet</h3>
            <p className="text-slate-500 text-sm mb-4">Create your first habit to start tracking your progress</p>
            <Button onClick={handleAddClick} className="bg-indigo-600 hover:bg-indigo-700">
              Create First Habit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map(habit => (
            <Card key={String(habit.id)} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: habit.color || '#4f46e5' }}
                    />
                    <h3 className="font-semibold text-slate-800 text-base">{habit.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingHabit(habit); setShowForm(true); }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(habit.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 border-0">
                      {habit.goalType === 'daily' ? 'Daily' : 'Weekly'}
                    </Badge>
                    <span className="text-xs text-slate-500">Goal: {String(habit.goalValue)}h</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-amber-500">
                    <Flame className="w-4 h-4" />
                    <span className="text-sm font-semibold text-slate-700">
                      {String(habit.streakCount)} day streak
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <HabitFormModal
          habit={editingHabit}
          onClose={() => { setShowForm(false); setEditingHabit(null); }}
        />
      )}

      {showUpgrade && (
        <UpgradePlanModal
          plan={plan as string}
          limit={limit!}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
