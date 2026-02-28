import React, { useState, useEffect } from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HabitsPage from './pages/HabitsPage';
import PricingPage from './pages/PricingPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

// Lazy-loaded pages
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const PaymentPage = React.lazy(() => import('./pages/PaymentPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// Layout component for authenticated pages
function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

// Redirect component for the index route
function IndexRedirect() {
  useEffect(() => {
    window.location.replace('/#/dashboard');
  }, []);
  return null;
}

// Suspense wrapper for lazy pages
function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function AnalyticsPageWrapper() {
  return (
    <React.Suspense fallback={<SuspenseFallback />}>
      <AnalyticsPage />
    </React.Suspense>
  );
}

function PaymentPageWrapper() {
  return (
    <React.Suspense fallback={<SuspenseFallback />}>
      <PaymentPage />
    </React.Suspense>
  );
}

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route (no sidebar)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Pricing route (public, no sidebar required)
const pricingPublicRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pricing',
  component: PricingPage,
});

// Index redirect route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRedirect,
});

// App layout route
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppLayout,
});

// Dashboard
const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: DashboardPage,
});

// Habits
const habitsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/habits',
  component: HabitsPage,
});

// Analytics
const analyticsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/analytics',
  component: AnalyticsPageWrapper,
});

// Profile
const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: ProfilePage,
});

// Admin
const adminRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin',
  component: AdminPage,
});

// Payment
const paymentRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/payment',
  component: PaymentPageWrapper,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  pricingPublicRoute,
  indexRoute,
  appLayoutRoute.addChildren([
    dashboardRoute,
    habitsRoute,
    analyticsRoute,
    profileRoute,
    adminRoute,
    paymentRoute,
  ]),
]);

const router = createRouter({
  routeTree,
  history: 'hash' as any,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
