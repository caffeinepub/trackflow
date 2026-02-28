import { useGetPendingPaymentRequests, useApprovePaymentRequest, useRejectPaymentRequest, useListUsers } from '../../hooks/useQueries';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  premium: 'Premium',
};

const CYCLE_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function PaymentsQueue() {
  const { data: requests = [], isLoading } = useGetPendingPaymentRequests();
  const { data: users = [] } = useListUsers();
  const approve = useApprovePaymentRequest();
  const reject = useRejectPaymentRequest();

  const getUserName = (principalStr: string) => {
    const user = users.find(u => u.principal.toString() === principalStr);
    return user?.name || principalStr.slice(0, 12) + '...';
  };

  const handleApprove = async (id: bigint) => {
    if (!confirm('Approve this payment and activate the user\'s plan?')) return;
    try {
      await approve.mutateAsync(id);
      toast.success('Payment approved! User plan activated.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve payment');
    }
  };

  const handleReject = async (id: bigint) => {
    if (!confirm('Reject this payment request?')) return;
    try {
      await reject.mutateAsync(id);
      toast.success('Payment rejected.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject payment');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No pending payment requests</p>
          <p className="text-slate-300 text-sm mt-1">All payments have been processed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map(req => (
        <Card key={String(req.id)} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800 text-sm">
                    {getUserName(req.userId.toString())}
                  </span>
                  <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs">
                    {PLAN_LABELS[req.plan as string] || req.plan}
                  </Badge>
                  {req.cycle && (
                    <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 border-0">
                      {CYCLE_LABELS[req.cycle as string] || req.cycle}
                    </Badge>
                  )}
                  {req.couponCode && (
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                      Coupon: {req.couponCode}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>TXN: <span className="font-mono font-medium text-slate-700">{req.transactionId}</span></span>
                  <span>·</span>
                  <span>{formatDate(req.submittedAt)}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleApprove(req.id)}
                  disabled={approve.isPending || reject.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                >
                  {approve.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(req.id)}
                  disabled={approve.isPending || reject.isPending}
                  className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                >
                  {reject.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
