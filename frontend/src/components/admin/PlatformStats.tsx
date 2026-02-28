import { useGetPlatformStats } from '../../hooks/useQueries';
import { Users, Activity, Target, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlatformStats() {
  const { data: stats, isLoading } = useGetPlatformStats();

  const items = [
    { icon: Users, label: 'Total Users', value: stats ? String(stats.totalUsers) : '—', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { icon: Activity, label: 'Total Activities', value: stats ? String(stats.totalActivities) : '—', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Target, label: 'Total Habits', value: stats ? String(stats.totalHabits) : '—', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: CreditCard, label: 'Payment Requests', value: stats ? String(stats.totalPaymentRequests) : '—', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map(({ icon: Icon, label, value, color, bg }) => (
        <Card key={label} className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
