import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useRequestApproval } from '../hooks/useQueries';
import { Plan } from '../backend';
import { Check, Zap, Star, Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type PlanId = 'free' | 'starter' | 'premium';

interface PlanConfig {
  id: PlanId;
  name: string;
  icon: React.ElementType;
  price: number | null;
  priceLabel: string;
  period: string;
  description: string;
  color: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  yearlyPrice?: number;
  yearlyLabel?: string;
}

const plans: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    icon: Zap,
    price: null,
    priceLabel: '₹0',
    period: 'forever',
    description: 'Perfect for getting started',
    color: 'from-slate-500 to-slate-600',
    features: [
      'Up to 3 habits',
      'Basic checkbox analytics',
      'Activity logging',
      'Daily & weekly goals',
    ],
    cta: 'Start for Free',
    highlighted: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    icon: Star,
    price: 149,
    priceLabel: '₹149',
    period: '/month',
    description: 'For serious habit builders',
    color: 'from-indigo-500 to-indigo-600',
    features: [
      'Up to 10 habits',
      'Normal analytics with charts',
      'Earnings tracking',
      'Activity timeline',
      'CSV export',
      'Progress bars',
    ],
    cta: 'Get Starter',
    highlighted: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: Crown,
    price: 399,
    priceLabel: '₹399',
    period: '/month',
    yearlyPrice: 3199,
    yearlyLabel: '₹3,199/year',
    description: 'Unlimited productivity power',
    color: 'from-purple-500 to-purple-600',
    features: [
      'Unlimited habits',
      'Full advanced analytics',
      'Priority support',
      'All Starter features',
      'Bulk operations',
      'Data export (JSON/CSV)',
    ],
    cta: 'Go Premium',
    highlighted: false,
  },
];

export default function PricingPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const requestApproval = useRequestApproval();

  const [showSetup, setShowSetup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pendingPlan, setPendingPlan] = useState<{ plan: PlanId; yearly?: boolean } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const showProfileSetup = !!identity && !profileLoading && isFetched && userProfile === null;

  useEffect(() => {
    if (showProfileSetup) {
      setShowSetup(true);
    }
  }, [showProfileSetup]);

  // If user already has a paid plan, redirect to dashboard
  useEffect(() => {
    if (userProfile && (userProfile.plan === 'starter' || userProfile.plan === 'premium')) {
      window.location.hash = '#/dashboard';
    }
  }, [userProfile]);

  const handleProfileSave = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Please enter your name and email');
      return;
    }
    setSavingProfile(true);
    try {
      const now = BigInt(Date.now()) * BigInt(1_000_000);
      await saveProfile.mutateAsync({
        principal: identity!.getPrincipal(),
        name: name.trim(),
        email: email.trim(),
        phone: '',
        plan: Plan.free,
        planExpiry: undefined,
        createdAt: now,
        lastLogin: now,
      });
      await requestApproval.mutateAsync();
      setShowSetup(false);
      toast.success('Profile created! Choose your plan below.');
      if (pendingPlan) {
        handlePlanSelect(pendingPlan.plan, pendingPlan.yearly);
        setPendingPlan(null);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePlanSelect = (planId: PlanId, yearly?: boolean) => {
    if (!isFetched) return;

    if (!userProfile) {
      setPendingPlan({ plan: planId, yearly });
      setShowSetup(true);
      return;
    }

    if (planId === 'free') {
      window.location.hash = '#/dashboard';
      return;
    }

    const params = new URLSearchParams({ plan: planId, cycle: yearly ? 'yearly' : 'monthly' });
    window.location.hash = `#/payment?${params.toString()}`;
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-16 px-4">
      {/* Profile Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to TrackFlow! 👋</DialogTitle>
            <DialogDescription>
              Let's set up your profile before you get started.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="setup-name">Your Name</Label>
              <Input
                id="setup-name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="setup-email">Email Address</Label>
              <Input
                id="setup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleProfileSave}
              disabled={savingProfile}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {savingProfile ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </span>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Choose Your Plan
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">
            Simple, Transparent Pricing
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Start free, upgrade when you're ready. All plans include core tracking features.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all hover:shadow-xl ${
                  plan.highlighted
                    ? 'border-2 border-indigo-500 shadow-lg shadow-indigo-100 scale-105'
                    : 'border border-slate-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white text-xs font-bold text-center py-1.5 tracking-wide">
                    MOST POPULAR
                  </div>
                )}
                <CardHeader className={plan.highlighted ? 'pt-8' : 'pt-6'}>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-500">{plan.description}</CardDescription>
                  <div className="mt-3">
                    <span className="text-4xl font-extrabold text-slate-900">{plan.priceLabel}</span>
                    <span className="text-slate-500 text-sm ml-1">{plan.period}</span>
                    {plan.yearlyLabel && plan.price && plan.yearlyPrice && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">
                        or {plan.yearlyLabel} (save ₹{plan.price * 12 - plan.yearlyPrice})
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.id === 'free' ? (
                    <Button
                      onClick={() => handlePlanSelect('free')}
                      variant="outline"
                      className="w-full mt-4 border-slate-300 hover:border-indigo-400 hover:text-indigo-600"
                    >
                      {plan.cta}
                    </Button>
                  ) : (
                    <div className="space-y-2 mt-4">
                      <Button
                        onClick={() => handlePlanSelect(plan.id, false)}
                        className={`w-full ${plan.highlighted ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                      >
                        {plan.cta} — Monthly
                      </Button>
                      {plan.yearlyPrice && plan.price && (
                        <Button
                          onClick={() => handlePlanSelect(plan.id, true)}
                          variant="outline"
                          className={`w-full ${plan.highlighted ? 'border-indigo-300 text-indigo-600 hover:bg-indigo-50' : 'border-purple-300 text-purple-600 hover:bg-purple-50'}`}
                        >
                          {plan.cta} — Yearly (Save ₹{plan.price * 12 - plan.yearlyPrice})
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-slate-400 text-sm mt-10">
          Payments are verified manually within 24 hours. Your plan will be activated after verification.
        </p>
      </div>
    </div>
  );
}
