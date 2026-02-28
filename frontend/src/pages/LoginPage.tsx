import { useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Zap, CheckCircle, BarChart2, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login, clear, loginStatus, identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  useEffect(() => {
    if (isAuthenticated) {
      window.location.hash = '#/pricing';
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const features = [
    { icon: Clock, title: 'Time Tracking', desc: 'Log every minute of your day with precision' },
    { icon: Target, title: 'Habit Goals', desc: 'Set daily & weekly goals and track streaks' },
    { icon: BarChart2, title: 'Analytics', desc: 'Visualize your productivity with rich charts' },
    { icon: CheckCircle, title: 'Earnings Log', desc: 'Track income alongside your activities' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-400 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">TrackFlow</span>
        </div>
        <Button
          onClick={handleLogin}
          disabled={isLoggingIn || isInitializing}
          variant="outline"
          className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white"
        >
          {isLoggingIn ? 'Signing in...' : 'Sign In'}
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-700/50 border border-indigo-500/40 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-indigo-200 text-sm font-medium">Your productivity companion</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6 max-w-3xl">
          Track Your Time,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
            Boost Your Productivity
          </span>
        </h1>

        <p className="text-indigo-200 text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
          TrackFlow helps you log activities, monitor habits, track earnings, and gain insights — all in one beautiful dashboard.
        </p>

        <Button
          onClick={handleLogin}
          disabled={isLoggingIn || isInitializing}
          size="lg"
          className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold px-10 py-6 text-base rounded-2xl shadow-2xl shadow-indigo-900/50 transition-all hover:scale-105"
        >
          {isLoggingIn ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            'Get Started — It\'s Free'
          )}
        </Button>

        <p className="text-indigo-400 text-sm mt-4">No credit card required for free plan</p>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl w-full">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left hover:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 bg-indigo-500/30 rounded-xl flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-indigo-300" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
              <p className="text-indigo-300 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-indigo-400 text-sm border-t border-white/10">
        © {new Date().getFullYear()} TrackFlow. All rights reserved. &nbsp;|&nbsp; Built with{' '}
        <span className="text-red-400">♥</span> using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'trackflow')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-300 hover:text-white transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
