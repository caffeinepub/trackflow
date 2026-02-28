import React, { useState, useMemo } from 'react';
import { useGetHabits, useGetActivities, useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import StatsCard from '../components/dashboard/StatsCard';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import AddActivityForm from '../components/dashboard/AddActivityForm';
import HabitProgressBar from '../components/dashboard/HabitProgressBar';
import type { Activity, Habit } from '../backend';
import { Clock, DollarSign, Target, TrendingUp, Loader2, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

function getStartOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() * 1_000_000;
}

function getEndOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime() * 1_000_000;
}

function getStartOfWeek(date: Date): number {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.getTime() * 1_000_000;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const { identity } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();

  const {
    data: habits = [],
    isLoading: habitsLoading,
    isError: habitsError,
    refetch: refetchHabits,
  } = useGetHabits();

  const {
    data: activities = [],
    isLoading: activitiesLoading,
    isError: activitiesError,
    refetch: refetchActivities,
  } = useGetActivities();

  const {
    data: userProfile,
    isLoading: profileLoading,
  } = useGetCallerUserProfile();

  // Determine overall loading state
  const isInitializing = actorFetching || !identity;
  const isLoading = isInitializing || habitsLoading || activitiesLoading || profileLoading;
  const hasError = habitsError || activitiesError;

  // Filter activities for selected date
  const todayActivities = useMemo(() => {
    const startOfDay = getStartOfDay(selectedDate);
    const endOfDay = getEndOfDay(selectedDate);
    return activities.filter((a: Activity) => {
      const actDate = Number(a.date);
      return actDate >= startOfDay && actDate <= endOfDay;
    });
  }, [activities, selectedDate]);

  // Filter activities for current week (for weekly habits)
  const weekActivities = useMemo(() => {
    const startOfWeek = getStartOfWeek(selectedDate);
    const endOfDay = getEndOfDay(selectedDate);
    return activities.filter((a: Activity) => {
      const actDate = Number(a.date);
      return actDate >= startOfWeek && actDate <= endOfDay;
    });
  }, [activities, selectedDate]);

  // Compute stats
  const totalMinutesToday = useMemo(() => {
    return todayActivities.reduce((sum: number, a: Activity) => sum + Number(a.duration), 0);
  }, [todayActivities]);

  const totalEarningsToday = useMemo(() => {
    return todayActivities.reduce((sum: number, a: Activity) => sum + Number(a.earnings), 0);
  }, [todayActivities]);

  const productiveMinutes = useMemo(() => {
    return todayActivities
      .filter((a: Activity) => a.isProductive)
      .reduce((sum: number, a: Activity) => sum + Number(a.duration), 0);
  }, [todayActivities]);

  const activeHabits = useMemo(() => {
    return habits.filter((h: Habit) => h.isActive).length;
  }, [habits]);

  const handleRefetch = () => {
    refetchHabits();
    refetchActivities();
  };

  // Show loading state while actor is initializing or queries are loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          {isInitializing ? 'Connecting to the network...' : 'Loading your dashboard...'}
        </p>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-foreground font-medium">Failed to load dashboard data</p>
        <p className="text-muted-foreground text-sm">Please check your connection and try again.</p>
        <Button onClick={handleRefetch} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const dateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{userProfile?.name ? `, ${userProfile.name}` : ''}!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => {
              const d = new Date(e.target.value + 'T00:00:00');
              if (!isNaN(d.getTime())) setSelectedDate(d);
            }}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            onClick={() => setShowAddForm((v) => !v)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {showAddForm ? 'Cancel' : 'Add Activity'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Time Tracked"
          value={formatDuration(totalMinutesToday)}
          icon={<Clock className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard
          label="Earnings"
          value={`₹${totalEarningsToday.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          color="green"
        />
        <StatsCard
          label="Productive"
          value={formatDuration(productiveMinutes)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="purple"
        />
        <StatsCard
          label="Active Habits"
          value={String(activeHabits)}
          icon={<Target className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Add Activity Form (toggled) */}
      {showAddForm && (
        <AddActivityForm
          habits={habits}
          selectedDate={selectedDate}
          onSuccess={() => setShowAddForm(false)}
        />
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Activity Timeline */}
        <div className="lg:col-span-2">
          <ActivityTimeline
            activities={todayActivities}
            habits={habits}
          />
        </div>

        {/* Right: Habit Progress */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Habit Progress</h2>
          {habits.filter((h: Habit) => h.isActive).length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No active habits yet.</p>
              <p className="text-muted-foreground text-xs mt-1">Go to Habits to create your first habit!</p>
            </div>
          ) : (
            habits
              .filter((h: Habit) => h.isActive)
              .map((habit: Habit) => {
                const relevantActivities = habit.goalType === 'daily' ? todayActivities : weekActivities;
                const habitActivities = relevantActivities.filter(
                  (a: Activity) => a.habitId === habit.id
                );
                return (
                  <HabitProgressBar
                    key={String(habit.id)}
                    habit={habit}
                    activities={habitActivities}
                  />
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
