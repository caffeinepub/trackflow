import React from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useIsAdmin } from '../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Target,
  BarChart2,
  CreditCard,
  User,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/habits', label: 'Habits', icon: Target },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/pricing', label: 'Pricing', icon: CreditCard },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { isAdmin } = useIsAdmin();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  const allNavItems = [
    ...navItems,
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-full bg-card border-r border-border transition-all duration-300',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center gap-2 p-4 border-b border-border', collapsed && 'justify-center')}>
          <Activity className="w-6 h-6 text-primary shrink-0" />
          {!collapsed && (
            <span className="font-bold text-foreground text-lg">TrackFlow</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {allNavItems.map(({ path, label, icon: Icon }) => {
            const isActive = pathname === path || pathname.startsWith(path + '/');
            const item = (
              <button
                key={path}
                onClick={() => navigate({ to: path })}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={path}>
                  <TooltipTrigger asChild>{item}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            }

            return item;
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-border space-y-1">
          {identity && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full text-muted-foreground hover:text-destructive',
                    collapsed ? 'justify-center px-2' : 'justify-start gap-3'
                  )}
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Logout</span>}
                </Button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Logout</TooltipContent>}
            </Tooltip>
          )}

          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn('w-full', collapsed ? 'justify-center' : 'justify-end')}
            onClick={onToggle}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
