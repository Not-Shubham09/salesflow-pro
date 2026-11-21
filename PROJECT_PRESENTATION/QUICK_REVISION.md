# SalesFlow Pro CRM — 15-Minute Emergency Viva Revision Sheet

> **Keep this sheet open on your phone or printed 15 minutes before your evaluation!**  
> **Student Name:** Shubham  
> **Live Demo URL:** `http://localhost:4028/sales-dashboard`  
> **Repository:** [https://github.com/Not-Shubham09/salesflow-pro](https://github.com/Not-Shubham09/salesflow-pro)

---

## 1. Golden Numbers & Quick Facts

| Item | Value to Memorize |
| :--- | :--- |
| **Local Port** | `4028` (`http://localhost:4028/`) |
| **Target Header Height** | **74 pixels** (`h-[74px]`, exact range 72–84px) |
| **Profile Avatar Size** | **36 × 36 pixels**, circular (`border-radius: 50%`, `object-fit: cover`) |
| **Kanban Column Width** | **260 pixels** (`w-[260px] min-w-[260px] flex-shrink-0`) |
| **Pipeline Stages (6)** | `Lead` (20%) → `Qualified` (40%) → `Proposal` (60%) → `Negotiation` (85%) → `Closed Won` (100%) → `Closed Lost` (0%) |
| **Demo User** | Jordan Hayes (`sales.manager@salesflow.com`, Role: `Sales Manager`) |
| **Database** | PostgreSQL 15 via Supabase + `localCrmStorage` fallback |
| **Tech Stack** | React 18, Vite 5, Tailwind CSS 3, Recharts, `react-beautiful-dnd`, Supabase |
| **Test Pass Rate** | **11/11 CRUD Tests Passed (100%)** & **22/22 E2E Steps Passed (100%)** |

---

## 2. Top 10 Viva Questions You MUST Nail

1. **"What is your project?"**
   > *"SalesFlow Pro is an enterprise B2B CRM built with React 18 and PostgreSQL on Supabase. It features an interactive drag-and-drop Kanban pipeline, contact dossiers, chronological activity logging, and real-time revenue analytics."*

2. **"What was your personal contribution?"**
   > *"I integrated the PostgreSQL schema and dual-engine persistence layer, restructured the sales pipeline into a fixed 260px Kanban board, implemented modal creation workflows, resolved layout and avatar dimension bugs in the header, and authored automated testing suites."*

3. **"Why use PostgreSQL instead of MongoDB?"**
   > *"CRM data is strictly relational. A Deal references a Contact and a User; an Activity references a Contact and a Deal. PostgreSQL foreign keys prevent orphaned data, and Row Level Security enforces permissions at the database engine level."*

4. **"What is Row Level Security (RLS)?"**
   > *"RLS is a PostgreSQL feature that evaluates security policies on every single SQL query. It ensures sales reps can only view their own accounts (`user_id = auth.uid()`), while managers and directors can view cross-team data via the `is_manager_or_above()` SQL function."*

5. **"What happens when you drag a deal card?"**
   > *"The `onDragEnd` event triggers an optimistic UI update. `dealService.updateDealStage()` sends a PATCH request to the database, auto-updates the win probability (e.g. 85% for Negotiation), logs an event in the activity timeline, and recalculates the dashboard KPI metrics."*

6. **"What happens if internet connectivity drops?"**
   > *"SalesFlow Pro has a dual-engine architecture. If the Supabase cloud is unreachable, our service layer transparently routes queries through `localCrmStorage`, our in-browser persistence engine. The app never crashes during live demonstrations."*

7. **"Why did you use Vite instead of Create React App?"**
   > *"Create React App is deprecated and uses slow Webpack bundling. Vite uses native ES modules during development, giving sub-50 millisecond Hot Module Replacement and production builds in under 5 seconds."*

8. **"How do you prevent unauthorized access to internal pages?"**
   > *"We wrap all dashboard routes in a `<ProtectedRoute>` component. If `user` is null, it renders `<Navigate to="/login" replace />`. On page reload, synchronous `localStorage` hydration restores the session immediately, eliminating screen flicker."*

9. **"What is the difference between Authentication and Authorization?"**
   > *"Authentication confirms identity (logging in with password or demo button). Authorization determines permissions (what an admin can do versus what a sales rep can do)."*

10. **"What is one limitation you would improve next?"**
    > *"I would implement Supabase Realtime WebSocket subscriptions so that when one sales rep moves a deal on their device, the card automatically animates and moves on their manager's screen in real time."*

---

## 3. Emergency Live Demo Troubleshooting

- **If the dev server isn't running:**
  Open terminal in project directory and run:
  ```bash
  npm start
  ```
  *(Vite will spin up on `http://localhost:4028`)*

- **If the browser shows a login screen unexpectedly:**
  Don't panic! Click the **"Sales Manager"** demo button on the login card. It logs in instantly in 1 click.

- **If sample data was modified or deleted during testing:**
  Click the user avatar in the top right header → Click **"Reset Demo CRM Data"**. It instantly restores the original seed contacts, deals, and activities.

- **If the screen looks zoomed in or strange on a projector:**
  Press `Cmd + 0` (Mac) or `Ctrl + 0` (Windows) to reset browser zoom to **100%**.
