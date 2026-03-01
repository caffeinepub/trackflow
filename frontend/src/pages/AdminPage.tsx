import React from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlatformStats from '@/components/admin/PlatformStats';
import PaymentsQueue from '@/components/admin/PaymentsQueue';
import UsersTable from '@/components/admin/UsersTable';
import CouponManagement from '@/components/admin/CouponManagement';
import { useActor } from '@/hooks/useActor';

export default function AdminPage() {
  const { isFetching: actorFetching } = useActor();

  if (actorFetching) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading admin panel…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage users, payments, and platform settings</p>
        </div>
      </div>

      <PlatformStats />

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="payments">Payments Queue</TabsTrigger>
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
