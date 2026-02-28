import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
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
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

const statusColors: Record<string, string> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

export default function PaymentsQueue() {
  const { data: requests, isLoading, isError } = useGetAllPaymentRequests();
  const approve = useApprovePaymentRequest();
  const reject = useRejectPaymentRequest();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading payment requests…
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="font-medium text-destructive">
              Unable to load payment requests.
            </p>
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
                {pending.map((req) => (
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
                          onClick={() => approve.mutate(req.id)}
                          disabled={approve.isPending || reject.isPending}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 gap-1 text-xs"
                          onClick={() => reject.mutate(req.id)}
                          disabled={approve.isPending || reject.isPending}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
