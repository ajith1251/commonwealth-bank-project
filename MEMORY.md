# Project Memory & Audit History

> Read this at session start for quick context.
> Last updated: 2026-07-31

---

## Session: 2026-07-31 (Phase 5 — LinkedIn Showcase & Product Polish — FINAL)

**Status**: Complete — product polished, bugs fixed, fully validated

### What was done

**Bugs fixed**
- **Test-suite DB pollution** — `initialiseDatabase(dbPath?)` now accepts an isolated path; `goals.test.ts` + `reports.test.ts` run against a temp DB, so the real demo DB is never mutated (the live audit found 11 "Test Goal" rows + a renamed "Home Deposit" caused by earlier test runs)
- **GoalDetail Delete button never deleted** — `handleDetailDelete` in `App.tsx` duplicated `handleDetailEdit` and opened the edit modal; now dispatches `removeGoal` + toast
- **Overdue action wording** — next-best-action "attention" message said "0 days left"; now uses days-overdue wording
- **Horizontal overflow at narrow widths** — flex/grid `min-width: auto` inflation (FocusGoalCard `<select>`, NextBestActions nowrap rows); fixed at root: `min-width: 0` on `ContentArea`, `minmax(0, 1fr)` on `FocusActionsRow`/`StatsGrid`, `min-width: 0` + `flex-shrink: 0` in NextBestActions. Verified 0px overflow at 338px
- **ReportsPage Share race** — banner Share button read `history` before the refresh settled; `refreshHistory` now returns the promise and `handleSubmit` awaits it

**Visual polish**
- Overview hierarchy reordered: Financial KPIs → Focus Goal + Next Best Actions → Progress visualization (full-width chart) → Goal overview
- Next Best Actions redesigned to WHAT (goal name) / WHY (stripped reason) / ACTION (Review Goal button)
- FocusGoalCard: deadline phrase + urgent styling
- ActivityHeatmap: today's cell outlined + "(today)" in tooltip
- Achievements: unlock date shown for unlocked tiles
- GoalDetail drawer: body scroll lock, focus restored to triggering card, "Set as Focus Goal" action
- SharedReportPage: distinct expired (410) vs invalid (404) states
- ReportsPage: post-generation banner with prominent Download PDF + Share
- `web/src/format.ts`: shared currency/percent/date/deadline formatting, adopted in App, GoalCard, GoalDetail, FocusGoalCard, AchievementsSection

**Demo/reproducibility**
- `server/src/demo-reset.ts` + `npm run demo:reset` — resets DB and seeds deterministic recording state (goals, history, analytics, engagement incl. focus goal)
- `seed-engagement.ts` now sets a focus goal so recordings show one

### Key metrics (Phase 5)

```
Backend tests:  56 passed (13 CRUD + 20 reports + 23 engagement)
Frontend tests:  9 passed (5 Redux + 4 reports API)
TypeScript:      0 errors both projects (strict mode)
Build:           Vite production build green, PWA included
Overflow:        0px horizontal overflow at 338px viewport (was 13px)
```

---

## Session: 2026-07-31 (Phase 4 — Goal Consistency, Streaks & Engagement Intelligence)

**Status**: Complete — engagement backend + frontend + reports integration + tests fully implemented

### What was built

- **Daily check-in system** — meaningful activities (VIEW_DASHBOARD, VIEW_GOAL, VIEW_ANALYTICS, CREATE_GOAL, UPDATE_GOAL, GENERATE_REPORT) qualify ONE check-in per local calendar day; repeated page refreshes never inflate the streak. Raw activity events stay separate from daily qualification
- **SQLite persistence** — `user_checkins` (UNIQUE user+date, activity_count, types), `focus_goal`, `achievements` tables added to `database.ts` + `migrate.ts`
- **Streak calculation (server-authoritative)** — `EngagementService` computes current streak (with yesterday-grace), longest streak, active-today, active this week/month, total days, weekly consistency %, last-active, Mon–Sun week markers. Pure, injectable `today` for deterministic date-boundary tests
- **Engagement API** — `/api/engagement/checkin|summary|calendar|weekly-review|actions|achievements` + `/api/focus-goal` GET/PUT
- **Sidebar consistency card** — compact premium card: 🔥 streak, best, M T W T F S S week markers, 6/7 active days, weekly consistency %, active-today state; hidden when sidebar collapses
- **Activity heatmap** — GitHub-style, 30D/90D/1Y ranges, restrained 5-level blue scale, accessible per-cell aria-labels + tooltips, `mode` prop (Redux-free so it renders on the shared report page)
- **Engagement analytics** — Analytics page section: Current/Longest Streak, Active Days, Weekly Consistency, This Week + heatmap + Weekly Review (with real previous-week comparison)
- **Focus goal** — one active incomplete goal, persisted, shown prominently on Overview with icon/name/saved/target/progress/remaining/deadline/View Goal; invalid (deleted/completed) selections auto-cleared
- **Next Best Actions** — deterministic rule-based engine (deadline, near-completion, not-reviewed, completed, attention), prioritised, max 3, no AI/financial advice
- **Weekly review** — active days, goals reviewed/updated, progress added, milestones, reports generated, with previous-week deltas only when real data exists
- **Achievements** — 8 restrained achievements (First Goal, First Update, 7/30 Day Streak, Halfway There, Goal Completed, Analytics Explorer, First Report) unlocked deterministically; subtle toast on new unlock; Achievements area on Activity page
- **Timeline categories** — Activity page filters: All / Goals / Milestones / Reports / Engagement
- **Reports integration** — new optional "Consistency & Engagement" report section (streaks, active days, consistency, 30-day heatmap, weekly review) flowing through the same immutable snapshot to web preview + PDF
- **Demo data** — `seed-engagement.ts`: deterministic 128-day pattern (30-day current streak, 1 missed day, 40-day longest run, sparse older history) + legitimately-earned achievements + recent activity

### Files changed (Phase 4)

```
Server:
  Created:  src/engagement/{engagement.types,engagement.repository,engagement.service,
            engagement.routes,checkin}.ts, src/seed-engagement.ts,
            src/__tests__/engagement.test.ts (23 tests)
  Modified: src/database.ts, src/migrate.ts (3 new tables), src/routes/index.ts
            (mount /api/engagement + /api/focus-goal), src/routes/goals.ts
            (CREATE_GOAL/UPDATE_GOAL checkins), src/reports/report.routes.ts
            (GENERATE_REPORT checkin + REPORT_GENERATED activity + engagement
            injection), src/reports/report.types.ts + report.service.ts +
            report.pdf.ts (engagement section)

Web:
  Created:  src/api/engagement.ts,
            src/components/engagement/{ConsistencyCard,ActivityHeatmap,WeeklyReview,
            NextBestActions,FocusGoalCard,AchievementsSection,EngagementSection}.tsx
  Modified: src/api/reports.ts (engagement section), src/App.tsx (VIEW_DASHBOARD/
            VIEW_GOAL checkins + Focus Goal + Next Best Actions on Overview),
            src/components/layout/AppShell.tsx (sidebar card),
            src/components/report/ReportDocument.tsx (engagement section),
            src/pages/{ActivityPage,AnalyticsPage}.tsx
```

### Key metrics (Phase 4)

```
Backend tests:  56 passed (13 CRUD + 20 reports + 23 engagement)
Frontend tests:  9 passed (5 Redux + 4 reports API)
TypeScript:      0 errors both projects (strict mode)
Build:           Vite production build green, PWA included (engagement adds ~1 KB)
```

---

## Session: 2026-07-31 (Phase 3 — Analytics Report Center, PDF Export & Secure Sharing)

**Status**: Complete — reports backend + frontend + PDF + secure sharing fully implemented

### What was built

- **Report data model** — Normalized immutable `ReportSnapshot` (summary, savings trend, goal performance, distribution, health, deadlines, goal details, activities) assembled from existing analytics services — no duplicated calculations in the UI
- **ReportService** — Assembles snapshots from `AnalyticsService`; period presets (30d/90d/6m/12m/all/custom), goal scoping, section toggles, sensible default titles
- **Report Builder** — Reports page with period select, custom date range, goal scope (all/selected), section checkboxes, custom title (≤80 chars)
- **Report Preview** — Print-styled document reusing the existing light-mode charts + new report tables (deadlines, goal details, activity)
- **Real server-side PDF generation** — pdfkit (pure JS, zero browser); vector-drawn area/bar/donut charts, KPI boxes, status pills, tables with page-break support, footer + page numbers on every page, A4 light design
- **Report history** — Persisted metadata + immutable snapshots in SQLite; View / Download PDF / Share actions
- **Secure share links** — 256-bit random tokens (`crypto.randomBytes(32)`), only SHA-256 hashes stored, expiration (24h/7d/30d/none), revocation, view counts, rate-limited public endpoints
- **Public shared report page** — `/shared/report/:token` renders read-only (no app shell / private controls); invalid/expired/revoked tokens show a professional message; Download PDF allowed
- **Download UX** — "Generating report…" busy state, disabled duplicate actions, meaningful filename `financial-goals-report-YYYY-MM.pdf`
- **Accessibility** — labelled builder inputs, focus-trapped share dialog, Escape closes, copy feedback, status not colour-only, semantic headings, responsive tables

### Files changed (Phase 3)

```
Server:
  Created:  src/reports/report.types.ts, report.repository.ts, report.service.ts,
            report.validation.ts, report.pdf.ts, report.routes.ts
  Created:  src/__tests__/reports.test.ts (20 tests)
  Modified: src/database.ts (reports + report_shares tables), src/migrate.ts,
            src/routes/index.ts (mount /api/reports + /api/shared/reports)
  Deps:     pdfkit ^0.15.2, @types/pdfkit

Web:
  Created:  src/api/reports.ts, src/api/__tests__/reports.test.ts,
            src/components/report/{ReportBuilder,ReportDocument,ReportHistory,ShareDialog}.tsx,
            src/pages/{ReportsPage,SharedReportPage}.tsx
  Modified: src/App.tsx, src/main.tsx (shared route), src/components/layout/AppShell.tsx
            (Reports nav), src/components/CommandPalette.tsx (reports command)
```

### Key metrics

```
Backend tests:  33 passed (13 CRUD + 20 reports)
Frontend tests:  9 passed (5 Redux + 4 reports API)
TypeScript:      0 errors both projects (strict mode)
Build:           856 KB main bundle, 2.96s, PWA included (pdfkit is server-side only)
```

---

## Session: 2026-07-30 (Phase 2 — Enterprise Fintech Analytics)

**Status**: Complete — analytics backend + frontend fully implemented

### What was built

- **Analytics backend** — 5 endpoints (summary, progress history, goal performance, health, distribution)
- **Activity system** — Activity feed with 5 event types (created, updated, completed, deleted, milestone)
- **Goal progress history** — Automatic snapshot recording on every balance change
- **Historical seed data** — Deterministic progress history + activity entries for 6 demo goals
- **Application shell** — Collapsible sidebar with Overview/Goals/Analytics/Activity pages
- **4 Recharts chart components** — SavingsGrowth (area), GoalPerformance (bar), PortfolioDistribution (pie/donut), GoalHealth (grid)
- **Analytics page** — KPI row, time-range filter, goal filter, full chart grid, deadline overview
- **Activity page** — Event feed with type filter, goal filter, auto-refresh polling, staggered animations
- **Skeleton loading** — Shimmer skeleton loaders for all chart components
- **Command palette** — Ctrl+K with navigation, create goal, theme toggle, goal search
- **PWA support** — Service worker + manifest via vite-plugin-pwa

### Key metrics

```
Backend tests:  13 passed (CRUD + validation — no regressions)
Frontend tests:  5 passed (Redux — no regressions)
TypeScript:      0 errors both projects (strict mode)
Build:           805 KB main bundle, 2.6s, PWA included
```

---

## Session: 2026-07-30 (Analytics + Activity Upgrades)

**Status**: Complete

### What was built

- `ChartSkeleton.tsx` — Shimmer skeleton loader for 4 chart types (area/bar/pie/grid)
- All 4 chart components updated to use skeleton loading instead of text
- Goal filter in AnalyticsPage now affects ALL charts (performance, distribution, health) — not just savings trend
- ActivityPage auto-refresh polling (30s interval)
- Activity type filter dropdown + goal filter dropdown
- Refresh button with spinning animation on ActivityPage
- Activity count banner with filter context
- Staggered slide-up animations on activity rows
- `FilterSelect` and `RefreshButton` styled in ActivityPage

### Files changed

```
Created:
  web/src/components/charts/ChartSkeleton.tsx

Modified:
  web/src/components/charts/SavingsTrendChart.tsx    — skeleton loading
  web/src/components/charts/GoalPerformanceChart.tsx  — skeleton loading
  web/src/components/charts/PortfolioDistributionChart.tsx — skeleton loading
  web/src/components/charts/GoalHealthChart.tsx       — skeleton loading
  web/src/pages/AnalyticsPage.tsx                     — filtered data for all charts
  web/src/pages/ActivityPage.tsx                      — auto-refresh + filters + polish
```

---

## Session: 2026-07-30 (Phase 1 — Premium Dashboard Redesign)

**Status**: Complete — merged to main as PR #2

### What was built

- Premium dashboard header with gradient design
- Summary metrics grid (Total Goals, Total Saved, Total Target, Avg Progress)
- SVG ring chart showing overall savings progress
- Progress distribution bar + completion timeline
- Goal card redesign with icon circle, amount hierarchy, progress bar, remaining amount
- Milestone labels (Getting Started → Goal Achieved)
- Inline balance update (quick-add from goal card)
- Goal detail drawer with slide-in animation + focus trapping
- Goal sharing via clipboard URL
- Skeleton loading states with shimmer animation
- Empty states for no goals / no search results
- Search + sort toolbar (newest, name, target, progress)
- Toast notifications with dark mode support
- Keyboard shortcut Ctrl+N / Cmd+N for create goal
- PWA support (manifest + service worker)
- Updated demo goals data (6 goals with different progress levels)
- Responsive grid layout (3-col desktop → 1-col mobile)
- Dark mode polish

---

## Session: Initial (Scaffolding)

**Status**: Complete — backend server running, frontend scaffolding created

---

## Current Architecture

```
commbank-program/
├── .freebuff/                      ← Freebuff session data (internal)
├── data/                           ← Seed JSON files
│   ├── Accounts.json
│   ├── Goals.json                  ← 6 demo goals with icons
│   ├── Tags.json
│   ├── Transactions.json
│   └── Users.json
├── server/                         ← BACKEND — Express + SQLite + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── data/
│   │   └── commbank.db             ← SQLite database (seeded via npm run demo:reset)
│   ├── src/
│   │   ├── index.ts                ← Express server (port 5203)
│   │   ├── database.ts             ← Schema creation + seeding (initialiseDatabase(dbPath?))
│   │   ├── migrate.ts              — Schema migration (add new tables)
│   │   ├── types.ts                — Goal, User, Account, Transaction, Tag
│   │   ├── sql.ts                  — SQL query constants
│   │   ├── seed.ts                 — Standalone re-seed script
│   │   ├── seed-analytics.ts       — Analytics historical data seeder
│   │   ├── seed-engagement.ts      — Deterministic engagement demo data (focus goal, streaks)
│   │   ├── demo-reset.ts           — Full deterministic demo reset (npm run demo:reset)
│   │   ├── analytics/
│   │   │   ├── analytics.types.ts        — Type definitions
│   │   │   ├── analytics.repository.ts   — SQL queries
│   │   │   ├── analytics.service.ts      — Business logic
│   │   │   ├── analytics.routes.ts       — API routes
│   │   │   └── activity.routes.ts        — Activity feed route
│   │   ├── engagement/
│   │   │   ├── engagement.types.ts       — Type definitions
│   │   │   ├── engagement.repository.ts  — SQL queries
│   │   │   ├── engagement.service.ts     — Streak/consistency/achievements logic
│   │   │   ├── engagement.routes.ts      — API routes
│   │   │   └── checkin.ts                — Daily check-in qualification
│   │   ├── reports/
│   │   │   ├── report.types.ts           — ReportSnapshot + share types
│   │   │   ├── report.repository.ts      — SQL queries
│   │   │   ├── report.service.ts         — Snapshot assembly + share tokens
│   │   │   ├── report.validation.ts      — Builder input validation
│   │   │   ├── report.pdf.ts             — Server-side pdfkit rendering
│   │   │   └── report.routes.ts          — API routes + shared public endpoints
│   │   ├── routes/
│   │   │   ├── index.ts            — Route mount (goals + analytics + activity + engagement + reports)
│   │   │   └── goals.ts            — CRUD + progress tracking + activity logging + check-ins
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   └── validate.ts
│   │   └── __tests__/
│   │       ├── goals.test.ts       — 13 CRUD tests (isolated test DB)
│   │       ├── reports.test.ts     — 20 reports tests (isolated test DB)
│   │       └── engagement.test.ts  — 23 engagement tests
├── web/                            ← FRONTEND — Vite + React 18 + Redux + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts              — Dev server (port 5173) + proxy to backend + PWA
│   ├── vitest.config.ts
│   ├── index.html
│   ├── public/
│   │   ├── pwa-192x192.svg
│   │   └── pwa-512x512.svg
│   ├── src/
│   │   ├── main.tsx                — React root + Redux Provider + shared report route
│   │   ├── App.tsx                 — Main app: shell + page routing + command palette
│   │   ├── index.css               — Global styles + dark mode overrides
│   │   ├── config.ts               — API root + user ID config
│   │   ├── types.ts                — Goal interface
│   │   ├── format.ts               — Shared currency/percent/date/deadline formatting
│   │   ├── theme.ts                — Design tokens (colors, spacing, typography, shadows)
│   │   ├── api/
│   │   │   ├── lib.ts              — Axios API client (CRUD)
│   │   │   ├── analytics.ts        — Analytics API client (summary, progress, goals, activity)
│   │   │   ├── engagement.ts       — Engagement API client (checkin, summary, calendar, …)
│   │   │   ├── reports.ts          — Reports API client (preview, generate, share, pdf)
│   │   │   └── __tests__/
│   │   │       └── reports.test.ts — 4 reports API tests
│   │   ├── store/
│   │   │   ├── index.ts            — Redux store (goals + theme)
│   │   │   ├── hooks.ts            — Typed dispatch/selector
│   │   │   ├── goalSlice.ts        — Goals state (fetch, create, update, delete)
│   │   │   ├── themeSlice.ts       — Theme mode (light/dark toggle)
│   │   │   └── __tests__/
│   │   │       └── goalSlice.test.ts  — 5 Redux tests
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── AppShell.tsx    — Sidebar (incl. consistency card) + top bar + shell
│   │   │   ├── charts/
│   │   │   │   ├── ChartSkeleton.tsx           — Shimmer skeleton for charts
│   │   │   │   ├── SavingsTrendChart.tsx       — Recharts AreaChart
│   │   │   │   ├── GoalPerformanceChart.tsx    — Recharts horizontal BarChart
│   │   │   │   ├── PortfolioDistributionChart.tsx — Recharts PieChart
│   │   │   │   └── GoalHealthChart.tsx         — 4-card status grid
│   │   │   ├── engagement/
│   │   │   │   ├── ConsistencyCard.tsx    — Sidebar streak card
│   │   │   │   ├── ActivityHeatmap.tsx    — GitHub-style heatmap (30D/90D/1Y)
│   │   │   │   ├── WeeklyReview.tsx       — Weekly metrics with previous-week deltas
│   │   │   │   ├── NextBestActions.tsx    — WHAT/WHY/ACTION recommendation rows
│   │   │   │   ├── FocusGoalCard.tsx      — Overview focus goal card
│   │   │   │   ├── AchievementsSection.tsx — Unlocked/locked achievement tiles
│   │   │   │   └── EngagementSection.tsx  — Analytics engagement block
│   │   │   ├── report/
│   │   │   │   ├── ReportBuilder.tsx   — Builder form (period/scope/sections/title)
│   │   │   │   ├── ReportDocument.tsx  — Print-styled snapshot preview
│   │   │   │   ├── ReportHistory.tsx   — Stored report rows
│   │   │   │   └── ShareDialog.tsx     — Focus-trapped share link dialog
│   │   │   ├── GoalCard.tsx        — Goal card with inline balance update
│   │   │   ├── GoalManager.tsx     — Create/edit modal with emoji picker
│   │   │   ├── GoalDetail.tsx      — Slide-in detail drawer (scroll lock, set as focus)
│   │   │   ├── GoalIcon.tsx        — Emoji icon display
│   │   │   ├── EmojiPicker.tsx     — emoji-mart lazy-loaded picker
│   │   │   ├── DashboardChart.tsx  — SVG ring chart + distribution + timeline
│   │   │   ├── Skeleton.tsx        — Shimmer skeletons for cards
│   │   │   └── CommandPalette.tsx  — Ctrl+K command palette
│   │   ├── pages/
│   │   │   ├── AnalyticsPage.tsx   — Full analytics dashboard with charts + filters + engagement
│   │   │   ├── ActivityPage.tsx    — Activity feed with category filters + achievements
│   │   │   ├── ReportsPage.tsx     — Report builder + history + share + download
│   │   │   └── SharedReportPage.tsx — Public read-only shared report (404/410 states)
│   │   └── __tests__/setup.ts
│   └── dist/                       — Production build output
├── codelabs/                       — Original codelab instructions (unchanged)
├── tasks/                          — Task files (unchanged)
├── MEMORY.md                       ← This file
├── PROJECT_AUDIT.md                — Full repository audit (slightly stale)
├── PORTFOLIO_REPORT.md             — Portfolio report with screenshots
├── README.md                       — Project README with feature list
├── narrative.md                    — Original codelab narrative
├── package.json                    — prettier only
└── .prettierrc
```

---

## Database Schema

### Core tables (Phase 1)

```
users     (id, name, email, password, accountIds, goalIds, transactionIds)
goals     (id, name, targetAmount, targetDate, balance, created, accountId,
            transactionIds, tagIds, icon, userId)
accounts  (id, number, name, balance, accountType, transactionIds)
transactions (id, description, amount, transactionType, dateTime, goalId, tagIds, userId)
tags      (id, name)
```

### New tables (Phase 2)

```
goal_progress_history (id, goal_id FK, amount, recorded_at)
activities            (id, goal_id FK, type, metadata JSON, created_at)
```

### New tables (Phase 3)

```
reports       (id, title, configuration JSON, snapshot JSON, generated_at, updated_at)
report_shares (id, report_id FK, token_hash UNIQUE, created_at, expires_at, revoked_at, view_count)
```

### New tables (Phase 4)

```
user_checkins (id, user_id, activity_date, first_activity_at, last_activity_at,
               activity_count, types JSON, created_at, UNIQUE(user_id, activity_date))
focus_goal    (user_id PK, goal_id FK, updated_at)
achievements  (id, user_id, code, name, description, unlocked_at, UNIQUE(user_id, code))
```

### Indexes

```
idx_goals_userId, idx_transactions_userId, idx_transactions_goalId,
idx_progress_history_goalId, idx_activities_createdAt
```

---

## API Endpoints

### Core (Phase 1)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/Goal` | List all goals |
| GET | `/api/Goal/:id` | Get goal by ID |
| GET | `/api/Goal/ForUser/:userId` | Get goals for user |
| POST | `/api/Goal` | Create goal |
| PUT | `/api/Goal/:id` | Update goal (returns 204) |
| DELETE | `/api/Goal/:id` | Delete goal (returns 204) |
| GET | `/api/health` | Health check |

### Analytics (Phase 2)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/summary` | Aggregate KPIs (saved, target, progress, counts) |
| GET | `/api/analytics/progress` | Historical snapshots (filters: goalId, daysBack) |
| GET | `/api/analytics/goals` | Performance, health, distribution, deadlines |
| GET | `/api/analytics/health` | Health classification |
| GET | `/api/analytics/deadlines` | Upcoming deadlines |
| GET | `/api/analytics/distribution` | Portfolio distribution |
| GET | `/api/activity` | Activity feed (param: limit) |

### Engagement (Phase 4)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/engagement/checkin` | Record a daily check-in (type: VIEW_DASHBOARD, VIEW_GOAL, VIEW_ANALYTICS, CREATE_GOAL, UPDATE_GOAL, GENERATE_REPORT) |
| GET | `/api/engagement/summary` | Streak + activity summary (current/longest streak, weekly consistency, week days) |
| GET | `/api/engagement/calendar` | Heatmap data (range: 1–365 days) |
| GET | `/api/engagement/weekly-review` | This week vs previous week metrics |
| GET | `/api/engagement/actions` | Rule-based next best actions (max 3) |
| GET | `/api/engagement/achievements` | Achievement catalogue with unlock state |
| GET | `/api/focus-goal` | Get the current focus goal |
| PUT | `/api/focus-goal` | Set the focus goal (rejects missing/completed goals) |

### Reports (Phase 3)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/reports/preview` | Build a snapshot without persisting |
| POST | `/api/reports` | Generate + persist immutable report |
| GET | `/api/reports` | Report history (metadata + share status) |
| GET | `/api/reports/:id` | Retrieve stored snapshot |
| GET | `/api/reports/:id/pdf` | Stream PDF (from stored snapshot) |
| POST | `/api/reports/:id/share` | Create share link (expiresInDays: 1/7/30/null) |
| GET | `/api/reports/:id/shares` | List share links |
| DELETE | `/api/reports/:id/shares/:shareId` | Revoke share link |
| GET | `/api/shared/reports/:token` | Public read-only report (rate-limited, 404/410 semantics) |
| GET | `/api/shared/reports/:token/pdf` | Public PDF download (rate-limited) |

### Health classification rules
- `balance >= targetAmount` → **completed**
- `daysUntilDeadline < 0` → **overdue**
- `daysUntilDeadline <= 14` OR `(daysUntilDeadline <= 30 AND progress < 50%)` → **attention**
- Otherwise → **on_track**

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Node.js/Express (not .NET) | .NET SDK not available; Node.js v24 available |
| SQLite (not MongoDB) | Zero-install, file-based, portable for demos |
| styled-components | CSS-in-JS with design token system |
| emoji-mart v3 | Matches original codelab spec |
| Recharts | Mature React charting library, no heavy dependencies |
| Vite | Fast dev server, PWA plugin support |
| Port 5203 backend | Consistent with original codelab spec |
| Port 5173 frontend | Vite default with proxy to 5203 |

---

## What's Done

- [x] Backend Express server with full CRUD API
- [x] SQLite database with schema + seed data
- [x] Analytics backend (summary, progress history, health, distribution, deadlines)
- [x] Activity tracking (5 event types, automatic on goal changes)
- [x] Historical progress seed data for 6 demo goals
- [x] Application shell with sidebar + top bar + 4-page routing
- [x] Goal card redesign with inline balance update
- [x] Goal detail drawer with focus trapping + share link
- [x] Dashboard chart (SVG ring + progress distribution + completion timeline)
- [x] 4 Recharts chart components (area, bar, pie, health grid)
- [x] Analytics page with KPI row, filters, charts, deadlines
- [x] Activity page with type/goal filters + auto-refresh
- [x] Shimmer skeleton loaders for all charts
- [x] Command palette (Ctrl+K) with navigation + actions
- [x] Dark mode throughout all pages and charts
- [x] Responsive layout (sidebar collapse, mobile overlay)
- [x] PWA service worker + manifest
- [x] Search + sort toolbar
- [x] Toast notifications
- [x] 13 backend tests passing
- [x] 5 frontend tests passing
- [x] TypeScript 0 errors both projects
- [x] Production build succeeds
- [x] Demo data improved (6 goals with diverse progress levels)
- [x] Report Center (Phase 3): builder, preview, real PDF export, history, share links, public page
- [x] 20 backend reports tests passing (total 33)
- [x] 4 frontend reports tests passing (total 9)
- [x] Consistency & engagement (Phase 4): daily check-ins, server streak math, sidebar card, heatmap, weekly review, focus goal, next best actions, achievements, timeline categories
- [x] Engagement section inside Analytics Reports (preview + PDF + shared page)
- [x] Deterministic engagement demo seed (`seed-engagement.ts`)
- [x] 23 backend engagement tests passing (total 56)
- [x] Frontend 9 tests passing
- [x] Phase 5 polish: Overview hierarchy (KPIs → focus/actions → chart), Next Best Actions WHAT/WHY/ACTION, focus restore, scroll lock, heatmap today marker, achievement unlock dates
- [x] Phase 5 bugs fixed: GoalDetail Delete, ReportsPage share race, overdue wording, horizontal overflow at 338px, test-suite DB isolation (parallel-safe per-suite DBs)
- [x] `web/src/format.ts` shared formatting adopted app-wide
- [x] `npm run demo:reset` — deterministic recording state (goals, history, analytics, engagement)
- [x] 0px horizontal overflow at 338px; responsive to 320px

---

## What's Next (Not Yet Done)

- [ ] Analytics backend tests (summary calculation, health classification, activity creation)
- [ ] Per-goal activity timeline in GoalDetail drawer
- [ ] Weekly savings summary chart on ActivityPage
- [ ] Achievement toast on unlock when not visiting the Activity page
- [ ] Commit/push to git (all code is uncommitted)
- [ ] Deploy backend to Railway/Render
- [ ] Deploy frontend to Vercel/Netlify
- [ ] UI screenshot placeholders in PORTFOLIO_REPORT.md
- [ ] Goal reordering (drag-and-drop)
- [ ] Enhanced empty state illustrations for analytics page
- [ ] Error boundary component for chart failures

---

## Running the Project

```bash
# 1. Start backend (port 5203)
cd server
PORT=5203 npx tsx src/index.ts

# 2. Start frontend (port 5173) — in a separate terminal
cd web
npx vite

# 3. Open browser
open http://localhost:5173

# 4. Re-seed database (if needed)
cd server
npx tsx src/seed.ts          # Re-creates DB with schema + demo goals
npx tsx src/seed-analytics.ts # Adds historical progress + activity data
npm run demo:reset           # Full deterministic reset (schema + analytics + engagement)
#                            # Use demo:reset before recording — seeds focus goal + streaks
```

Pages:
- http://localhost:5173 — Overview (executive dashboard)
- Click **Goals** in sidebar — goal management grid
- Click **Analytics** in sidebar — full analytics page with charts
- Click **Activity** in sidebar — event feed with filters
- Press **Ctrl+K** — command palette

---

## Known Issues

1. **No analytics backend tests** — Only CRUD tests exist; analytics endpoints have no test coverage (reports tests do cover the analytics service indirectly)
2. **Database re-seed requires WAL file cleanup** — If `commbank.db-wal` or `commbank.db-shm` cause "resource busy" errors, delete them manually before re-seeding
3. **Goal filter in AnalyticsPage only affects existing data** — The filter applies client-side to fetched data; the backend `fetchProgressHistory` already filters by goal, but performance/health/distribution are filtered after fetching
4. **Modal stays light in dark mode** — `GoalManager` create/edit modal uses white background regardless of theme (intentional but could be improved)
5. **Command palette goal items just navigate to Goals page** — They don't open the specific goal's detail; that would require integration with the detail drawer state
6. **Lazy loaded emoji bundle is large** — `EmojiPicker.tsx` chunk is 572 KB (emoji-mart data); loaded on demand but still large
7. **Existing share links cannot be re-copied** — Only token hashes are stored (security), so older links can't be retrieved; the dialog explains "shown once at creation". Revoke always works
8. **Report History rows lack a direct Revoke action** — Revoke lives in the Share dialog per link; history shows Shared/Expires status badges
9. **Report preview is web-only styling** — PDF layout is generated separately server-side (pdfkit) by design; the two share the same snapshot data, not the same DOM
10. **No DELETE /api/reports/:id** — Reports are immutable; history cleanup isn't implemented (out of scope for this phase)
11. **Report heatmap is always the last 30 days** — `getCalendarWithCounts(30)` regardless of report period; intentional (a compact heatmap summary), but a 12-month report still shows a 30-day heatmap
12. **Achievement unlock toasts only surface via check-in responses** — if you unlock something from an API call other than check-in, the toast shows next time the Activity page's achievement list is fetched (achievements themselves are always persisted)
