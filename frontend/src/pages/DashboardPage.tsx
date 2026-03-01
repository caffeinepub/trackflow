import React, { useMemo, useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetHabits,
  useGetActivities,
  useGetUserStreaks,
} from '../hooks/useQueries';
import { Activity, Habit } from '../backend';
import StatsCard from '../components/dashboard/StatsCard';
import AddActivityForm from '../components/dashboard/AddActivityForm';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import HabitProgressBar from '../components/dashboard/HabitProgressBar';
import { Clock, IndianRupee, TrendingUp, Target, Flame, Zap, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Helper: get today's date at midnight (local time) as a timestamp in nanoseconds
function getTodayStartNs(): bigint {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return BigInt(midnight.getTime()) * 1_000_000n;
}

function getTodayEndNs(): bigint {
  return getTodayStartNs() + 86_400_000_000_000n;
}

function isTodayActivity(activity: Activity): boolean {
  const start = getTodayStartNs();
  const end = getTodayEndNs();
  return activity.date >= start && activity.date < end;
}

function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function DashboardPage() {
  const { identity } = useInternetIdentity();
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    data: habits = [],
    isLoading: habitsLoading,
    error: habitsError,
  } = useGetHabits();

  const {
    data: activities = [],
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useGetActivities();

  const {
    data: streaksData,
    isLoading: streaksLoading,
  } = useGetUserStreaks();

  const isLoading = habitsLoading || activitiesLoading;

  // Filter today's activities
  const todayActivities = useMemo(
    () => activities.filter(isTodayActivity),
    [activities]
  );

  // Stat calculations
  const totalHoursToday = useMemo(() => {
    const totalMinutes = todayActivities.reduce(
      (sum, a) => sum + Number(a.duration),
      0
    );
    return totalMinutes;
  }, [todayActivities]);

  const totalEarningsToday = useMemo(() => {
    return todayActivities.reduce((sum, a) => sum + Number(a.earnings), 0);
  }, [todayActivities]);

  const productiveMinutesToday = useMemo(() => {
    return todayActivities
      .filter((a) => a.isProductive)
      .reduce((sum, a) => sum + Number(a.duration), 0);
  }, [todayActivities]);

  const mostActiveHabit = useMemo(() => {
    if (todayActivities.length === 0) return null;
    const habitTotals: Record<string, { name: string; minutes: number }> = {};
    for (const activity of todayActivities) {
      const habitId = activity.habitId.toString();
      const habit = habits.find((h) => h.id === activity.habitId);
      if (!habitTotals[habitId]) {
        habitTotals[habitId] = {
          name: habit?.name ?? `Habit #${habitId}`,
          minutes: 0,
        };
      }
      habitTotals[habitId].minutes += Number(activity.duration);
    }
    const sorted = Object.values(habitTotals).sort(
      (a, b) => b.minutes - a.minutes
    );
    return sorted[0] ?? null;
  }, [todayActivities, habits]);

  // Progress per habit (today for daily, this week for weekly)
  const getWeekStartNs = (): bigint => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return BigInt(monday.getTime()) * 1_000_000n;
  };

  const habitProgress = useMemo(() => {
    const weekStart = getWeekStartNs();
    return habits
      .filter((h) => h.isActive)
      .map((habit) => {
        const relevantActivities = activities.filter((a) => {
          if (a.habitId !== habit.id) return false;
          if (habit.goalType === 'daily') return isTodayActivity(a);
          // weekly
          return a.date >= weekStart;
        });
        const loggedMinutes = relevantActivities.reduce(
          (sum, a) => sum + Number(a.duration),
          0
        );
        return {
          habit,
          loggedMinutes,
          goalMinutes: Number(habit.goalValue) * 60,
        };
      });
  }, [habits, activities]);

  // Sorted today's timeline
  const sortedTodayActivities = useMemo(() => {
    return [...todayActivities].sort(
      (a, b) => Number(a.startTime) - Number(b.startTime)
    );
  }, [todayActivities]);

  // Streaks per habit (deduplicated by habitId)
  const habitStreaks = useMemo(() => {
    if (!streaksData) return [];
    const seen = new Set<string>();
    const result: typeof streaksData.habits = [];
    for (const hs of streaksData.habits) {
      const key = hs.habitId.toString();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(hs);
      }
    }
    return result;
  }, [streaksData]);

  const userName = identity?.getPrincipal().toString().slice(0, 8) ?? 'there';

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (habitsError || activitiesError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-destructive text-lg font-semibold mb-2">
          Failed to load dashboard data
        </div>
        <p className="text-muted-foreground text-sm">
          {(habitsError as Error)?.message ||
            (activitiesError as Error)?.message ||
            'An unexpected error occurred.'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm((v) => !v)}
          className="gap-2 self-start sm:self-auto"
        >
          {showAddForm ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Log Activity
            </>
          )}
        </Button>
      </div>

      {/* Add Activity Form */}
      {showAddForm && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-base font-semibold mb-4 text-foreground">
            Log New Activity
          </h2>
          <AddActivityForm
            habits={habits}
            onSuccess={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Hours Today"
          value={totalHoursToday === 0 ? '0h' : formatHours(totalHoursToday)}
          icon={<Clock className="w-5 h-5" />}
          color="indigo"
        />
        <StatsCard
          label="Total Earnings"
          value={formatCurrency(totalEarningsToday)}
          icon={<IndianRupee className="w-5 h-5" />}
          color="emerald"
        />
        <StatsCard
          label="Productive Hours"
          value={
            productiveMinutesToday === 0
              ? '0h'
              : formatHours(productiveMinutesToday)
          }
          icon={<TrendingUp className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          label="Most Active Habit"
          value={mostActiveHabit ? mostActiveHabit.name : '—'}
          icon={<Target className="w-5 h-5" />}
          color="purple"
          subtitle={
            mostActiveHabit
              ? formatHours(mostActiveHabit.minutes)
              : 'No activities yet'
          }
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Timeline + Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Timeline */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Today's Timeline</h2>
              {sortedTodayActivities.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {sortedTodayActivities.length} entries
                </Badge>
              )}
            </div>
            <div className="p-4">
              {sortedTodayActivities.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No activities logged today.</p>
                  <p className="text-xs mt-1">
                    Click "Log Activity" to get started!
                  </p>
                </div>
              ) : (
                <ActivityTimeline
                  activities={sortedTodayActivities}
                  habits={habits}
                />
              )}
            </div>
          </div>

          {/* Habit Progress */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Habit Progress</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                Today / This Week
              </span>
            </div>
            <div className="p-4 space-y-4">
              {habitProgress.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No habits created yet.</p>
                  <p className="text-xs mt-1">
                    Go to Habits to create your first habit!
                  </p>
                </div>
              ) : (
                habitProgress.map(({ habit, loggedMinutes, goalMinutes }) => (
                  <HabitProgressBar
                    key={habit.id.toString()}
                    habit={habit}
                    currentMinutes={loggedMinutes}
                    goalMinutes={goalMinutes}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Streaks */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <h2 className="font-semibold text-foreground">Streaks</h2>
            </div>
            <div className="p-4 space-y-3">
              {streaksLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : habitStreaks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flame className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No streaks yet.</p>
                  <p className="text-xs mt-1">
                    Log activities daily to build streaks!
                  </p>
                </div>
              ) : (
                habitStreaks.map((hs) => {
                  const habit = habits.find((h) => h.id === hs.habitId);
                  const streakCount = Number(hs.streakCount);
                  const isActive = hs.active;
                  return (
                    <div
                      key={hs.habitId.toString()}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isActive
                          ? 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: habit?.color ?? '#6366f1' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {habit?.name ?? `Habit #${hs.habitId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Number(hs.totalEntries)} total entries
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Flame
                          className={`w-4 h-4 ${
                            isActive
                              ? 'text-orange-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                        <span
                          className={`text-sm font-bold ${
                            isActive
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {streakCount}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Overall streak summary */}
              {streaksData && (
                <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-3">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-foreground">
                      {Number(streaksData.activeStreak)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Active Streak
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-foreground">
                      {Number(streaksData.longestStreak)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Longest Streak
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Summary */}
          {streaksData && (
            <div className="rounded-xl border border-border bg-card shadow-sm p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                All-Time Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total Activities
                  </span>
                  <span className="font-medium text-foreground">
                    {Number(streaksData.totalActivities)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Today's Entries</span>
                  <span className="font-medium text-foreground">
                    {todayActivities.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Habits</span>
                  <span className="font-medium text-foreground">
                    {habits.filter((h) => h.isActive).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
