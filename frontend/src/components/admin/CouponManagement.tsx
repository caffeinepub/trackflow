import React, { useState } from 'react';
import { Plus, Trash2, Tag, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useListCoupons, useCreateCoupon, useDeleteCoupon } from '@/hooks/useQueries';

function formatDate(ts: bigint | undefined | null): string {
  if (!ts) return 'Never';
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function CouponManagement() {
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [formError, setFormError] = useState('');

  const { data: coupons, isLoading, isError } = useListCoupons();
  const createCoupon = useCreateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!code.trim()) return setFormError('Coupon code is required.');
    const discountNum = parseInt(discount, 10);
    if (isNaN(discountNum) || discountNum < 1 || discountNum > 100)
      return setFormError('Discount must be between 1 and 100.');
    const usageLimitNum = parseInt(usageLimit, 10);
    if (isNaN(usageLimitNum) || usageLimitNum < 1)
      return setFormError('Usage limit must be at least 1.');

    let expiresAtNs: bigint | null = null;
    if (expiresAt) {
      const ms = new Date(expiresAt).getTime();
      if (isNaN(ms)) return setFormError('Invalid expiry date.');
      expiresAtNs = BigInt(ms) * 1_000_000n;
    }

    try {
      await createCoupon.mutateAsync({
        code: code.trim().toUpperCase(),
        discountPercent: BigInt(discountNum),
        usageLimit: BigInt(usageLimitNum),
        expiresAt: expiresAtNs,
      });
      setCode('');
      setDiscount('');
      setUsageLimit('');
      setExpiresAt('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
    }
  };

  const handleDelete = async (couponCode: string) => {
    try {
      await deleteCoupon.mutateAsync(couponCode);
    } catch (err) {
      // Error is handled silently; the list will not update if deletion fails
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Coupon Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Coupon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="coupon-code">Code</Label>
              <Input
                id="coupon-code"
                placeholder="e.g. SAVE20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-discount">Discount %</Label>
              <Input
                id="coupon-discount"
                type="number"
                placeholder="e.g. 20"
                min={1}
                max={100}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-limit">Usage Limit</Label>
              <Input
                id="coupon-limit"
                type="number"
                placeholder="e.g. 100"
                min={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-expiry">Expiry Date (optional)</Label>
              <Input
                id="coupon-expiry"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            {formError && (
              <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" disabled={createCoupon.isPending} className="gap-2">
                {createCoupon.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Coupon
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Active Coupons
            <Badge variant="secondary" className="ml-1">
              {(coupons ?? []).length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading coupons…</div>
          ) : isError ? (
            <div className="py-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="font-medium text-destructive">Unable to load coupons.</p>
              </div>
            </div>
          ) : (coupons ?? []).length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
              <Tag className="h-8 w-8 opacity-40" />
              <p>No coupons yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(coupons ?? []).map((coupon) => (
                    <TableRow key={String(coupon.id)}>
                      <TableCell className="font-mono font-semibold">{coupon.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{Number(coupon.discountPercent)}% off</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {Number(coupon.usedCount)} / {Number(coupon.usageLimit)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(coupon.expiresAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(coupon.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 gap-1 text-xs"
                          onClick={() => handleDelete(coupon.code)}
                          disabled={deleteCoupon.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
