# Specification

## Summary
**Goal:** Fix the blank login page and broken Internet Identity authentication flow in the TrackFlow frontend.

**Planned changes:**
- Fix `LoginPage` to render the login UI (app name, tagline, and "Login with Internet Identity" button) immediately on load without showing a blank screen, handling the AuthClient loading state properly
- Fix `App.tsx` route tree and auth guard logic so unauthenticated users are redirected to `/login`, authenticated users are redirected to `/dashboard`, and no route ever renders a blank white page
- Ensure auth guards wait for Internet Identity initialization before performing redirects to prevent blank flashes or redirect loops
- Verify context provider ordering so `useInternetIdentity()` and `useActor()` return valid state on all pages without throwing context errors
- Ensure all existing routes (`/`, `/pricing`, `/payment`, `/dashboard`, `/analytics`, `/activities`, `/habits`, `/profile`, `/admin`) resolve correctly

**User-visible outcome:** Users can navigate to the app and see the TrackFlow login page immediately. Clicking "Login with Internet Identity" triggers the authentication popup, and after login users are redirected to the appropriate page. No blank screens appear on any route.
