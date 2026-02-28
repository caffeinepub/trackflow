import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Activity, Habit, UserProfile, PaymentRequest, Coupon, PlatformStats } from '../backend';
import { HabitGoal, Plan, PlanCycle } from '../backend';

// ── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
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

export function useGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllUsers();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetUserPlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, plan, planExpiry }: { user: string; plan: Plan; planExpiry: bigint | null }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.setUserPlan(Principal.fromText(user), plan, planExpiry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
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

// ── Admin ────────────────────────────────────────────────────────────────────

export function useIsAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<boolean>({
    queryKey: ['isAdmin', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
    isAdmin: query.data === true,
  };
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
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useGetPlatformStats() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PlatformStats>({
    queryKey: ['platformStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPlatformStats();
    },
    enabled: !!actor && !actorFetching,
  });
}

// ── Habits ───────────────────────────────────────────────────────────────────

export function useGetHabits(userId?: string, goalType?: HabitGoal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Habit[]>({
    queryKey: ['habits', userId, goalType],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!userId) return [];
      const { Principal } = await import('@dfinity/principal');
      return actor.getHabits(Principal.fromText(userId), goalType ?? null);
    },
    enabled: !!actor && !actorFetching && !!userId,
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
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Activity[]>({
    queryKey: ['activities', userId, habitId?.toString(), isProductive],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!userId) return [];
      const { Principal } = await import('@dfinity/principal');
      return actor.getActivities(Principal.fromText(userId), habitId ?? null, isProductive ?? null);
    },
    enabled: !!actor && !actorFetching && !!userId,
  });
}

export function useLogActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      customName,
      startTime,
      endTime,
      duration,
      isProductive,
      earnings,
      notes,
      date,
    }: {
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
      return actor.logActivity(habitId, customName, startTime, endTime, duration, isProductive, earnings, notes, date);
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
    mutationFn: async ({
      activityId,
      habitId,
      customName,
      startTime,
      endTime,
      duration,
      isProductive,
      earnings,
      notes,
      date,
    }: {
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
      return actor.updateActivity(activityId, habitId, customName, startTime, endTime, duration, isProductive, earnings, notes, date);
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

  return useQuery<PaymentRequest[]>({
    queryKey: ['myPaymentRequests'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMyPaymentRequests();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetAllPaymentRequests() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PaymentRequest[]>({
    queryKey: ['allPaymentRequests'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllPaymentRequests();
    },
    enabled: !!actor && !actorFetching,
  });
}

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
      queryClient.invalidateQueries({ queryKey: ['allPaymentRequests'] });
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

export function useListCoupons() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Coupon[]>({
    queryKey: ['coupons'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listCoupons();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCoupon() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCoupon(code);
    },
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

// ── Approval ─────────────────────────────────────────────────────────────────

export function useIsCallerApproved() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<boolean>({
    queryKey: ['isCallerApproved', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerApproved();
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
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listApprovals();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, status }: { user: string; status: import('../backend').ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.setApproval(Principal.fromText(user), status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}
