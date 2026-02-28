import React, { useState, useMemo } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetHabits, useGetActivities } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import AddActivityForm from '../components/dashboard/AddActivityForm';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import StatsCard from '../components/dashboard/StatsCard';
import HabitProgressBar from '../components/dashboard/HabitProgressBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, DollarSign, TrendingUp, Target } from 'lucide-react';

export default function DashboardPage() {
  const { identity } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const userId = identity?.getPrincipal().toString();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const { data: profile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: habits = [], isLoading: habitsLoading } = useGetHabits(userId);
  const { data: activities = [], isLoading: activitiesLoading } = useGetActivities(userId);

  const isLoading = actorFetching || profileLoading || habitsLoading || activitiesLoading;

  // Filter activities for selected date
  const selectedDateStart = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [selectedDate]);

  const selectedDateEnd = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, [selectedDate]);

  const todayActivities = useMemo(() => {
    return activities.filter((a) => {
      const actDate = Number(a.date) / 1_000_000; // nanoseconds to ms
      return actDate >= selectedDateStart && actDate <= selectedDateEnd;
    });
  }, [activities, selectedDateStart, selectedDateEnd]);

  // Stats calculations
  const stats = useMemo(() => {
    const totalMinutes = todayActivities.reduce((sum, a) => sum + Number(a.duration), 0);
    const totalHours = totalMinutes / 60;
    const totalEarnings = todayActivities.reduce((sum, a) => sum + Number(a.earnings), 0);
    const productiveActivities = todayActivities.filter((a) => a.isProductive);
    const productivity =
      todayActivities.length > 0
        ? Math.round((productiveActivities.length / todayActivities.length) * 100)
        : 0;
    return { totalHours, totalEarnings, productivity, activityCount: todayActivities.length };
  }, [todayActivities]);

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {profileLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              `Welcome back, ${profile?.name || 'User'}!`
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track your habits and productivity</p>
        </div>
        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </>
        ) : (
          <>
            <StatsCard
              label="Hours Tracked"
              value={`${stats.totalHours.toFixed(1)}h`}
              icon={<Clock className="w-5 h-5" />}
              color="blue"
            />
            <StatsCard
              label="Earnings"
              value={`₹${stats.totalEarnings.toLocaleString()}`}
              icon={<DollarSign className="w-5 h-5" />}
              color="green"
            />
            <StatsCard
              label="Productivity"
              value={`${stats.productivity}%`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="purple"
            />
            <StatsCard
              label="Activities"
              value={`${stats.activityCount}`}
              icon={<Target className="w-5 h-5" />}
              color="orange"
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add Activity + Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {actorFetching ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <AddActivityForm
              habits={habits}
              userId={userId}
              selectedDate={selectedDate}
            />
          )}

          {activitiesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <ActivityTimeline
              activities={todayActivities}
              habits={habits}
              selectedDate={selectedDate}
            />
          )}
        </div>

        {/* Right: Habit Progress */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Habit Progress</h2>
          {habitsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : habits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No habits yet. Create one to get started!</p>
            </div>
          ) : (
            habits.map((habit) => (
              <HabitProgressBar
                key={habit.id.toString()}
                habit={habit}
                activities={activities}
                selectedDate={selectedDate}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
