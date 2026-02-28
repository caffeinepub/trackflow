import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import {
  UserProfile,
  Habit,
  Activity,
  PaymentRequest,
  Coupon,
  HabitGoal,
  Plan,
  PlanCycle,
  PlatformStats,
  UserApprovalInfo,
  ApprovalStatus,
  UserRole,
} from '../backend';
import { Principal } from '@dfinity/principal';

// ── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useListUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['listUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetUserPlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, plan, planExpiry }: { user: Principal; plan: Plan; planExpiry: bigint | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setUserPlan(user, plan, planExpiry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listUsers'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useDeleteAccount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAccount();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// ── Habits ───────────────────────────────────────────────────────────────────

export function useGetHabits(userId?: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  const principalStr = userId || identity?.getPrincipal().toString();

  return useQuery<Habit[]>({
    queryKey: ['habits', principalStr],
    queryFn: async () => {
      if (!actor || !principalStr) return [];
      const principal = Principal.fromText(principalStr);
      return actor.getHabits(principal, null);
    },
    enabled: !!actor && !isFetching && !!principalStr,
  });
}

export function useCreateHabit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      goalType,
      goalValue,
      color,
    }: {
      name: string;
      goalType: HabitGoal;
      goalValue: bigint;
      color: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createHabit(name, goalType, goalValue, color);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useUpdateHabit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      name,
      goalType,
      goalValue,
      color,
    }: {
      habitId: bigint;
      name: string;
      goalType: HabitGoal;
      goalValue: bigint;
      color: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateHabit(habitId, name, goalType, goalValue, color);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useDeleteHabit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteHabit(habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

// ── Activities ───────────────────────────────────────────────────────────────

export function useGetActivities(userId?: string, habitId?: bigint | null, isProductive?: boolean | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  const principalStr = userId || identity?.getPrincipal().toString();
  // Convert bigint to string for query key to avoid BigInt serialization issues
  const habitIdKey = habitId != null ? habitId.toString() : null;

  return useQuery<Activity[]>({
    queryKey: ['activities', principalStr, habitIdKey, isProductive],
    queryFn: async () => {
      if (!actor || !principalStr) return [];
      const principal = Principal.fromText(principalStr);
      return actor.getActivities(principal, habitId ?? null, isProductive ?? null);
    },
    enabled: !!actor && !isFetching && !!principalStr,
  });
}

export function useLogActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      habitId: bigint;
      customName: string;
      startTime: bigint;
      endTime: bigint;
      duration: bigint;
      isProductive: boolean;
      earnings: bigint;
      notes: string;
      date: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.logActivity(
        params.habitId,
        params.customName,
        params.startTime,
        params.endTime,
        params.duration,
        params.isProductive,
        params.earnings,
        params.notes,
        params.date
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpdateActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      activityId: bigint;
      habitId: bigint;
      customName: string;
      startTime: bigint;
      endTime: bigint;
      duration: bigint;
      isProductive: boolean;
      earnings: bigint;
      notes: string;
      date: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateActivity(
        params.activityId,
        params.habitId,
        params.customName,
        params.startTime,
        params.endTime,
        params.duration,
        params.isProductive,
        params.earnings,
        params.notes,
        params.date
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useDeleteActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteActivity(activityId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

// ── Payment Requests ─────────────────────────────────────────────────────────

export function useSubmitPaymentRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      plan,
      cycle,
      transactionId,
      couponCode,
    }: {
      plan: Plan;
      cycle: PlanCycle | null;
      transactionId: string;
      couponCode: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitPaymentRequest(plan, cycle, transactionId, couponCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPaymentRequests'] });
    },
  });
}

export function useGetMyPaymentRequests() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PaymentRequest[]>({
    queryKey: ['myPaymentRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyPaymentRequests();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetPendingPaymentRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<PaymentRequest[]>({
    queryKey: ['pendingPaymentRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingPaymentRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllPaymentRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<PaymentRequest[]>({
    queryKey: ['allPaymentRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPaymentRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useApprovePaymentRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approvePaymentRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingPaymentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allPaymentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['listUsers'] });
    },
  });
}

export function useRejectPaymentRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectPaymentRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingPaymentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allPaymentRequests'] });
    },
  });
}

// ── Coupons ──────────────────────────────────────────────────────────────────

export function useGetCoupon() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCoupon(code);
    },
  });
}

export function useListCoupons() {
  const { actor, isFetching } = useActor();

  return useQuery<Coupon[]>({
    queryKey: ['coupons'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCoupons();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCoupon() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      code,
      discountPercent,
      usageLimit,
      expiresAt,
    }: {
      code: string;
      discountPercent: bigint;
      usageLimit: bigint;
      expiresAt: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCoupon(code, discountPercent, usageLimit, expiresAt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useDeleteCoupon() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCoupon(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export function useGetPlatformStats() {
  const { actor, isFetching } = useActor();

  return useQuery<PlatformStats>({
    queryKey: ['platformStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPlatformStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useIsCallerApproved() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isCallerApproved'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isCallerApproved'] });
    },
  });
}

export function useListApprovals() {
  const { actor, isFetching } = useActor();

  return useQuery<UserApprovalInfo[]>({
    queryKey: ['listApprovals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, status }: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setApproval(user, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['listUsers'] });
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listUsers'] });
    },
  });
}
