import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Char "mo:core/Char";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";

(with migration = Migration.run)
actor {
  // ── Access Control ──────────────────────────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Storage ─────────────────────────────────────────────────────────────────
  include MixinStorage();

  // ── User Approval ───────────────────────────────────────────────────────────
  let approvalState = UserApproval.initState(accessControlState);

  // ── Types ───────────────────────────────────────────────────────────────────

  type Plan = {
    #free;
    #starter;
    #premium;
  };

  type PlanCycle = {
    #monthly;
    #yearly;
  };

  type HabitGoal = {
    #daily;
    #weekly;
  };

  type PaymentStatus = {
    #pending;
    #approved;
    #rejected;
  };

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

  type PlatformStats = {
    totalUsers : Nat;
    totalActivities : Nat;
    totalHabits : Nat;
    totalPaymentRequests : Nat;
  };

  // ── State ────────────────────────────────────────────────────────────────────

  var nextHabitId = 1;
  var nextActivityId = 1;
  var nextPaymentRequestId = 1;
  var nextCouponId = 1;

  let users = Map.empty<Principal, UserProfile>();
  let habits = Map.empty<Nat, Habit>();
  let activities = Map.empty<Nat, Activity>();
  let paymentRequests = Map.empty<Nat, PaymentRequest>();
  let coupons = Map.empty<Nat, Coupon>();

  // ── Authorization helpers ────────────────────────────────────────────────────

  func requireAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  func requireUser(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
  };

  func requireOwnerOrAdmin(caller : Principal, owner : Principal) {
    if (not (
      AccessControl.isAdmin(accessControlState, caller) or
      caller == owner
    )) {
      Runtime.trap("Unauthorized: Only the owner or an admin can perform this action");
    };
  };

  // ── Plan-limit helper ────────────────────────────────────────────────────────

  func getUserPlan(caller : Principal) : Plan {
    switch (users.get(caller)) {
      case (null) { #free };
      case (?profile) { profile.plan };
    };
  };

  func habitLimitForPlan(plan : Plan) : ?Nat {
    switch (plan) {
      case (#free) { ?3 };
      case (#starter) { ?10 };
      case (#premium) { null }; // unlimited
    };
  };

  func enforceHabitLimit(caller : Principal) {
    let plan = getUserPlan(caller);
    switch (habitLimitForPlan(plan)) {
      case (null) {}; // unlimited
      case (?limit) {
        let userHabits = habits.values().toArray().filter(
          func(h : Habit) : Bool { h.userId == caller and h.isActive }
        );
        if (userHabits.size() >= limit) {
          Runtime.trap(
            "Habit limit reached for your plan (" # planName(plan) # "). " #
            "Please upgrade to add more habits."
          );
        };
      };
    };
  };

  func planName(plan : Plan) : Text {
    switch (plan) {
      case (#free) { "Free" };
      case (#starter) { "Starter" };
      case (#premium) { "Premium" };
    };
  };

  // ── Admin existence check ────────────────────────────────────────────────────

  /// Returns true if any registered user currently holds the admin role.
  func adminExists() : Bool {
    let allUsers = users.keys().toArray();
    var found = false;
    for (principal in allUsers.values()) {
      if (AccessControl.isAdmin(accessControlState, principal)) {
        found := true;
      };
    };
    found;
  };

  // ── User Approval Functions ──────────────────────────────────────────────────

  /// Check if the caller is approved (true for admins)
  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  /// Request approval as a new user
  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  /// Admin: Set approval status for a user
  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    requireAdmin(caller);
    UserApproval.setApproval(approvalState, user, status);
  };

  /// Admin: List all approval entries
  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    requireAdmin(caller);
    UserApproval.listApprovals(approvalState);
  };

  // ── User Profile ─────────────────────────────────────────────────────────────

  /// Get the calling user's own profile.
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireUser(caller);
    users.get(caller);
  };

  /// Save / update the calling user's own profile.
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireUser(caller);
    // Ensure the stored principal always matches the caller.
    let sanitised : UserProfile = {
      principal = caller;
      name = profile.name;
      email = profile.email;
      phone = profile.phone;
      plan = profile.plan;
      planExpiry = profile.planExpiry;
      createdAt = profile.createdAt;
      lastLogin = profile.lastLogin;
    };
    users.add(caller, sanitised);
  };

  /// Fetch another user's profile.
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    requireOwnerOrAdmin(caller, user);
    users.get(user);
  };

  /// Returns all user profiles. Admin only.
  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    requireAdmin(caller);
    users.values().toArray();
  };

  /// Admin: Set a user's plan.
  public shared ({ caller }) func setUserPlan(user : Principal, plan : Plan, planExpiry : ?Time.Time) : async () {
    requireAdmin(caller);
    switch (users.get(user)) {
      case (null) {
        Runtime.trap("User not found: " # user.toText());
      };
      case (?profile) {
        let updated : UserProfile = {
          principal = profile.principal;
          name = profile.name;
          email = profile.email;
          phone = profile.phone;
          plan;
          planExpiry;
          createdAt = profile.createdAt;
          lastLogin = profile.lastLogin;
        };
        users.add(user, updated);
      };
    };
  };

  /// Assigns a role to a user (requires admin privileges).
  public shared ({ caller }) func assignRole(user : Principal, role : AccessControl.UserRole) : async () {
    requireAdmin(caller);
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  /// Delete the calling user's own account.
  public shared ({ caller }) func deleteAccount() : async () {
    requireUser(caller);
    users.remove(caller);
    // Remove all habits and activities belonging to this user.
    let userHabits = habits.values().toArray().filter(
      func(h : Habit) : Bool { h.userId == caller }
    );
    for ((habit) in userHabits.values()) {
      habits.remove(habit.id);
    };
    let userActivities = activities.values().toArray().filter(
      func(a : Activity) : Bool { a.userId == caller }
    );
    for ((activity) in userActivities.values()) {
      activities.remove(activity.id);
    };
  };

  // ── Habits ───────────────────────────────────────────────────────────────────

  /// Create a new habit for the calling user.
  public shared ({ caller }) func createHabit(
    name : Text,
    goalType : HabitGoal,
    goalValue : Nat,
    color : Text,
  ) : async () {
    requireUser(caller);
    enforceHabitLimit(caller);
    let habit : Habit = {
      id = nextHabitId;
      userId = caller;
      name;
      goalType;
      goalValue;
      color;
      createdAt = Time.now();
      streakCount = 0;
      isActive = true;
    };
    habits.add(nextHabitId, habit);
    nextHabitId += 1;
  };

  /// Update an existing habit. Only the owner (or admin) may update.
  public shared ({ caller }) func updateHabit(
    habitId : Nat,
    name : Text,
    goalType : HabitGoal,
    goalValue : Nat,
    color : Text,
  ) : async () {
    requireUser(caller);
    switch (habits.get(habitId)) {
      case (null) {
        Runtime.trap("Habit does not exist (id: " # habitId.toText() # ")");
      };
      case (?existing) {
        requireOwnerOrAdmin(caller, existing.userId);
        let updated : Habit = {
          id = habitId;
          userId = existing.userId;
          name;
          goalType;
          goalValue;
          color;
          createdAt = existing.createdAt;
          streakCount = existing.streakCount;
          isActive = existing.isActive;
        };
        habits.add(habitId, updated);
      };
    };
  };

  /// Delete a habit. Only the owner (or admin) may delete.
  public shared ({ caller }) func deleteHabit(habitId : Nat) : async () {
    requireUser(caller);
    switch (habits.get(habitId)) {
      case (null) {
        Runtime.trap("Cannot delete non-existent habit (id: " # habitId.toText() # ")");
      };
      case (?habit) {
        requireOwnerOrAdmin(caller, habit.userId);
        habits.remove(habitId);
      };
    };
  };

  /// Get habits for a user. Users may only query their own habits; admins may
  /// query any user's habits.
  public query ({ caller }) func getHabits(userId : Principal, goalType : ?HabitGoal) : async [Habit] {
    requireOwnerOrAdmin(caller, userId);
    let allHabits = habits.values().toArray().filter(
      func(h : Habit) : Bool { h.userId == userId }
    );
    switch (goalType) {
      case (null) { allHabits };
      case (?gt) {
        allHabits.filter(func(h : Habit) : Bool { h.goalType == gt });
      };
    };
  };

  // ── Activities ───────────────────────────────────────────────────────────────

  /// Log a new activity for the calling user.
  public shared ({ caller }) func logActivity(
    habitId : Nat,
    customName : Text,
    startTime : Time.Time,
    endTime : Time.Time,
    duration : Nat,
    isProductive : Bool,
    earnings : Nat,
    notes : Text,
    date : Time.Time,
  ) : async () {
    requireUser(caller);
    let activity : Activity = {
      id = nextActivityId;
      userId = caller;
      habitId;
      customName;
      startTime;
      endTime;
      duration;
      isProductive;
      earnings;
      notes;
      date;
    };
    activities.add(nextActivityId, activity);
    nextActivityId += 1;
  };

  /// Update an existing activity. Only the owner (or admin) may update.
  public shared ({ caller }) func updateActivity(
    activityId : Nat,
    habitId : Nat,
    customName : Text,
    startTime : Time.Time,
    endTime : Time.Time,
    duration : Nat,
    isProductive : Bool,
    earnings : Nat,
    notes : Text,
    date : Time.Time,
  ) : async () {
    requireUser(caller);
    switch (activities.get(activityId)) {
      case (null) {
        Runtime.trap("Cannot update non-existent activity (id: " # activityId.toText() # ")");
      };
      case (?existing) {
        requireOwnerOrAdmin(caller, existing.userId);
        let updated : Activity = {
          id = activityId;
          userId = existing.userId;
          habitId;
          customName;
          startTime;
          endTime;
          duration;
          isProductive;
          earnings;
          notes;
          date;
        };
        activities.add(activityId, updated);
      };
    };
  };

  /// Delete an activity. Only the owner (or admin) may delete.
  public shared ({ caller }) func deleteActivity(activityId : Nat) : async () {
    requireUser(caller);
    switch (activities.get(activityId)) {
      case (null) {
        Runtime.trap("Cannot delete non-existent activity (id: " # activityId.toText() # ")");
      };
      case (?activity) {
        requireOwnerOrAdmin(caller, activity.userId);
        activities.remove(activityId);
      };
    };
  };

  /// Get activities for a user. Users may only query their own; admins may
  /// query any user's activities.
  public query ({ caller }) func getActivities(
    userId : Principal,
    habitId : ?Nat,
    isProductive : ?Bool,
  ) : async [Activity] {
    requireOwnerOrAdmin(caller, userId);
    let all = activities.values().toArray().filter(
      func(a : Activity) : Bool { a.userId == userId }
    );
    switch (habitId, isProductive) {
      case (null, null) { all };
      case (?h, null) {
        all.filter(func(a : Activity) : Bool { a.habitId == h });
      };
      case (null, ?prod) {
        all.filter(func(a : Activity) : Bool { a.isProductive == prod });
      };
      case (?h, ?prod) {
        all.filter(func(a : Activity) : Bool {
          a.habitId == h and a.isProductive == prod
        });
      };
    };
  };

  // ── Payment Requests ─────────────────────────────────────────────────────────

  /// Submit a payment request. Only registered users may submit.
  public shared ({ caller }) func submitPaymentRequest(
    plan : Plan,
    cycle : ?PlanCycle,
    transactionId : Text,
    couponCode : ?Text,
  ) : async () {
    requireUser(caller);
    let request : PaymentRequest = {
      id = nextPaymentRequestId;
      userId = caller;
      plan;
      cycle;
      transactionId;
      couponCode;
      status = #pending;
      submittedAt = Time.now();
      verifiedAt = null;
    };
    paymentRequests.add(nextPaymentRequestId, request);
    nextPaymentRequestId += 1;
  };

  /// Approve a payment request and update the user's plan. Admin only.
  public shared ({ caller }) func approvePaymentRequest(requestId : Nat) : async () {
    requireAdmin(caller);
    switch (paymentRequests.get(requestId)) {
      case (null) {
        Runtime.trap("Cannot approve non-existent payment request (id: " # requestId.toText() # ")");
      };
      case (?request) {
        let updated : PaymentRequest = {
          id = requestId;
          userId = request.userId;
          plan = request.plan;
          cycle = request.cycle;
          transactionId = request.transactionId;
          couponCode = request.couponCode;
          status = #approved;
          submittedAt = request.submittedAt;
          verifiedAt = ?Time.now();
        };
        paymentRequests.add(requestId, updated);
        // Update the user's plan.
        switch (users.get(request.userId)) {
          case (null) {};
          case (?profile) {
            let expiry : ?Time.Time = switch (request.cycle) {
              case (null) { null };
              case (?#monthly) { ?(Time.now() + 30 * 24 * 60 * 60 * 1_000_000_000) };
              case (?#yearly) { ?(Time.now() + 365 * 24 * 60 * 60 * 1_000_000_000) };
            };
            let updatedProfile : UserProfile = {
              principal = profile.principal;
              name = profile.name;
              email = profile.email;
              phone = profile.phone;
              plan = request.plan;
              planExpiry = expiry;
              createdAt = profile.createdAt;
              lastLogin = profile.lastLogin;
            };
            users.add(request.userId, updatedProfile);
          };
        };
      };
    };
  };

  /// Reject a payment request. Admin only.
  public shared ({ caller }) func rejectPaymentRequest(requestId : Nat) : async () {
    requireAdmin(caller);
    switch (paymentRequests.get(requestId)) {
      case (null) {
        Runtime.trap("Cannot reject non-existent payment request (id: " # requestId.toText() # ")");
      };
      case (?request) {
        let updated : PaymentRequest = {
          id = requestId;
          userId = request.userId;
          plan = request.plan;
          cycle = request.cycle;
          transactionId = request.transactionId;
          couponCode = request.couponCode;
          status = #rejected;
          submittedAt = request.submittedAt;
          verifiedAt = ?Time.now();
        };
        paymentRequests.add(requestId, updated);
      };
    };
  };

  /// Get all pending payment requests. Admin only.
  public query ({ caller }) func getPendingPaymentRequests() : async [PaymentRequest] {
    requireAdmin(caller);
    paymentRequests.values().toArray().filter(
      func(p : PaymentRequest) : Bool { p.status == #pending }
    );
  };

  /// Get all payment requests. Admin only.
  public query ({ caller }) func getAllPaymentRequests() : async [PaymentRequest] {
    requireAdmin(caller);
    paymentRequests.values().toArray();
  };

  /// Get the calling user's own payment requests.
  public query ({ caller }) func getMyPaymentRequests() : async [PaymentRequest] {
    requireUser(caller);
    paymentRequests.values().toArray().filter(
      func(p : PaymentRequest) : Bool { p.userId == caller }
    );
  };

  // ── Coupons ─────────────────────────────────────────────────────────────────-

  /// Look up a coupon by code. Only registered users may validate coupons.
  public query ({ caller }) func getCoupon(code : Text) : async ?Coupon {
    requireUser(caller);
    let filtered = coupons.values().toArray().filter(
      func(c : Coupon) : Bool { c.code == code }
    );
    if (filtered.size() == 0) { null } else { ?filtered[0] };
  };

  /// Create a coupon. Admin only.
  public shared ({ caller }) func createCoupon(
    code : Text,
    discountPercent : Nat,
    usageLimit : Nat,
    expiresAt : ?Time.Time,
  ) : async () {
    requireAdmin(caller);
    let coupon : Coupon = {
      id = nextCouponId;
      code;
      discountPercent;
      usageLimit;
      usedCount = 0;
      expiresAt;
      createdAt = Time.now();
    };
    coupons.add(nextCouponId, coupon);
    nextCouponId += 1;
  };

  /// List all coupons. Admin only.
  public query ({ caller }) func listCoupons() : async [Coupon] {
    requireAdmin(caller);
    coupons.values().toArray().sort(
      func(a : Coupon, b : Coupon) : Order.Order {
        Text.compare(a.code, b.code);
      }
    );
  };

  /// Delete a coupon by code. Admin only.
  public shared ({ caller }) func deleteCoupon(code : Text) : async () {
    requireAdmin(caller);
    let filtered = coupons.values().toArray().filter(
      func(c : Coupon) : Bool { c.code == code }
    );
    if (filtered.size() == 0) {
      Runtime.trap("Cannot delete non-existent coupon: " # code);
    };
    coupons.remove(filtered[0].id);
  };

  /// Search coupons by code substring. Admin only.
  public query ({ caller }) func searchCoupons(searchQuery : Text) : async [Coupon] {
    requireAdmin(caller);
    let queryLower = searchQuery.map(
      func(c : Char) : Char {
        if (c >= 'A' and c <= 'Z') {
          Char.fromNat32(c.toNat32() + 32);
        } else { c };
      },
    );
    coupons.values().toArray().filter(
      func(coupon : Coupon) : Bool {
        let codeLower = coupon.code.map(
          func(c : Char) : Char {
            if (c >= 'A' and c <= 'Z') {
              Char.fromNat32(c.toNat32() + 32);
            } else { c };
          },
        );
        codeLower.contains(#text queryLower);
      }
    );
  };

  // ── Platform stats (admin) ─────────────────────────────────────────────────--

  /// Platform-wide statistics. Admin only.
  public query ({ caller }) func getPlatformStats() : async PlatformStats {
    requireAdmin(caller);
    {
      totalUsers = users.size();
      totalActivities = activities.size();
      totalHabits = habits.size();
      totalPaymentRequests = paymentRequests.size();
    };
  };

  // ── Self-Promote Admin ───────────────────────────────────────────────────────

  /// Allows the caller to promote themselves to admin ONLY when no admin
  /// currently exists in the system (i.e. first-time bootstrap).
  /// The caller must already be a registered user (have a profile).
  public shared ({ caller }) func selfPromoteAdmin() : async () {
    // Reject anonymous principals outright.
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot become admin");
    };

    // Only allow self-promotion when no admin exists yet.
    if (adminExists()) {
      Runtime.trap("Unauthorized: An admin already exists. Contact the existing admin to grant you the admin role.");
    };

    // The caller must have a registered user profile.
    switch (users.get(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: You must have a registered profile before becoming admin");
      };
      case (?_profile) {
        // Use the AccessControl module's assignRole path: assign admin role.
        AccessControl.assignRole(accessControlState, caller, caller, #admin);
      };
    };
  };
};
