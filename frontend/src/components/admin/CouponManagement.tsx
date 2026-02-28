import { useState } from 'react';
import { useListCoupons, useCreateCoupon, useDeleteCoupon } from '../../hooks/useQueries';
import { Plus, Trash2, Tag, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

function formatDate(ts: bigint | undefined): string {
  if (!ts) return 'No expiry';
  return new Date(Number(ts) / 1_000_000).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function CouponManagement() {
  const { data: coupons = [], isLoading } = useListCoupons();
  const createCoupon = useCreateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('10');
  const [usageLimit, setUsageLimit] = useState('100');
  const [expiresAt, setExpiresAt] = useState('');

  const handleCreate = async () => {
    if (!code.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    const discountNum = parseInt(discount);
    if (!discountNum || discountNum < 1 || discountNum > 100) {
      toast.error('Discount must be between 1 and 100');
      return;
    }
    const limitNum = parseInt(usageLimit);
    if (!limitNum || limitNum < 1) {
      toast.error('Usage limit must be at least 1');
      return;
    }

    // Check uniqueness client-side
    const exists = coupons.some(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (exists) {
      toast.error('A coupon with this code already exists');
      return;
    }

    const expiryTs = expiresAt
      ? BigInt(new Date(expiresAt).getTime()) * BigInt(1_000_000)
      : null;

    try {
      await createCoupon.mutateAsync({
        code: code.trim().toUpperCase(),
        discountPercent: BigInt(discountNum),
        usageLimit: BigInt(limitNum),
        expiresAt: expiryTs,
      });
      toast.success(`Coupon "${code.toUpperCase()}" created!`);
      setCode('');
      setDiscount('10');
      setUsageLimit('100');
      setExpiresAt('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async (couponCode: string) => {
    if (!confirm(`Delete coupon "${couponCode}"?`)) return;
    try {
      await deleteCoupon.mutateAsync(couponCode);
      toast.success('Coupon deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            Create New Coupon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Coupon Code *</Label>
              <Input
                placeholder="e.g. SAVE20"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="font-mono uppercase"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Discount %</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Usage Limit</Label>
              <Input
                type="number"
                min="1"
                value={usageLimit}
                onChange={e => setUsageLimit(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Expires At (optional)</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleCreate}
            disabled={createCoupon.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {createCoupon.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Creating...
              </span>
            ) : (
              'Create Coupon'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing coupons */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            Existing Coupons ({coupons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : coupons.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No coupons created yet.</p>
          ) : (
            <div className="space-y-2">
              {coupons.map(coupon => (
                <div
                  key={String(coupon.id)}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono font-bold text-slate-800 text-sm">{coupon.code}</span>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                      {String(coupon.discountPercent)}% off
                    </Badge>
                    <span className="text-xs text-slate-500">
                      Used: {String(coupon.usedCount)}/{String(coupon.usageLimit)}
                    </span>
                    <span className="text-xs text-slate-400">
                      Expires: {formatDate(coupon.expiresAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(coupon.code)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
