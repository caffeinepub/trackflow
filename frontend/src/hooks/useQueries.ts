import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Habit, Activity, UserProfile, HabitGoal, Plan, PlanCycle, PaymentRequest, Coupon, PlatformStats, UserApprovalInfo, ApprovalStatus, UserRole } from '../backend';
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
    isFetched: !!actor && !!identity && query.isFetched,
  };
}

export function useGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserProfile[]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
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

export function useGetHabits(goalType?: HabitGoal) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Habit[]>({
    queryKey: ['habits', goalType ?? null],
    queryFn: async () => {
      if (!actor || !identity) return [];
      const principal = identity.getPrincipal();
      return actor.getHabits(principal, goalType ?? null);
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });
}

export function useCreateHabit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string; goalType: HabitGoal; goalValue: bigint; color: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createHabit(params.name, params.goalType, params.goalValue, params.color);
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
    mutationFn: async (params: { habitId: bigint; name: string; goalType: HabitGoal; goalValue: bigint; color: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateHabit(params.habitId, params.name, params.goalType, params.goalValue, params.color);
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
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

// ── Activities ───────────────────────────────────────────────────────────────

export function useGetActivities(habitId?: bigint, isProductive?: boolean) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  // Convert bigint to string for query key to satisfy no-bigint-in-query-keys rule
  const habitIdKey = habitId != null ? habitId.toString() : null;

  return useQuery<Activity[]>({
    queryKey: ['activities', habitIdKey, isProductive ?? null],
    queryFn: async () => {
      if (!actor || !identity) return [];
      const principal = identity.getPrincipal();
      return actor.getActivities(principal, habitId ?? null, isProductive ?? null);
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
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
        params.date,
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
        params.date,
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

export function useGetMyPaymentRequests() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PaymentRequest[]>({
    queryKey: ['myPaymentRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyPaymentRequests();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetAllPaymentRequests() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PaymentRequest[]>({
    queryKey: ['allPaymentRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPaymentRequests();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useSubmitPaymentRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { plan: Plan; cycle: PlanCycle | null; transactionId: string; couponCode: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitPaymentRequest(params.plan, params.cycle, params.transactionId, params.couponCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPaymentRequests'] });
    },
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
      queryClient.invalidateQueries({ queryKey: ['allPaymentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
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
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Coupon[]>({
    queryKey: ['coupons'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCoupons();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useCreateCoupon() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { code: string; discountPercent: bigint; usageLimit: bigint; expiresAt: bigint | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCoupon(params.code, params.discountPercent, params.usageLimit, params.expiresAt);
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

// ── Platform Stats ───────────────────────────────────────────────────────────

export function useGetPlatformStats() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PlatformStats>({
    queryKey: ['platformStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPlatformStats();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

// ── Admin / Roles ────────────────────────────────────────────────────────────

export function useSetUserPlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { user: Principal; plan: Plan; planExpiry: bigint | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setUserPlan(params.user, params.plan, params.planExpiry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignRole(params.user, params.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useListApprovals() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserApprovalInfo[]>({
    queryKey: ['approvals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setApproval(params.user, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useIsCallerApproved() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isCallerApproved'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
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

export function useSelfPromoteAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.selfPromoteAdmin();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerApproved'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}
