import { useState } from 'react';
import { useListUsers, useSetUserPlan } from '../../hooks/useQueries';
import { Plan } from '../../backend';
import { Principal } from '@dfinity/principal';
import { Search, Copy, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-slate-100 text-slate-600',
  starter: 'bg-indigo-100 text-indigo-700',
  premium: 'bg-purple-100 text-purple-700',
};

function formatDate(ts: bigint | undefined): string {
  if (!ts) return '—';
  return new Date(Number(ts) / 1_000_000).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function UsersTable() {
  const { data: users = [], isLoading } = useListUsers();
  const setUserPlan = useSetUserPlan();
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.principal.toString().includes(search)
  );

  const handleCopyPrincipal = (principal: string) => {
    navigator.clipboard.writeText(principal);
    setCopiedId(principal);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Principal copied!');
  };

  const handleChangePlan = async (userPrincipal: string, plan: string) => {
    if (!confirm(`Change this user's plan to ${plan}?`)) return;
    try {
      await setUserPlan.mutateAsync({
        user: Principal.fromText(userPrincipal),
        plan: plan as Plan,
        planExpiry: null,
      });
      toast.success(`Plan updated to ${plan}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update plan');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name, email, or principal..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">No users found</p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Principal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Change Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(user => {
                  const principalStr = user.principal.toString();
                  return (
                    <tr key={principalStr} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-slate-500">
                            {principalStr.slice(0, 10)}...
                          </span>
                          <button
                            onClick={() => handleCopyPrincipal(principalStr)}
                            className="text-slate-300 hover:text-slate-500 transition-colors"
                          >
                            {copiedId === principalStr ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{user.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${PLAN_COLORS[user.plan as string] || 'bg-slate-100 text-slate-600'}`}>
                          {String(user.plan).charAt(0).toUpperCase() + String(user.plan).slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Select
                          value={user.plan as string}
                          onValueChange={v => handleChangePlan(principalStr, v)}
                        >
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
