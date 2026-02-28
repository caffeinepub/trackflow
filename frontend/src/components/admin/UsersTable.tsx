import React, { useState } from 'react';
import { Search, Copy, Users, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetAllUsers, useSetUserPlan } from '@/hooks/useQueries';
import { Plan } from '@/backend';
import { Principal } from '@dfinity/principal';

const planColors: Record<string, string> = {
  free: 'secondary',
  starter: 'default',
  premium: 'default',
};

const planLabels: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  premium: 'Premium',
};

function formatDate(ts: bigint | undefined | null): string {
  if (!ts) return '—';
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function UsersTable() {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<Record<string, Plan>>({});
  const [savingPrincipal, setSavingPrincipal] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<Record<string, string>>({});

  const { data: users, isLoading, isError, error } = useGetAllUsers();
  const setUserPlan = useSetUserPlan();

  const handleCopy = (principal: string) => {
    navigator.clipboard.writeText(principal);
    setCopiedId(principal);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handlePlanChange = (principal: string, plan: Plan) => {
    setPendingPlan((prev) => ({ ...prev, [principal]: plan }));
    setSaveError((prev) => {
      const next = { ...prev };
      delete next[principal];
      return next;
    });
  };

  const handlePlanSave = async (principal: string, currentPlan: Plan) => {
    const newPlan = pendingPlan[principal] ?? currentPlan;
    setSavingPrincipal(principal);
    setSaveError((prev) => {
      const next = { ...prev };
      delete next[principal];
      return next;
    });
    try {
      await setUserPlan.mutateAsync({
        user: Principal.fromText(principal),
        plan: newPlan,
        planExpiry: null,
      });
      setPendingPlan((prev) => {
        const next = { ...prev };
        delete next[principal];
        return next;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveError((prev) => ({ ...prev, [principal]: msg }));
    } finally {
      setSavingPrincipal(null);
    }
  };

  const filtered = (users ?? []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.principal.toString().toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading users…
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    const msg = error instanceof Error ? error.message : String(error);
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="font-medium text-destructive">Failed to load users.</p>
            <p className="text-sm text-muted-foreground">{msg}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          All Users
          <Badge variant="secondary" className="ml-1">
            {filtered.length}
          </Badge>
        </CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
            <Users className="h-8 w-8 opacity-40" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Change Plan</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => {
                  const principalStr = user.principal.toString();
                  const currentPlan = user.plan as unknown as Plan;
                  const selectedPlan = pendingPlan[principalStr] ?? currentPlan;
                  const isDirty = pendingPlan[principalStr] !== undefined;
                  const isSaving = savingPrincipal === principalStr;
                  const rowError = saveError[principalStr];

                  return (
                    <TableRow key={principalStr}>
                      <TableCell className="font-medium">{user.name || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                            {principalStr}
                          </span>
                          <button
                            onClick={() => handleCopy(principalStr)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy principal"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          {copiedId === principalStr && (
                            <span className="text-xs text-green-600">Copied!</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={planColors[String(currentPlan)] as 'default' | 'secondary'}>
                          {planLabels[String(currentPlan)] ?? String(currentPlan)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Select
                              value={String(selectedPlan)}
                              onValueChange={(val) =>
                                handlePlanChange(principalStr, val as Plan)
                              }
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="starter">Starter</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                              </SelectContent>
                            </Select>
                            {isDirty && (
                              <Button
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => handlePlanSave(principalStr, currentPlan)}
                                disabled={isSaving}
                              >
                                {isSaving ? 'Saving…' : 'Save'}
                              </Button>
                            )}
                          </div>
                          {rowError && (
                            <p className="text-xs text-destructive max-w-[200px] truncate" title={rowError}>
                              {rowError.includes('Unauthorized') ? 'Admin role required to change plans.' : rowError}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(user.lastLogin)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
