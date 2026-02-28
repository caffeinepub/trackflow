import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useNavigate,
} from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import Layout from './components/layout/Layout';
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

// Not found fallback — redirects to /login
function NotFoundRedirect() {
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
  } else {
    navigate({ to: '/login' });
  }
  return null;
}

// Protected layout that checks authentication (no sidebar)
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

// Protected layout with sidebar for main app pages
function ProtectedLayoutWithSidebar() {
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

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
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
  notFoundComponent: NotFoundRedirect,
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

// Protected routes WITHOUT sidebar (pricing, payment)
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

// Protected routes WITH sidebar (main app pages)
const protectedSidebarRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected-sidebar',
  component: ProtectedLayoutWithSidebar,
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedSidebarRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const analyticsRoute = createRoute({
  getParentRoute: () => protectedSidebarRoute,
  path: '/analytics',
  component: AnalyticsPage,
});

const activitiesRoute = createRoute({
  getParentRoute: () => protectedSidebarRoute,
  path: '/activities',
  component: ActivitiesPage,
});

const habitsRoute = createRoute({
  getParentRoute: () => protectedSidebarRoute,
  path: '/habits',
  component: HabitsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => protectedSidebarRoute,
  path: '/profile',
  component: ProfilePage,
});

const adminRoute = createRoute({
  getParentRoute: () => protectedSidebarRoute,
  path: '/admin',
  component: AdminPage,
});

// Catch-all route for any unmatched paths
const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFoundRedirect,
});

const hashHistory = createHashHistory();

const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([indexRoute, loginRoute]),
  protectedRoute.addChildren([
    pricingRoute,
    paymentRoute,
  ]),
  protectedSidebarRoute.addChildren([
    dashboardRoute,
    analyticsRoute,
    activitiesRoute,
    habitsRoute,
    profileRoute,
    adminRoute,
  ]),
  catchAllRoute,
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
