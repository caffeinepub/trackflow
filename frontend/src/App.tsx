import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';
import { useQuery } from '@tanstack/react-query';
import { UserProfile } from './backend';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import PaymentPage from './pages/PaymentPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ActivitiesPage from './pages/ActivitiesPage';
import HabitsPage from './pages/HabitsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import Layout from './components/layout/Layout';

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Auth guard component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading TrackFlow...</p>
        </div>
      </div>
    );
  }
  if (!identity) {
    window.location.hash = '#/login';
    return null;
  }
  return <>{children}</>;
}

// Layout wrapper for protected routes
function ProtectedLayout() {
  return (
    <AuthGuard>
      <Layout>
        <Outlet />
      </Layout>
    </AuthGuard>
  );
}

// Routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: ProtectedLayout,
});

const pricingRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/pricing',
  component: PricingPage,
});

const paymentRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/payment',
  component: PaymentPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const analyticsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analytics',
  component: AnalyticsPage,
});

const activitiesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/activities',
  component: ActivitiesPage,
});

const habitsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/habits',
  component: HabitsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/profile',
  component: ProfilePage,
});

const adminRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin',
  component: AdminPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    window.location.hash = '#/login';
    return null;
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  protectedRoute.addChildren([
    pricingRoute,
    paymentRoute,
    dashboardRoute,
    analyticsRoute,
    activitiesRoute,
    habitsRoute,
    profileRoute,
    adminRoute,
  ]),
]);

const router = createRouter({ routeTree, basepath: '/' });

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}
