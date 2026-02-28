import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSubmitPaymentRequest, useGetCoupon } from '../hooks/useQueries';
import { Plan, PlanCycle } from '../backend';
import { Copy, CheckCircle, Tag, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const PLAN_PRICES: Record<string, { monthly: number; yearly?: number }> = {
  starter: { monthly: 149 },
  premium: { monthly: 399, yearly: 3199 },
};

const PLAN_NAMES: Record<string, string> = {
  starter: 'Starter',
  premium: 'Premium',
};

export default function PaymentPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const submitPayment = useSubmitPaymentRequest();
  const getCoupon = useGetCoupon();

  // Parse URL params from hash
  const hashSearch = window.location.hash.includes('?')
    ? window.location.hash.split('?')[1]
    : '';
  const params = new URLSearchParams(hashSearch);
  const planParam = (params.get('plan') || 'starter') as Plan;
  const cycleParam = (params.get('cycle') || 'monthly') as PlanCycle;

  const [transactionId, setTransactionId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const basePrice = PLAN_PRICES[planParam]?.[cycleParam === 'yearly' ? 'yearly' : 'monthly'] || 149;
  const discountAmount = couponApplied ? Math.round(basePrice * couponApplied.discount / 100) : 0;
  const finalPrice = basePrice - discountAmount;

  const UPI_ID = 'yadavmannan007@okicici';

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('UPI ID copied!');
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const coupon = await getCoupon.mutateAsync(couponCode.trim().toUpperCase());
      if (!coupon) {
        toast.error('Invalid coupon code');
        return;
      }
      const now = BigInt(Date.now()) * BigInt(1_000_000);
      if (coupon.expiresAt && coupon.expiresAt < now) {
        toast.error('This coupon has expired');
        return;
      }
      if (coupon.usedCount >= coupon.usageLimit) {
        toast.error('This coupon has reached its usage limit');
        return;
      }
      setCouponApplied({ code: coupon.code, discount: Number(coupon.discountPercent) });
      toast.success(`Coupon applied! ${coupon.discountPercent}% discount`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to validate coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSubmit = async () => {
    if (!transactionId.trim()) {
      toast.error('Please enter your UPI transaction ID');
      return;
    }
    if (transactionId.trim().length < 6) {
      toast.error('Transaction ID seems too short. Please check and try again.');
      return;
    }

    try {
      await submitPayment.mutateAsync({
        plan: planParam,
        cycle: cycleParam,
        transactionId: transactionId.trim(),
        couponCode: couponApplied?.code || null,
      });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit payment request');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center shadow-xl border-0">
          <CardContent className="pt-10 pb-8 px-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Payment Submitted!</h2>
            <p className="text-slate-500 mb-2">
              Your payment request for <strong>{PLAN_NAMES[planParam]}</strong> plan has been received.
            </p>
            <p className="text-slate-500 mb-6 text-sm">
              Our team will verify your UPI transaction and activate your plan within <strong>24 hours</strong>.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-amber-800 text-sm font-medium">Transaction ID Submitted:</p>
              <p className="text-amber-700 text-sm font-mono mt-1">{transactionId}</p>
            </div>
            <Button
              onClick={() => { window.location.hash = '#/dashboard'; }}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => { window.location.hash = '#/pricing'; }}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Plans
        </button>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-xl pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">Complete Payment</CardTitle>
                <p className="text-indigo-200 text-sm mt-1">
                  {PLAN_NAMES[planParam]} Plan — {cycleParam === 'yearly' ? 'Yearly' : 'Monthly'}
                </p>
              </div>
              <Badge className="bg-white/20 text-white border-0 text-lg font-bold px-4 py-2">
                ₹{finalPrice}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* UPI Payment Section */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Pay via UPI
              </h3>

              {/* QR Code */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-48 h-48 bg-white border-2 border-indigo-200 rounded-xl overflow-hidden mb-3">
                  <img
                    src="/assets/generated/upi-qr-placeholder.dim_300x300.png"
                    alt="UPI QR Code"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-slate-500">Scan QR code to pay</p>
              </div>

              {/* UPI ID */}
              <div className="bg-white border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">UPI ID</p>
                  <p className="font-mono font-bold text-indigo-700 text-sm">{UPI_ID}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyUPI}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Amount */}
              <div className="mt-3 bg-white border border-indigo-200 rounded-xl p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Plan Amount</span>
                  <span className="font-medium">₹{basePrice}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-emerald-600">Coupon ({couponApplied.discount}% off)</span>
                    <span className="text-emerald-600 font-medium">-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-slate-100">
                  <span>Total to Pay</span>
                  <span className="text-indigo-700">₹{finalPrice}</span>
                </div>
              </div>
            </div>

            {/* Coupon Code */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Tag className="w-4 h-4" />
                Coupon Code (Optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!couponApplied}
                  className="font-mono uppercase"
                />
                {couponApplied ? (
                  <Button
                    variant="outline"
                    onClick={() => { setCouponApplied(null); setCouponCode(''); }}
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleValidateCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                  >
                    {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </Button>
                )}
              </div>
              {couponApplied && (
                <p className="text-emerald-600 text-xs mt-1.5 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Coupon "{couponApplied.code}" applied — {couponApplied.discount}% off
                </p>
              )}
            </div>

            {/* Transaction ID */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                Enter Transaction ID
              </h3>
              <Label htmlFor="txn-id" className="text-sm text-slate-600 mb-2 block">
                After paying, enter the UPI transaction/reference ID from your payment app
              </Label>
              <Input
                id="txn-id"
                placeholder="e.g. 123456789012"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="font-mono"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitPayment.isPending || !transactionId.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-base font-bold rounded-xl"
            >
              {submitPayment.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Payment for Verification'
              )}
            </Button>

            <p className="text-center text-slate-400 text-xs">
              Your plan will be activated within 24 hours after manual verification.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
