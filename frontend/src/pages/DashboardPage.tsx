import { useState, useMemo } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetActivities, useGetHabits } from '../hooks/useQueries';
import { Activity, Habit } from '../backend';
import { Clock, DollarSign, TrendingUp, Target, Plus, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import StatsCard from '../components/dashboard/StatsCard';
import AddActivityForm from '../components/dashboard/AddActivityForm';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import HabitProgressBar from '../components/dashboard/HabitProgressBar';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function isSameDay(ts: bigint, date: Date): boolean {
  const d = new Date(Number(ts) / 1_000_000);
  return d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate();
}

export default function DashboardPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: activities = [], isLoading: activitiesLoading } = useGetActivities();
  const { data: habits = [], isLoading: habitsLoading } = useGetHabits();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);

  const todayActivities = useMemo(() =>
    activities.filter(a => isSameDay(a.date, selectedDate)),
    [activities, selectedDate]
  );

  const stats = useMemo(() => {
    const totalMinutes = todayActivities.reduce((sum, a) => sum + Number(a.duration), 0);
    const totalHours = totalMinutes / 60;
    const totalEarnings = todayActivities.reduce((sum, a) => sum + Number(a.earnings), 0);
    const productiveMinutes = todayActivities
      .filter(a => a.isProductive)
      .reduce((sum, a) => sum + Number(a.duration), 0);
    const productiveHours = productiveMinutes / 60;

    // Most active habit
    const habitCounts: Record<string, number> = {};
    todayActivities.forEach(a => {
      if (a.habitId > 0) {
        const key = String(a.habitId);
        habitCounts[key] = (habitCounts[key] || 0) + Number(a.duration);
      }
    });
    const topHabitId = Object.entries(habitCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topHabit = habits.find(h => String(h.id) === topHabitId);

    return { totalHours, totalEarnings, productiveHours, topHabit };
  }, [todayActivities, habits]);

  const isLoading = activitiesLoading || habitsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {userProfile?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{formatDate(selectedDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Activity
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Total Hours Today"
            value={`${stats.totalHours.toFixed(1)}h`}
            icon={Clock}
            color="indigo"
          />
          <StatsCard
            label="Total Earnings"
            value={`₹${stats.totalEarnings.toLocaleString('en-IN')}`}
            icon={DollarSign}
            color="emerald"
          />
          <StatsCard
            label="Productive Hours"
            value={`${stats.productiveHours.toFixed(1)}h`}
            icon={TrendingUp}
            color="amber"
          />
          <StatsCard
            label="Most Active Habit"
            value={stats.topHabit?.name || '—'}
            icon={Target}
            color="purple"
          />
        </div>
      )}

      {/* Add Activity Form */}
      {showAddForm && (
        <AddActivityForm
          habits={habits}
          selectedDate={selectedDate}
          onSuccess={() => setShowAddForm(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <ActivityTimeline
            activities={todayActivities}
            habits={habits}
            isLoading={activitiesLoading}
          />
        </div>

        {/* Habit Progress */}
        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800">Habit Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {habitsLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
              ) : habits.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No habits yet. Add some!</p>
              ) : (
                habits.filter(h => h.isActive).map(habit => (
                  <HabitProgressBar
                    key={String(habit.id)}
                    habit={habit}
                    activities={activities}
                    selectedDate={selectedDate}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
