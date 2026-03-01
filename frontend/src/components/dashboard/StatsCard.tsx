import React from 'react';

interface StatsCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose' | 'sky';
  subtitle?: string;
}

const colorMap: Record<
  StatsCardProps['color'],
  { bg: string; icon: string; border: string }
> = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    icon: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-100 dark:border-indigo-900',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    icon: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-900',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    icon: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-900',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    icon: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-100 dark:border-purple-900',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    icon: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-100 dark:border-rose-900',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    icon: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-100 dark:border-sky-900',
  },
};

export default function StatsCard({
  label,
  value,
  icon,
  color,
  subtitle,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={`rounded-xl border ${colors.border} ${colors.bg} p-4 flex flex-col gap-3 shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span className={`${colors.icon}`}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-tight truncate">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
