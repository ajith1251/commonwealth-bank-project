# 🎯 CommBank Goal Tracker

[![CI](https://github.com/ajith1251/commonwealth-bank-project/actions/workflows/ci.yml/badge.svg)](https://github.com/ajith1251/commonwealth-bank-project/actions/workflows/ci.yml)

A full-stack financial goal tracker that turns savings goals into a professional fintech product: goal management, executive analytics, report generation with real PDF export and secure sharing, plus consistency and engagement intelligence — all in one enterprise-style dashboard.

> **Portfolio Project** — Built on an existing onboarding codelab curriculum from CommBank. Original instructional materials authored by Tag Ramotar. Application code independently implemented with significant UI/UX, engineering, and feature improvements. This is **not** an official Commonwealth Bank product.

## 🎥 Project Demo

<video src="demos/demo-goal-tracker.mp4" controls width="100%"></video>

---

## 🖼 Demos

- **Overview** — KPI grid, focus goal, next best actions, progress visualization, goal overview
- **Goals** — cards with urgency badges, inline balance updates, detail drawer, create/edit with emoji picker
- **Analytics** — savings trend, goal performance, portfolio distribution, goal health, deadlines, engagement heatmap & weekly review
- **Activity** — filterable timeline (Goals / Milestones / Reports / Engagement) + achievements
- **Reports** — builder → preview → generate → download PDF → share read-only link

---

## ✨ Key Features

### 🎨 Product Polish (Phase 5 — final)
- **Information hierarchy** — Overview reordered: Financial KPIs → Focus Goal + Next Best Actions → Progress visualization → Goal overview
- **Next Best Actions** — each suggestion communicates WHAT (goal) / WHY (reason) / ACTION (Review Goal)
- **Shared format system** — single `format.ts` for currency, percent, dates and deadlines across dashboard, reports, PDF and shared pages
- **Reproducible demo** — `npm run demo:reset` restores a deterministic recording state (goals, history, engagement, focus goal)
- **Zero horizontal overflow** — flex/grid `min-width` root-cause fixes verified down to 320px
- **Drawer accessibility** — scroll lock, focus restored to triggering card, focus trap, Escape, set-as-focus-goal action
- **Report workflow** — post-generation banner with prominent Download PDF + Share; distinct expired / invalid shared-link states

### 🔥 Consistency & Engagement (Phase 4)
- **Daily Check-Ins** — Meaningful activity (view dashboard/goal/analytics, create/update goal, generate report) earns one check-in per local day; refreshes never inflate the streak
- **Streak Intelligence** — Server-authoritative current & longest streaks, weekly consistency, active-day counts (week/month/all-time), with a compact sidebar consistency card
- **Activity Heatmap** — GitHub-style 30D/90D/1Y heatmap with accessible per-day tooltips
- **Weekly Review** — Real this-week metrics (active days, goals reviewed/updated, progress added, milestones, reports) compared with the previous week
- **Focus Goal** — One persisted focus goal displayed prominently on Overview
- **Next Best Actions** — Deterministic rule-based suggestions (deadline, near-completion, not-reviewed, completed, attention) — no AI, no financial advice
- **Achievements** — 8 restrained achievements earned from real events, shown on the Activity page
- **Timeline Categories** — Filter activity by All / Goals / Milestones / Reports / Engagement
- **Reports Integration** — Optional "Consistency & Engagement" section inside analytics reports (preview, PDF and shared page)

### 📄 Report Center (Phase 3)
- **Report Builder** — Configure period (30d / 90d / 6m / 12m / all / custom), goal scope, and include/exclude report sections
- **Report Preview** — Print-styled document rendered from a single immutable snapshot
- **Real PDF Export** — Server-side pdfkit generation (no browser): A4, charts, tables, page numbers, footer
- **Report History** — Persisted snapshots with View / Download PDF / Share actions
- **Secure Sharing** — 256-bit random tokens, SHA-256 hashes only, expiration, revocation, view counts
- **Public Read-only Page** — `/shared/report/:token` with no private controls and a professional unavailable message

### 📊 Premium Dashboard
- **Summary Metrics** — At-a-glance stats: total goals, total saved, total target, average progress
- **SVG Ring Chart** — Overall progress visualization with saved vs. target amounts
- **Milestone Labels** — Progress states: Getting Started → Building Momentum → Halfway There → Almost There → Goal Achieved
- **Goal Cards** — Redesigned cards with icon, progress bar, remaining amount, urgency badge, and milestone label
- **Goal Detail Drawer** — Slide-in detail view with full goal info, progress, dates, and actions

### 💪 Goal Management
- **Create, Edit, Delete** — Full CRUD with real Express + SQLite backend
- **Emoji Icons** — Pick custom emoji icons for each goal using a lazy-loaded emoji picker
- **Smart Progress Tracking** — Color-coded progress bars (red → amber → blue → green) with remaining amount
- **Urgency Indicators** — Color-coded badges: overdue, due today, days left, weeks/months left, or "Achieved" at 100%
- **Skeleton Loading** — Shimmer skeletons for stats and cards while data loads
- **Empty States** — Thoughtful empty states for no goals and no search results

### 🎨 User Experience
- **Search & Sort** — Real-time search by name, sort by newest, name, highest target, or most progress
- **Dark Mode** — Intentionally designed dark theme with proper surface hierarchy, not inverted colors
- **Responsive Design** — Desktop (3 columns) → Tablet (2 columns) → Mobile (single column)
- **Toast Notifications** — Polished success/error feedback for all actions
- **Keyboard Navigation** — Full keyboard support with visible focus indicators
- **Accessible** — aria-labels, semantic elements, `prefers-reduced-motion` support

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vite 5, React 18, TypeScript 5, Redux Toolkit 2, styled-components 6, Axios |
| **Backend** | Node.js 24, Express 4, TypeScript 5, better-sqlite3 |
| **Testing** | Vitest 4, supertest |
| **Emoji Picker** | emoji-mart 3.0.1 (lazy-loaded, 572 KB split chunk) |
| **Icons** | FontAwesome 6 |

## 🏗 Architecture

```
React SPA (port 5173)  ←──Axios──→  Express API (port 5203)  ←──SQLite──→  Database (file)
```

- **API Proxy**: Vite dev server proxies `/api/*` to the backend
- **Code Splitting**: emoji-mart is lazy-loaded, reducing the main bundle from 894 KB → 344 KB
- **Graceful Shutdown**: Server handles SIGINT/SIGTERM, closing connections cleanly
- **Design Tokens**: All colors, spacing, typography, shadows defined in a single `theme.ts` file

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20
- npm >= 10

### Installation

```bash
# Clone the repository
git clone https://github.com/fencer-so/commbank-program.git
cd commbank-program

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../web
npm install
```

### Running the Application

```bash
# Terminal 1: Start the backend server (port 5203)
cd server
npm run dev

# Terminal 2: Start the frontend dev server (port 5173)
cd web
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Seeding the Database

The database is auto-seeded on first run from JSON files in the `data/` directory. To re-seed:

```bash
cd server
npm run seed
```

### Reproducible Demo State (recording mode)

Resets the database and seeds a deterministic demo state — goals at different progress levels, one completed goal, historical savings trend, a focus goal, an approaching deadline, a current streak with a missed day, achievements and recent activity:

```bash
cd server
npm run demo:reset
```

> Development-only script — resets `data/commbank.db`. No "demo mode" button exists in the production UI.

## 🧪 Running Tests

```bash
# Backend API tests (56 tests — CRUD + reports + engagement)
cd server
npm test

# Frontend tests (9 tests — Redux + report API helpers)
cd web
npm test

# TypeScript (strict, both projects)
cd server && npx tsc --noEmit
cd web && npx tsc --noEmit

# Production build
cd web && npm run build
```

## 📁 Project Structure

```
commbank-program/
├── server/                     # Express API backend
│   ├── src/
│   │   ├── index.ts           # Entry point + graceful shutdown
│   │   ├── database.ts        # SQLite schema + seed loader (isolatable DB for tests)
│   │   ├── routes/            # goals CRUD + route mounting
│   │   ├── analytics/          # KPIs, progress, performance, health, distribution
│   │   ├── engagement/         # check-ins, streaks, weekly review, actions, achievements
│   │   ├── reports/            # Report Center (types, service, PDF, routes)
│   │   ├── seed*.ts + demo-reset.ts  # deterministic demo/reset scripts
│   │   └── __tests__/         # API test suites (goals + reports + engagement)
│   └── vitest.config.ts
│
├── web/                        # Vite + React frontend
│   ├── src/
│   │   ├── App.tsx            # Main app: shell, routing, Overview, toasts
│   │   ├── format.ts          # Shared currency/percent/date formatting
│   │   ├── components/        # GoalCard, GoalManager, GoalDetail, engagement/*, report/*, charts/*
│   │   ├── pages/             # Analytics, Activity, Reports, SharedReport
│   │   ├── store/             # Redux: goals + theme slices
│   │   ├── api/               # Axios API clients (lib, analytics, reports, engagement)
│   │   ├── config.ts          # Environment-aware config
│   │   ├── theme.ts           # Design tokens
│   │   └── __tests__/         # Redux + API tests
│   └── vitest.config.ts
│
├── data/                       # Seed data (MongoDB Extended JSON format)
├── codelabs/                   # Original instructional materials
├── tasks/                      # Original task breakdown
├── PROJECT_AUDIT.md            # Phase 1 repository audit
├── PORTFOLIO_REPORT.md         # Full transformation report
└── narrative.md                # Original project story
```

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/Goal` | List all goals |
| `GET` | `/api/Goal/:id` | Get goal by ID |
| `GET` | `/api/Goal/ForUser/:userId` | Get goals for user |
| `POST` | `/api/Goal` | Create goal |
| `PUT` | `/api/Goal/:id` | Update goal |
| `DELETE` | `/api/Goal/:id` | Delete goal |
| `POST` | `/api/reports/preview` | Build report snapshot (no persistence) |
| `POST` | `/api/reports` | Generate + save an immutable report |
| `GET` | `/api/reports` | List report history |
| `GET` | `/api/reports/:id` | Get a stored report snapshot |
| `GET` | `/api/reports/:id/pdf` | Download report as PDF |
| `POST` | `/api/reports/:id/share` | Create a share link (24h/7d/30d/none) |
| `GET` | `/api/reports/:id/shares` | List share links |
| `DELETE` | `/api/reports/:id/shares/:shareId` | Revoke a share link |
| `GET` | `/api/shared/reports/:token` | Public read-only report |
| `GET` | `/api/shared/reports/:token/pdf` | Public PDF download |
| `POST` | `/api/engagement/checkin` | Record a daily check-in |
| `GET` | `/api/engagement/summary` | Streak + activity summary |
| `GET` | `/api/engagement/calendar` | Heatmap data (range: 1–365 days) |
| `GET` | `/api/engagement/weekly-review` | This week vs previous week |
| `GET` | `/api/engagement/actions` | Rule-based next best actions |
| `GET` | `/api/engagement/achievements` | Achievement catalogue + unlock state |
| `GET` | `/api/focus-goal` | Get the focus goal |
| `PUT` | `/api/focus-goal` | Set the focus goal |

## 📊 Test Results

```
Backend:   56 tests passed (13 CRUD + 20 Report Center + 23 Engagement)
Frontend:   9 tests passed (5 Redux + 4 report API helpers)
TypeScript: 0 errors (both projects, strict mode)
Build:      Vite production build green, PWA included
```

> Test suites run against an isolated in-memory/temp database — the real demo DB is never mutated by tests.

## 📄 License

Original repository: [fencer-so/commbank-program](https://github.com/fencer-so/commbank-program). Original instructional materials authored by Tag Ramotar. This project builds upon those materials with independent application code.
