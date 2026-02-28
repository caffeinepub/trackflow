import { Crown, Star, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UpgradePlanModalProps {
  plan: string;
  limit: number;
  onClose: () => void;
}

export default function UpgradePlanModal({ plan, limit, onClose }: UpgradePlanModalProps) {
  const isOnFree = plan === 'free';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Habit Limit Reached
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm font-medium">
              You've reached the {limit}-habit limit for the{' '}
              <span className="capitalize font-bold">{plan}</span> plan.
            </p>
          </div>

          <p className="text-slate-600 text-sm">
            Upgrade your plan to track more habits and unlock powerful analytics.
          </p>

          <div className="space-y-3">
            {isOnFree && (
              <div className="flex items-start gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <Star className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800 text-sm">Starter — ₹149/month</p>
                  <p className="text-slate-500 text-xs mt-0.5">Up to 10 habits + analytics charts</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
              <Crown className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800 text-sm">Premium — ₹399/month</p>
                <p className="text-slate-500 text-xs mt-0.5">Unlimited habits + full analytics</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Maybe Later
          </Button>
          <Button
            onClick={() => { window.location.hash = '#/pricing'; onClose(); }}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            View Plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
