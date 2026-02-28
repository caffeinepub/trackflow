import React from 'react';
import { Users, Activity, Target, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

export default function PlatformStats() {
  const { data, isLoading } = useGetPlatformStats();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="h-16 animate-pulse bg-muted rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Total Users"
        value={Number(data.totalUsers)}
        icon={Users}
        color="bg-blue-500"
      />
      <StatCard
        label="Total Activities"
        value={Number(data.totalActivities)}
        icon={Activity}
        color="bg-green-500"
      />
      <StatCard
        label="Total Habits"
        value={Number(data.totalHabits)}
        icon={Target}
        color="bg-purple-500"
      />
      <StatCard
        label="Payment Requests"
        value={Number(data.totalPaymentRequests)}
        icon={CreditCard}
        color="bg-orange-500"
      />
    </div>
  );
}
