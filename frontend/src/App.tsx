import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useNavigate,
  redirect,
} from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import PaymentPage from './pages/PaymentPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ActivitiesPage from './pages/ActivitiesPage';
import HabitsPage from './pages/HabitsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Root layout component
function RootLayout() {
  return <Outlet />;
}

// Protected layout that checks authentication
function ProtectedLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    navigate({ to: '/login' });
    return null;
  }

  return <Outlet />;
}

// Public layout that redirects authenticated users
function PublicLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (identity) {
    navigate({ to: '/dashboard' });
    return null;
  }

  return <Outlet />;
}

// Route definitions
const rootRoute = createRootRoute({
  component: RootLayout,
});

const publicRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'public',
  component: PublicLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/',
  component: LoginPage,
});

const loginRoute = createRoute({
  getParentRoute: () => publicRoute,
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

const hashHistory = createHashHistory();

const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([indexRoute, loginRoute]),
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

const router = createRouter({
  routeTree,
  history: hashHistory,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
