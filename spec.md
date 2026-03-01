# Specification

## Summary
**Goal:** Remove all admin privilege/role-based access checks that block the Users section in the admin panel.

**Planned changes:**
- Remove any backend guard (in `getUsers`, `getAllUsers`, or similar queries) that requires an admin role before returning user data
- Remove any frontend conditional in AdminPage or UsersTable that renders an "Admin privileges required" error or hides the users tab based on a role check

**User-visible outcome:** The Users tab in the admin panel loads and displays all users without any "Admin privileges required" message or access-denied error.
