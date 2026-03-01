import React from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  BarChart2,
  ListChecks,
  CheckSquare,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BarChart2, label: 'Analytics', path: '/analytics' },
  { icon: ListChecks, label: 'Activities', path: '/activities' },
  { icon: CheckSquare, label: 'Habits', path: '/habits' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Shield, label: 'Admin', path: '/admin' },
];

function getActivePath(): string {
  const hash = window.location.hash;
  const path = hash.replace('#', '').split('?')[0];
  return path || '/dashboard';
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const activePath = getActivePath();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    window.location.hash = '#/login';
  };

  const navigate = (path: string) => {
    window.location.hash = `#${path}`;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-slate-100 shadow-sm flex flex-col transition-all duration-300 z-40 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-slate-100 px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-slate-900 text-lg tracking-tight">TrackFlow</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = activePath === path || (path !== '/dashboard' && activePath.startsWith(path));
            return collapsed ? (
              <Tooltip key={path}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(path)}
                    className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom: Logout + Toggle */}
        <div className="border-t border-slate-100 p-2 space-y-1">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span>Logout</span>
            </button>
          )}

          {/* Collapse toggle */}
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-300 hover:bg-slate-50 hover:text-slate-500 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
