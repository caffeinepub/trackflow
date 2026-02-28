import { useState, useMemo } from 'react';
import { useGetCallerUserProfile, useGetActivities, useGetHabits } from '../hooks/useQueries';
import { Activity } from '../backend';
import { BarChart2, TrendingUp, PieChart, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#4f46e5', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

type DateRange = '7d' | '30d' | 'month';

function getDateRange(range: DateRange): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  if (range === '7d') start.setDate(end.getDate() - 7);
  else if (range === '30d') start.setDate(end.getDate() - 30);
  else { start.setDate(1); }
  return { start, end };
}

export default function AnalyticsPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: activities = [], isLoading } = useGetActivities();
  const { data: habits = [] } = useGetHabits();
  const [range, setRange] = useState<DateRange>('7d');

  const plan = userProfile?.plan || 'free';
  const isPaid = plan === 'starter' || plan === 'premium';

  const { start, end } = getDateRange(range);

  const filteredActivities = useMemo(() =>
    activities.filter(a => {
      const d = new Date(Number(a.date) / 1_000_000);
      return d >= start && d <= end;
    }),
    [activities, range]
  );

  // Time distribution by activity
  const timeDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    filteredActivities.forEach(a => {
      const name = a.customName || habits.find(h => String(h.id) === String(a.habitId))?.name || 'Other';
      map[name] = (map[name] || 0) + Number(a.duration);
    });
    return Object.entries(map).map(([name, minutes]) => ({
      name,
      value: Math.round(minutes / 60 * 10) / 10,
    }));
  }, [filteredActivities, habits]);

  // Daily earnings
  const dailyEarnings = useMemo(() => {
    const map: Record<string, number> = {};
    filteredActivities.forEach(a => {
      const d = new Date(Number(a.date) / 1_000_000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      map[d] = (map[d] || 0) + Number(a.earnings);
    });
    return Object.entries(map).map(([date, earnings]) => ({ date, earnings }));
  }, [filteredActivities]);

  // Daily productivity
  const dailyProductivity = useMemo(() => {
    const map: Record<string, { productive: number; total: number }> = {};
    filteredActivities.forEach(a => {
      const d = new Date(Number(a.date) / 1_000_000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (!map[d]) map[d] = { productive: 0, total: 0 };
      map[d].total += Number(a.duration);
      if (a.isProductive) map[d].productive += Number(a.duration);
    });
    return Object.entries(map).map(([date, v]) => ({
      date,
      hours: Math.round(v.productive / 60 * 10) / 10,
    }));
  }, [filteredActivities]);

  // Summary stats
  const summary = useMemo(() => {
    const totalHours = filteredActivities.reduce((s, a) => s + Number(a.duration), 0) / 60;
    const totalEarnings = filteredActivities.reduce((s, a) => s + Number(a.earnings), 0);
    const days = range === '7d' ? 7 : range === '30d' ? 30 : new Date().getDate();
    const avgDailyHours = totalHours / days;

    const dayMap: Record<string, number> = {};
    filteredActivities.forEach(a => {
      const d = new Date(Number(a.date) / 1_000_000).toLocaleDateString('en-IN');
      dayMap[d] = (dayMap[d] || 0) + Number(a.duration);
    });
    const mostProductiveDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];

    const actMap: Record<string, number> = {};
    filteredActivities.forEach(a => {
      const name = a.customName || habits.find(h => String(h.id) === String(a.habitId))?.name || 'Other';
      actMap[name] = (actMap[name] || 0) + Number(a.duration);
    });
    const top3 = Object.entries(actMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return { totalHours, totalEarnings, avgDailyHours, mostProductiveDay, top3 };
  }, [filteredActivities, habits, range]);

  const rangeOptions: { label: string; value: DateRange }[] = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'This Month', value: 'month' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm">Insights into your productivity</p>
        </div>
        <div className="flex gap-2">
          {rangeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Hours', value: `${summary.totalHours.toFixed(1)}h` },
          { label: 'Total Earnings', value: `₹${summary.totalEarnings.toLocaleString('en-IN')}` },
          { label: 'Avg Daily Hours', value: `${summary.avgDailyHours.toFixed(1)}h` },
          { label: 'Activities', value: filteredActivities.length.toString() },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isPaid ? (
        /* Free plan — basic analytics */
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Charts are a Paid Feature</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Upgrade to Starter or Premium to unlock beautiful charts, trend analysis, and detailed insights.
            </p>
            <Button
              onClick={() => { window.location.hash = '#/pricing'; }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Upgrade Now
            </Button>

            {/* Basic stats for free users */}
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-sm mx-auto">
              {summary.top3.map(([name, minutes]) => (
                <div key={name} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 truncate">{name}</p>
                  <p className="font-bold text-slate-800 text-sm">{(minutes / 60).toFixed(1)}h</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Paid plan — full charts */
        <div className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-indigo-600" />
                      Time Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {timeDistribution.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-8">No data for this period</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <RechartsPie>
                          <Pie data={timeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}h`}>
                            {timeDistribution.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => [`${v}h`, 'Hours']} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Bar Chart - Earnings */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-indigo-600" />
                      Daily Earnings (₹)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dailyEarnings.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-8">No earnings data</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={dailyEarnings}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: number) => [`₹${v}`, 'Earnings']} />
                          <Bar dataKey="earnings" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Line Chart - Productivity */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    Productivity Trend (Hours/Day)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyProductivity.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">No productivity data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={dailyProductivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`${v}h`, 'Productive Hours']} />
                        <Line type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#4f46e5', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Activities */}
              {summary.top3.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Top Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {summary.top3.map(([name, minutes], i) => (
                        <div key={name} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: COLORS[i] }}>
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-slate-700">{name}</span>
                              <span className="text-slate-500">{(minutes / 60).toFixed(1)}h</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(minutes / (summary.top3[0][1] || 1)) * 100}%`,
                                  background: COLORS[i],
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
