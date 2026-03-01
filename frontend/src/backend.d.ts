import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserStreaks {
    totalActivities: bigint;
    userId: Principal;
    activeStreak: bigint;
    habits: Array<HabitStreak>;
    longestStreak: bigint;
}
export interface StreakDay {
    date: Time;
    habitId: bigint;
}
export type Time = bigint;
export interface HabitStreak {
    active: boolean;
    totalEntries: bigint;
    habitId: bigint;
    streakCount: bigint;
}
export interface Coupon {
    id: bigint;
    expiresAt?: Time;
    code: string;
    createdAt: Time;
    usedCount: bigint;
    discountPercent: bigint;
    usageLimit: bigint;
}
export interface Habit {
    id: bigint;
    goalType: HabitGoal;
    userId: Principal;
    name: string;
    createdAt: Time;
    color: string;
    goalValue: bigint;
    isActive: boolean;
    streakCount: bigint;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface Activity {
    id: bigint;
    isProductive: boolean;
    startTime: Time;
    duration: bigint;
    endTime: Time;
    userId: Principal;
    date: Time;
    habitId: bigint;
    earnings: bigint;
    notes: string;
    customName: string;
}
export interface PaymentRequest {
    id: bigint;
    status: PaymentStatus;
    couponCode?: string;
    userId: Principal;
    plan: Plan;
    cycle?: PlanCycle;
    submittedAt: Time;
    verifiedAt?: Time;
    transactionId: string;
}
export interface PlatformStats {
    totalActivities: bigint;
    totalPaymentRequests: bigint;
    totalHabits: bigint;
    totalUsers: bigint;
}
export interface UserProfile {
    principal: Principal;
    name: string;
    createdAt: Time;
    plan: Plan;
    email: string;
    planExpiry?: Time;
    phone: string;
    lastLogin?: Time;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum HabitGoal {
    daily = "daily",
    weekly = "weekly"
}
export enum Plan {
    starter = "starter",
    premium = "premium",
    free = "free"
}
export enum PlanCycle {
    monthly = "monthly",
    yearly = "yearly"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    approvePaymentRequest(requestId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignRole(user: Principal, role: UserRole): Promise<void>;
    createCoupon(code: string, discountPercent: bigint, usageLimit: bigint, expiresAt: Time | null): Promise<void>;
    createHabit(name: string, goalType: HabitGoal, goalValue: bigint, color: string): Promise<void>;
    deleteAccount(): Promise<void>;
    deleteActivity(activityId: bigint): Promise<void>;
    deleteCoupon(code: string): Promise<void>;
    deleteHabit(habitId: bigint): Promise<void>;
    getActivities(userId: Principal, habitId: bigint | null, isProductive: boolean | null): Promise<Array<Activity>>;
    getAllPaymentRequests(): Promise<Array<PaymentRequest>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCoupon(code: string): Promise<Coupon | null>;
    getHabitStreak(habitId: bigint): Promise<bigint>;
    getHabitStreaks(habitId: bigint): Promise<Array<StreakDay>>;
    getHabits(userId: Principal, goalType: HabitGoal | null): Promise<Array<Habit>>;
    getMyPaymentRequests(): Promise<Array<PaymentRequest>>;
    getPendingPaymentRequests(): Promise<Array<PaymentRequest>>;
    getPlatformStats(): Promise<PlatformStats>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserStreak(userId: Principal): Promise<bigint>;
    getUserStreaks(userId: Principal): Promise<UserStreaks>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listCoupons(): Promise<Array<Coupon>>;
    logActivity(habitId: bigint, customName: string, startTime: Time, endTime: Time, duration: bigint, isProductive: boolean, earnings: bigint, notes: string, date: Time): Promise<void>;
    rejectPaymentRequest(requestId: bigint): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchCoupons(searchQuery: string): Promise<Array<Coupon>>;
    selfPromoteAdmin(): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setUserPlan(user: Principal, plan: Plan, planExpiry: Time | null): Promise<void>;
    submitPaymentRequest(plan: Plan, cycle: PlanCycle | null, transactionId: string, couponCode: string | null): Promise<void>;
    updateActivity(activityId: bigint, habitId: bigint, customName: string, startTime: Time, endTime: Time, duration: bigint, isProductive: boolean, earnings: bigint, notes: string, date: Time): Promise<void>;
    updateHabit(habitId: bigint, name: string, goalType: HabitGoal, goalValue: bigint, color: string): Promise<void>;
}
