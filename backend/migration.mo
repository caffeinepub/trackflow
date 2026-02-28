import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  // Types from actor
  type Plan = { #free; #starter; #premium };
  type PlanCycle = { #monthly; #yearly };
  type HabitGoal = { #daily; #weekly };
  type PaymentStatus = { #pending; #approved; #rejected };

  type UserProfile = {
    principal : Principal;
    name : Text;
    email : Text;
    phone : Text;
    plan : Plan;
    planExpiry : ?Time.Time;
    createdAt : Time.Time;
    lastLogin : ?Time.Time;
  };

  type Habit = {
    id : Nat;
    userId : Principal;
    name : Text;
    goalType : HabitGoal;
    goalValue : Nat;
    color : Text;
    createdAt : Time.Time;
    streakCount : Nat;
    isActive : Bool;
  };

  type Activity = {
    id : Nat;
    userId : Principal;
    habitId : Nat;
    customName : Text;
    startTime : Time.Time;
    endTime : Time.Time;
    duration : Nat;
    isProductive : Bool;
    earnings : Nat;
    notes : Text;
    date : Time.Time;
  };

  type PaymentRequest = {
    id : Nat;
    userId : Principal;
    plan : Plan;
    cycle : ?PlanCycle;
    transactionId : Text;
    couponCode : ?Text;
    status : PaymentStatus;
    submittedAt : Time.Time;
    verifiedAt : ?Time.Time;
  };

  type Coupon = {
    id : Nat;
    code : Text;
    discountPercent : Nat;
    usageLimit : Nat;
    usedCount : Nat;
    expiresAt : ?Time.Time;
    createdAt : Time.Time;
  };

  public type OldActor = {
    nextHabitId : Nat;
    nextActivityId : Nat;
    nextPaymentRequestId : Nat;
    nextCouponId : Nat;
    users : Map.Map<Principal, UserProfile>;
    habits : Map.Map<Nat, Habit>;
    activities : Map.Map<Nat, Activity>;
    paymentRequests : Map.Map<Nat, PaymentRequest>;
    coupons : Map.Map<Nat, Coupon>;
  };
  public type NewActor = OldActor;

  public func run(old : OldActor) : NewActor {
    old;
  };
};
