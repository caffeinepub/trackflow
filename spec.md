# Specification

## Summary
**Goal:** Fix the TrackFlow dashboard so that all data (habit progress bars, stats cards, and activity timeline) loads and displays correctly for authenticated users.

**Planned changes:**
- Fix React Query hooks in DashboardPage so they correctly call the backend actor for habits, activities, and user profile data
- Ensure dashboard queries are only enabled when the backend actor is fully initialized and the user is authenticated
- Add loading spinner while queries are in flight and error fallback UI if a query fails
- Prevent null/undefined actor references from causing silent data fetch failures

**User-visible outcome:** The dashboard loads and displays habit progress bars, today's stats cards, and the activity timeline correctly instead of showing a blank screen.
