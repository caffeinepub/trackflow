import { useState } from 'react';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { Shield, Users, CreditCard, Tag, BarChart2, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PaymentsQueue from '../components/admin/PaymentsQueue';
import UsersTable from '../components/admin/UsersTable';
import CouponManagement from '../components/admin/CouponManagement';
import PlatformStats from '../components/admin/PlatformStats';

export default function AdminPage() {
  const { data: isAdmin, isLoading } = useIsCallerAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 mb-6">You don't have permission to access the admin panel.</p>
        <Button onClick={() => { window.location.hash = '#/dashboard'; }} variant="outline">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-500 text-sm">Manage users, payments, and coupons</p>
        </div>
      </div>

      <PlatformStats />

      <Tabs defaultValue="payments">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="payments" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Tag className="w-4 h-4" />
            Coupons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4">
          <PaymentsQueue />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UsersTable />
        </TabsContent>
        <TabsContent value="coupons" className="mt-4">
          <CouponManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
