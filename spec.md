# Specification

## Summary
**Goal:** Build TrackFlow, a full-featured habit and activity tracker with Internet Identity authentication, UPI-based manual payment flow, tiered plans, and an admin panel.

**Planned changes:**

**Authentication & Routing**
- Internet Identity login page; successful login redirects to `/pricing`
- Protected routes redirect unauthenticated users to login

**Pricing & Payment**
- Pricing page with three plans: Free (direct to dashboard), Starter (₹149/mo), Premium (₹399/mo or ₹3,199/yr)
- UPI payment page displaying UPI ID `yadavmannan007@okicici`, QR code placeholder, transaction ID input, coupon code input with validation, and submission confirmation screen
- Submitted payments stored with status `pending`

**Backend Data Models (Motoko)**
- Users, Habits, Activities, PaymentRequests, and Coupons models with full CRUD
- Plan limit enforcement (Free: 3 habits, Starter: 10 habits, Premium: unlimited)
- Payment status transitions: `pending` → `approved` / `rejected`

**Dashboard (`/dashboard`)**
- Stats cards: Total Hours Today, Total Earnings Today (₹), Productive Hours, Most Active Habit
- Add Activity form with activity name dropdown (add-new option), start/end time pickers, auto-calculated duration, productive checkbox, earnings (₹), and notes
- Today's Timeline with edit/delete per activity
- Habit progress bars showing daily goal completion

**Analytics (`/analytics`)**
- Date range selector (Last 7 days, Last 30 days, This Month)
- Pie chart (time by activity), bar chart (daily earnings), line chart (productivity trend)
- Summary stats: avg daily hours, total earnings, most productive day, top 3 activities
- Free plan: checkbox-style basic analytics + upgrade prompt; Starter/Premium: full charts

**Activities (`/activities`)**
- Filter bar (date range, by habit, productive/unproductive)
- Table with Date, Activity, Duration, Earnings (₹), Productive, Actions columns
- Pagination (10/page), bulk delete, Export to CSV

**Habits (`/habits`)**
- Add/Edit/Delete habits (name, goal type, goal value in hours, color picker)
- Streak display per habit
- Upgrade prompt modal when plan habit limit is exceeded

**Profile (`/profile`)**
- Editable phone number, account statistics, Delete Account with confirmation, Export My Data (JSON/CSV)

**Admin Panel (`/admin`)**
- Pending payments queue with Approve/Reject actions
- Users table with manual plan override
- Coupon management (create, list, delete)
- Platform stats (total users, total activities, active users today)

**Navigation & UI**
- Collapsible sidebar with icons for Dashboard, Analytics, Activities, Habits, Profile; Admin link visible only for admin role
- Indigo (#4f46e5) primary theme, Inter/Poppins typography, card components, toast notifications, loading skeletons
- Footer: `© {year} TrackFlow. All rights reserved.`

**User-visible outcome:** Users can sign in via Internet Identity, select a plan (paying via UPI for paid tiers), and use a full productivity tracker with habit management, activity logging, analytics charts, and profile controls. Admins can verify payments, manage users and coupons, and view platform stats from a dedicated admin panel.
