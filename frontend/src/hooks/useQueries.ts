import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Activity, Habit, HabitGoal, Plan, UserProfile, UserStreaks } from '../backend';
import { Principal } from '@dfinity/principal';

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
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useSetUserPlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user,
      plan,
      planExpiry,
    }: {
      user: Principal;
      plan: Plan;
      planExpiry: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setUserPlan(user, plan, planExpiry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
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

// ── Habits ────────────────────────────────────────────────────────────────────

export function useGetHabits() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Habit[]>({
    queryKey: ['habits', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      const principal = identity.getPrincipal();
      return actor.getHabits(principal, null);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useCreateHabit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

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
      queryClient.invalidateQueries({ queryKey: ['habits', identity?.getPrincipal().toString()] });
    },
  });
}

export function useUpdateHabit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

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
      queryClient.invalidateQueries({ queryKey: ['habits', identity?.getPrincipal().toString()] });
    },
  });
}

export function useDeleteHabit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (habitId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteHabit(habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', identity?.getPrincipal().toString()] });
      queryClient.invalidateQueries({ queryKey: ['activities', identity?.getPrincipal().toString()] });
    },
  });
}

// ── Activities ────────────────────────────────────────────────────────────────

export function useGetActivities() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Activity[]>({
    queryKey: ['activities', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      const principal = identity.getPrincipal();
      return actor.getActivities(principal, null, null);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useLogActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

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
      return actor.logActivity(
        habitId,
        customName,
        startTime,
        endTime,
        duration,
        isProductive,
        earnings,
        notes,
        date,
      );
    },
    onSuccess: () => {
      const userId = identity?.getPrincipal().toString();
      queryClient.invalidateQueries({ queryKey: ['activities', userId] });
      queryClient.invalidateQueries({ queryKey: ['habits', userId] });
      queryClient.invalidateQueries({ queryKey: ['userStreaks', userId] });
    },
  });
}

export function useUpdateActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

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
      return actor.updateActivity(
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
      );
    },
    onSuccess: () => {
      const userId = identity?.getPrincipal().toString();
      queryClient.invalidateQueries({ queryKey: ['activities', userId] });
      queryClient.invalidateQueries({ queryKey: ['habits', userId] });
      queryClient.invalidateQueries({ queryKey: ['userStreaks', userId] });
    },
  });
}

export function useDeleteActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (activityId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteActivity(activityId);
    },
    onSuccess: () => {
      const userId = identity?.getPrincipal().toString();
      queryClient.invalidateQueries({ queryKey: ['activities', userId] });
      queryClient.invalidateQueries({ queryKey: ['habits', userId] });
      queryClient.invalidateQueries({ queryKey: ['userStreaks', userId] });
    },
  });
}

// ── Streaks ───────────────────────────────────────────────────────────────────

export function useGetUserStreaks() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserStreaks | null>({
    queryKey: ['userStreaks', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      const principal = identity.getPrincipal();
      return actor.getUserStreaks(principal);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// ── Payment Requests ──────────────────────────────────────────────────────────

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
      cycle: string | null;
      transactionId: string;
      couponCode: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitPaymentRequest(plan as Plan, cycle as any, transactionId, couponCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPaymentRequests'] });
    },
  });
}

export function useGetMyPaymentRequests() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
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

  return useQuery({
    queryKey: ['pendingPaymentRequests'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPendingPaymentRequests();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useGetAllPaymentRequests() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['allPaymentRequests'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllPaymentRequests();
    },
    enabled: !!actor && !isFetching,
    retry: false,
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
      queryClient.invalidateQueries({ queryKey: ['pendingPaymentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allPaymentRequests'] });
    },
  });
}

// ── Coupons ───────────────────────────────────────────────────────────────────

export function useListCoupons() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listCoupons();
    },
    enabled: !!actor && !isFetching,
    retry: false,
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

export function useGetCoupon() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCoupon(code);
    },
  });
}

// ── Platform Stats ────────────────────────────────────────────────────────────

export function useGetPlatformStats() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPlatformStats();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

// ── Approvals ─────────────────────────────────────────────────────────────────

export function useListApprovals() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
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
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}
