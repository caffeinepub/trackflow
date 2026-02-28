import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Zap, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Plan } from '../backend';

const plans = [
  {
    id: 'free' as const,
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    icon: <Zap className="w-5 h-5" />,
    description: 'Perfect for getting started',
    features: [
      'Up to 3 habits',
      'Basic activity tracking',
      'Daily & weekly goals',
      'Activity timeline',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    id: 'starter' as const,
    name: 'Starter',
    price: { monthly: 199, yearly: 1999 },
    icon: <Zap className="w-5 h-5 text-primary" />,
    description: 'For serious habit builders',
    features: [
      'Up to 10 habits',
      'Advanced analytics',
      'Earnings tracking',
      'Coupon discounts',
      'Priority support',
    ],
    cta: 'Get Starter',
    highlighted: true,
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: { monthly: 499, yearly: 4999 },
    icon: <Crown className="w-5 h-5 text-yellow-500" />,
    description: 'Unlimited everything',
    features: [
      'Unlimited habits',
      'Full analytics suite',
      'Earnings & productivity reports',
      'Coupon discounts',
      'Priority support',
      'Early access to new features',
    ],
    cta: 'Go Premium',
    highlighted: false,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { identity, login, loginStatus } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const isAuthenticated = !!identity;
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const showProfileModal = isAuthenticated && isFetched && profile === null;

  const handlePlanSelect = (planId: string) => {
    if (!isAuthenticated) {
      // Redirect to login
      navigate({ to: '/login' });
      return;
    }

    if (showProfileModal || (isAuthenticated && isFetched && profile === null)) {
      // Need to set up profile first
      setPendingPlan(planId);
      setShowProfileSetup(true);
      return;
    }

    if (planId === 'free') {
      toast.success("You're on the Free plan!");
      return;
    }

    navigate({ to: '/payment', search: { plan: planId, cycle: billingCycle } });
  };

  const handleProfileSave = async () => {
    if (!newName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!identity) return;

    try {
      await saveProfile.mutateAsync({
        principal: identity.getPrincipal(),
        name: newName.trim(),
        email: newEmail.trim(),
        phone: '',
        plan: Plan.free,
        planExpiry: undefined,
        createdAt: BigInt(Date.now()) * 1_000_000n,
        lastLogin: BigInt(Date.now()) * 1_000_000n,
      });
      toast.success('Profile created!');
      setShowProfileSetup(false);

      if (pendingPlan && pendingPlan !== 'free') {
        navigate({ to: '/payment', search: { plan: pendingPlan, cycle: billingCycle } });
      }
      setPendingPlan(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Choose the plan that fits your productivity goals. Upgrade or downgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">Save 20%</Badge>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = plan.price[billingCycle];
            const isCurrentPlan = profile?.plan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.highlighted
                    ? 'border-primary shadow-lg ring-2 ring-primary'
                    : 'border-border'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3">Most Popular</Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {plan.icon}
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-3">
                    {price === 0 ? (
                      <span className="text-3xl font-bold text-foreground">Free</span>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-foreground">₹{price}</span>
                        <span className="text-muted-foreground text-sm">
                          /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-4">
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full mt-auto"
                    variant={plan.highlighted ? 'default' : 'outline'}
                    disabled={isCurrentPlan || profileLoading || loginStatus === 'logging-in'}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    {loginStatus === 'logging-in' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Logging in...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : !isAuthenticated ? (
                      'Login to Get Started'
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ or note */}
        <div className="text-center text-sm text-muted-foreground">
          <p>All plans include a 7-day free trial. No credit card required for Free plan.</p>
          <p className="mt-1">
            Payments are processed via UPI. Contact support for any billing issues.
          </p>
        </div>
      </div>

      {/* Profile Setup Dialog */}
      <Dialog open={showProfileSetup} onOpenChange={(o) => !o && setShowProfileSetup(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Up Your Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="profileName">Your Name</Label>
              <Input
                id="profileName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter your name"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="profileEmail">Email (optional)</Label>
              <Input
                id="profileEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileSetup(false)}>
              Cancel
            </Button>
            <Button onClick={handleProfileSave} disabled={saveProfile.isPending}>
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
