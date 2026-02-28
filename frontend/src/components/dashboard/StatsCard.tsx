import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: 'indigo' | 'emerald' | 'amber' | 'purple';
}

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'text-indigo-600',
    value: 'text-indigo-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    value: 'text-emerald-700',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    value: 'text-amber-700',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    value: 'text-purple-700',
  },
};

export default function StatsCard({ label, value, icon: Icon, color }: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">{label}</p>
            <p className={`text-2xl font-bold truncate ${colors.value}`}>{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shrink-0 ml-3`}>
            <Icon className={`w-5 h-5 ${colors.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
