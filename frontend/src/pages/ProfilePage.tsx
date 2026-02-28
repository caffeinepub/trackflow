import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
  useDeleteAccount,
  useGetActivities,
  useGetHabits,
} from '../hooks/useQueries';
import { User, Phone, Calendar, Activity, Clock, DollarSign, Trash2, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'bg-slate-100 text-slate-600' },
  starter: { label: 'Starter', color: 'bg-indigo-100 text-indigo-700' },
  premium: { label: 'Premium', color: 'bg-purple-100 text-purple-700' },
};

export default function ProfilePage() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: activities = [] } = useGetActivities();
  const { data: habits = [] } = useGetHabits();
  const saveProfile = useSaveCallerUserProfile();
  const deleteAccount = useDeleteAccount();

  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [editingPhone, setEditingPhone] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  const totalHours = activities.reduce((s, a) => s + Number(a.duration), 0) / 60;
  const totalEarnings = activities.reduce((s, a) => s + Number(a.earnings), 0);

  const handleSavePhone = async () => {
    if (!userProfile) return;
    setSavingPhone(true);
    try {
      await saveProfile.mutateAsync({ ...userProfile, phone: phone.trim() });
      setEditingPhone(false);
      toast.success('Phone number updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update phone');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync();
      await clear();
      queryClient.clear();
      window.location.hash = '#/login';
      toast.success('Account deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete account');
    }
  };

  const handleExportData = () => {
    const data = {
      profile: userProfile,
      activities: activities.map(a => ({
        ...a,
        id: String(a.id),
        habitId: String(a.habitId),
        startTime: String(a.startTime),
        endTime: String(a.endTime),
        duration: String(a.duration),
        earnings: String(a.earnings),
        date: String(a.date),
      })),
      habits: habits.map(h => ({
        ...h,
        id: String(h.id),
        goalValue: String(h.goalValue),
        streakCount: String(h.streakCount),
        createdAt: String(h.createdAt),
      })),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trackflow-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported!');
  };

  const planInfo = PLAN_LABELS[(userProfile?.plan as string) || 'free'];

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 text-sm">Manage your account settings</p>
      </div>

      {/* Profile Info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{userProfile?.name || 'User'}</h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${planInfo.color}`}>
                  {planInfo.label} Plan
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-0.5">{userProfile?.email}</p>
              <p className="text-slate-400 text-xs mt-1 font-mono truncate">
                {identity?.getPrincipal().toString()}
              </p>
              {userProfile?.planExpiry && (
                <p className="text-xs text-amber-600 mt-1">
                  Plan expires: {new Date(Number(userProfile.planExpiry) / 1_000_000).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phone Number */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-600" />
            Phone Number
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingPhone ? (
            <div className="flex gap-2">
              <Input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="flex-1"
              />
              <Button
                onClick={handleSavePhone}
                disabled={savingPhone}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {savingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditingPhone(false); setPhone(userProfile?.phone || ''); }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-slate-700">{userProfile?.phone || 'Not set'}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditingPhone(true); setPhone(userProfile?.phone || ''); }}
              >
                Edit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Stats */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Account Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                icon: Calendar,
                label: 'Member Since',
                value: userProfile?.createdAt
                  ? new Date(Number(userProfile.createdAt) / 1_000_000).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                  : '—',
              },
              { icon: Activity, label: 'Activities Logged', value: activities.length.toString() },
              { icon: Clock, label: 'Total Hours Tracked', value: `${totalHours.toFixed(1)}h` },
              { icon: DollarSign, label: 'Total Earnings', value: `₹${totalEarnings.toLocaleString('en-IN')}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs text-slate-500 font-medium">{label}</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Data & Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            onClick={handleExportData}
            className="w-full justify-start gap-2 border-slate-200"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            Export My Data (JSON)
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account, all habits, and all activities. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
