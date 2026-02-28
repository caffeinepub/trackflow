import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsAdmin } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import PlatformStats from '../components/admin/PlatformStats';
import UsersTable from '../components/admin/UsersTable';
import PaymentsQueue from '../components/admin/PaymentsQueue';
import CouponManagement from '../components/admin/CouponManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const { isAdmin, isLoading: adminLoading, isFetched: adminFetched } = useIsAdmin();

  const isAuthenticated = !!identity;

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated && !actorFetching) {
      navigate({ to: '/login' });
      return;
    }
    // Redirect if confirmed not admin
    if (isAuthenticated && adminFetched && !isAdmin) {
      navigate({ to: '/dashboard' });
    }
  }, [isAuthenticated, isAdmin, adminFetched, actorFetching, navigate]);

  // Show loading while checking admin status
  if (actorFetching || adminLoading || !adminFetched) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Verifying admin access...</p>
      </div>
    );
  }

  // Not admin — will redirect via useEffect
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Shield className="w-12 h-12 text-destructive opacity-50" />
        <p className="text-muted-foreground">Access denied. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">Manage users, payments, and platform settings</p>
        </div>
      </div>

      {/* Stats */}
      <PlatformStats />

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UsersTable />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PaymentsQueue />
        </TabsContent>

        <TabsContent value="coupons" className="mt-4">
          <CouponManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
