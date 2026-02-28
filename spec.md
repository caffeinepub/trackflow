# Specification

## Summary
**Goal:** Fix several critical bugs in TrackFlow (actor availability, dashboard data loading, habit saving, pricing buttons) and add a principal-based admin system to both the backend and frontend.

**Planned changes:**
- Fix "actor not available" errors throughout the app by gating all React Query hooks on actor readiness and showing loading states until the actor is initialized
- Fix dashboard data not loading by ensuring stats, today's activities, and habit progress bars are fetched and rendered correctly once the actor is available
- Fix habit creation on the HabitsPage so new habits are saved to the backend canister, the list updates immediately, and errors are shown via toast
- Wire up all PricingPage buttons so authenticated users navigate to PaymentPage with the selected plan, and unauthenticated users are redirected to login
- Add an admin system to the backend (main.mo) with a hardcoded owner principal, `isAdmin`, `getAdminPrincipal`, and admin-gated functions (`getAllUsers`, `getPlatformStats`, `approvePayment`, `rejectPayment`, `manageCoupons`)
- Add frontend admin access control: expose `isAdmin` query in useQueries.ts, show admin sidebar links only to admin users, protect the AdminPage route by redirecting non-admins to the dashboard, and replace the session-storage password gate with a principal-based check

**User-visible outcome:** After login, the dashboard loads all data correctly and activity logging works without errors. Habits can be created and saved. Pricing page buttons navigate properly. The app owner sees admin navigation links and can access the AdminPage, while all other users are redirected away from admin routes.
