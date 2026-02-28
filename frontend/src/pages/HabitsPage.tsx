import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetHabits, useDeleteHabit, useGetCallerUserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import HabitFormModal from '../components/habits/HabitFormModal';
import UpgradePlanModal from '../components/habits/UpgradePlanModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Edit2, Flame, Target } from 'lucide-react';
import { toast } from 'sonner';
import type { Habit } from '../backend';
import { Plan } from '../backend';

const PLAN_LIMITS: Record<string, number | null> = {
  free: 3,
  starter: 10,
  premium: null,
};

export default function HabitsPage() {
  const { identity } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const userId = identity?.getPrincipal().toString();

  const { data: habits = [], isLoading: habitsLoading } = useGetHabits(userId);
  const { data: profile } = useGetCallerUserProfile();
  const deleteHabit = useDeleteHabit();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isLoading = actorFetching || habitsLoading;

  const planKey = profile?.plan
    ? Object.keys(Plan).find((k) => Plan[k as keyof typeof Plan] === profile.plan) || 'free'
    : 'free';
  const limit = PLAN_LIMITS[planKey];
  const atLimit = limit !== null && habits.length >= limit;

  const handleAddClick = () => {
    if (atLimit) {
      setShowUpgradeModal(true);
    } else {
      setShowCreateModal(true);
    }
  };

  const handleDelete = async (habitId: bigint) => {
    try {
      await deleteHabit.mutateAsync(habitId);
      toast.success('Habit deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete habit';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Habits</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {limit !== null ? `${habits.length} / ${limit} habits` : `${habits.length} habits`}
          </p>
        </div>
        <Button onClick={handleAddClick} disabled={isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Habit
        </Button>
      </div>

      {/* Habits Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No habits yet</p>
          <p className="text-sm mt-1">Create your first habit to start tracking!</p>
          <Button className="mt-4" onClick={handleAddClick}>
            <Plus className="w-4 h-4 mr-2" />
            Create Habit
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map((habit) => (
            <Card key={habit.id.toString()} className="relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: habit.color }}
              />
              <CardContent className="p-4 pl-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{habit.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {habit.goalType === 'daily' ? 'Daily' : 'Weekly'} · {Number(habit.goalValue)}h
                      </Badge>
                      {Number(habit.streakCount) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-orange-500">
                          <Flame className="w-3 h-3" />
                          {Number(habit.streakCount)} day streak
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingHabit(habit)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(habit.id)}
                      disabled={deleteHabit.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <HabitFormModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
      {editingHabit && (
        <HabitFormModal
          open={!!editingHabit}
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
        />
      )}
      {showUpgradeModal && (
        <UpgradePlanModal
          plan={planKey}
          limit={limit ?? 0}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
}
