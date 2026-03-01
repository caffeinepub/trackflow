import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  useGetAllPaymentRequests,
  useApprovePaymentRequest,
  useRejectPaymentRequest,
} from '@/hooks/useQueries';

function formatDate(ts: bigint): string {
  try {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

const planLabels: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  premium: 'Premium',
};

const cycleLabels: Record<string, string> = {
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function PaymentsQueue() {
  const { data: requests, isLoading, isError, error, refetch } = useGetAllPaymentRequests();
  const approve = useApprovePaymentRequest();
  const reject = useRejectPaymentRequest();

  const [actionError, setActionError] = React.useState<string>('');

  const handleApprove = async (id: bigint) => {
    setActionError('');
    try {
      await approve.mutateAsync(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg.includes('Unauthorized') ? 'Admin privileges required to approve payments.' : `Failed to approve: ${msg}`);
    }
  };

  const handleReject = async (id: bigint) => {
    setActionError('');
    try {
      await reject.mutateAsync(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg.includes('Unauthorized') ? 'Admin privileges required to reject payments.' : `Failed to reject: ${msg}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading payment requests…</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    const errMsg = error instanceof Error ? error.message : String(error ?? '');
    const isUnauthorized = errMsg.toLowerCase().includes('unauthorized') || errMsg.toLowerCase().includes('admin');
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="font-medium text-destructive">
              {isUnauthorized
                ? 'Admin privileges required to view payment requests.'
                : 'Unable to load payment requests.'}
            </p>
            {!isUnauthorized && (
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const allRequests = requests ?? [];
  const pending = allRequests.filter((r) => String(r.status) === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Payments
          <Badge variant="secondary" className="ml-1">
            {pending.length}
          </Badge>
        </CardTitle>
        {actionError && (
          <div className="flex items-center gap-2 text-sm text-destructive mt-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {actionError}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {pending.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-8 w-8 opacity-40" />
            <p>No pending payment requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Coupon</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((req) => {
                  const reqId = req.id;
                  const isApprovingThis = approve.isPending;
                  const isRejectingThis = reject.isPending;
                  const isBusy = isApprovingThis || isRejectingThis;

                  return (
                    <TableRow key={String(req.id)}>
                      <TableCell className="font-mono text-xs max-w-[120px] truncate">
                        {req.userId.toString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {planLabels[String(req.plan)] ?? String(req.plan)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {req.cycle ? cycleLabels[String(req.cycle)] ?? String(req.cycle) : '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{req.transactionId}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {req.couponCode ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(req.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 gap-1 text-xs"
                            onClick={() => handleApprove(reqId)}
                            disabled={isBusy}
                          >
                            {approve.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 gap-1 text-xs"
                            onClick={() => handleReject(reqId)}
                            disabled={isBusy}
                          >
                            {reject.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            Reject
                          </Button>
                        </div>
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
