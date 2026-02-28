import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
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
    /**
     * / Approve a payment request and update the user's plan. Admin only.
     */
    approvePaymentRequest(requestId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Assigns a role to a user (requires admin privileges).
     */
    assignRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Create a coupon. Admin only.
     */
    createCoupon(code: string, discountPercent: bigint, usageLimit: bigint, expiresAt: Time | null): Promise<void>;
    /**
     * / Create a new habit for the calling user.
     */
    createHabit(name: string, goalType: HabitGoal, goalValue: bigint, color: string): Promise<void>;
    /**
     * / Delete the calling user's own account.
     */
    deleteAccount(): Promise<void>;
    /**
     * / Delete an activity. Only the owner (or admin) may delete.
     */
    deleteActivity(activityId: bigint): Promise<void>;
    /**
     * / Delete a coupon by code. Admin only.
     */
    deleteCoupon(code: string): Promise<void>;
    /**
     * / Delete a habit. Only the owner (or admin) may delete.
     */
    deleteHabit(habitId: bigint): Promise<void>;
    /**
     * / Get activities for a user. Users may only query their own; admins may
     * / query any user's activities.
     */
    getActivities(userId: Principal, habitId: bigint | null, isProductive: boolean | null): Promise<Array<Activity>>;
    /**
     * / Get all payment requests. Admin only.
     */
    getAllPaymentRequests(): Promise<Array<PaymentRequest>>;
    /**
     * / Returns all user profiles. Admin only.
     */
    getAllUsers(): Promise<Array<UserProfile>>;
    /**
     * / Get the calling user's own profile.
     */
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Look up a coupon by code. Only registered users may validate coupons.
     */
    getCoupon(code: string): Promise<Coupon | null>;
    /**
     * / Get habits for a user. Users may only query their own habits; admins may
     * / query any user's habits.
     */
    getHabits(userId: Principal, goalType: HabitGoal | null): Promise<Array<Habit>>;
    /**
     * / Get the calling user's own payment requests.
     */
    getMyPaymentRequests(): Promise<Array<PaymentRequest>>;
    /**
     * / Get all pending payment requests. Admin only.
     */
    getPendingPaymentRequests(): Promise<Array<PaymentRequest>>;
    /**
     * / Platform-wide statistics. Admin only.
     */
    getPlatformStats(): Promise<PlatformStats>;
    /**
     * / Fetch another user's profile.
     */
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Check if the caller is approved (true for admins)
     */
    isCallerApproved(): Promise<boolean>;
    /**
     * / Admin: List all approval entries
     */
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    /**
     * / List all coupons. Admin only.
     */
    listCoupons(): Promise<Array<Coupon>>;
    /**
     * / Log a new activity for the calling user.
     */
    logActivity(habitId: bigint, customName: string, startTime: Time, endTime: Time, duration: bigint, isProductive: boolean, earnings: bigint, notes: string, date: Time): Promise<void>;
    /**
     * / Reject a payment request. Admin only.
     */
    rejectPaymentRequest(requestId: bigint): Promise<void>;
    /**
     * / Request approval as a new user
     */
    requestApproval(): Promise<void>;
    /**
     * / Save / update the calling user's own profile.
     */
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    /**
     * / Search coupons by code substring. Admin only.
     */
    searchCoupons(searchQuery: string): Promise<Array<Coupon>>;
    /**
     * / Allows the caller to promote themselves to admin ONLY when no admin
     * / currently exists in the system (i.e. first-time bootstrap).
     * / The caller must already be a registered user (have a profile).
     */
    selfPromoteAdmin(): Promise<void>;
    /**
     * / Admin: Set approval status for a user
     */
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    /**
     * / Admin: Set a user's plan.
     */
    setUserPlan(user: Principal, plan: Plan, planExpiry: Time | null): Promise<void>;
    /**
     * / Submit a payment request. Only registered users may submit.
     */
    submitPaymentRequest(plan: Plan, cycle: PlanCycle | null, transactionId: string, couponCode: string | null): Promise<void>;
    /**
     * / Update an existing activity. Only the owner (or admin) may update.
     */
    updateActivity(activityId: bigint, habitId: bigint, customName: string, startTime: Time, endTime: Time, duration: bigint, isProductive: boolean, earnings: bigint, notes: string, date: Time): Promise<void>;
    /**
     * / Update an existing habit. Only the owner (or admin) may update.
     */
    updateHabit(habitId: bigint, name: string, goalType: HabitGoal, goalValue: bigint, color: string): Promise<void>;
}
