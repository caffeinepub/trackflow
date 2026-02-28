# Specification

## Summary
**Goal:** Fix non-responsive buttons on the `/pricing` page so all click interactions work correctly.

**Planned changes:**
- Fix click handlers for plan tier selection buttons on `PricingPage.tsx` so they trigger the expected actions (profile setup flow or navigation to payment page).
- Ensure all interactive buttons on `/pricing` respond to user clicks without errors.
- Fix navigation to the payment flow when a paid plan button is clicked.

**User-visible outcome:** Users can click any button on the `/pricing` page and have it respond correctly — selecting a plan, initiating profile setup, or navigating to the payment flow — with no console errors.
