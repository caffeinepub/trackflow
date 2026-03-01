import React from 'react';
import { Users, Activity, Target, CreditCard, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetPlatformStats } from '@/hooks/useQueries';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const statDefs = [
  { label: 'Total Users', icon: Users, color: 'bg-blue-500', key: 'totalUsers' as const },
  { label: 'Total Activities', icon: Activity, color: 'bg-green-500', key: 'totalActivities' as const },
  { label: 'Total Habits', icon: Target, color: 'bg-purple-500', key: 'totalHabits' as const },
  { label: 'Payment Requests', icon: CreditCard, color: 'bg-orange-500', key: 'totalPaymentRequests' as const },
];

export default function PlatformStats() {
  const { data, isLoading, isError, error, refetch } = useGetPlatformStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statDefs.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.color}`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <div className="h-8 w-16 animate-pulse bg-muted rounded mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    const errMsg = error instanceof Error ? error.message : String(error ?? '');
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-7 w-7 text-destructive" />
            <p className="font-medium text-destructive">Failed to load platform stats.</p>
            {errMsg && (
              <p className="text-sm text-muted-foreground max-w-sm">{errMsg}</p>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statDefs.map((s) => (
        <StatCard
          key={s.label}
          label={s.label}
          value={Number(data[s.key])}
          icon={s.icon}
          color={s.color}
        />
      ))}
    </div>
  );
}
