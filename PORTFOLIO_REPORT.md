# Portfolio Report — CommBank Goal Tracker

> **Date**: 2026-07-28
> **Author**: Portfolio transformation completed

---

## 1. Project Overview

A full-stack financial goal tracking application originally sourced from CommBank engineering onboarding codelabs. The repository was initially a set of instructional materials (markdown codelabs, task files, seed data, and PDF mockups) with zero application source code. This transformation built a complete, production-quality full-stack application on top of those specifications.

**Goal**: Allow users to track financial goals with custom emoji icons, manage progress, and persist changes across sessions.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Node.js 24 + Express 4 + TypeScript 5 | REST API server |
| **Database** | SQLite via better-sqlite3 | Zero-install, portable persistence |
| **Frontend** | Vite 5 + React 18 + TypeScript 5 | SPA user interface |
| **State** | Redux Toolkit 2 + React-Redux 9 | Client-side state management |
| **Styling** | styled-components 6 + design tokens | Component-level CSS-in-JS |
| **Emoji** | emoji-mart 3.0.1 (lazy-loaded) | Emoji picker for goal icons |
| **HTTP** | Axios | Frontend API client |
| **Icons** | FontAwesome 6 | UI iconography |
| **Testing** | Vitest 4 + supertest | Backend + frontend test suite |

---

## 3. Architecture

```
┌─────────────┐     Axios HTTP      ┌──────────────┐     better-sqlite3     ┌─────────┐
│   Vite SPA  │ ──────────────────> │  Express API │ ────────────────────> │ SQLite  │
│  (React 18) │ <────────────────── │  (port 5203) │ <──────────────────── │  (file)  │
│  port 5173  │     JSON responses   │              │                       │         │
└─────────────┘                      └──────────────┘                       └─────────┘
       │                                    │
       │ Redux store                        │ CRUD routes
       │ (goals + theme)                    │ (7 endpoints)
       │                                    │
       ▼                                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Components: GoalCard, GoalManager, GoalIcon, EmojiPicker   │
│  Features: Search, Sort, Create, Edit, Delete, Dashboard    │
│  Design: Dark mode, Responsive grid, Urgency badges, Toasts │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Existing Baseline Functionality

The following features were present before the portfolio transformation (from a prior implementation session, not part of this work):

- ✅ Express server with SQLite database and CRUD API routes
- ✅ React app with Redux store, GoalCard, GoalManager components
- ✅ Emoji picker integration (emoji-mart) for goal icons
- ✅ Goal editing via modal with icon, name, amount, date fields
- ✅ Basic loading, empty, and error states
- ✅ Responsive CSS grid layout
- ✅ Toast notification system
- ✅ Design tokens (colors, spacing, typography, shadows)

---

## 5. Features Implemented During This Transformation

### Phase 2 — UI/UX Upgrade
| Feature | Description |
|---------|-------------|
| **Summary Dashboard** | 4 stat cards showing total goals, total saved, total target, average progress |
| **Search/Filter** | Real-time search bar that filters goals by name with live count |
| **Dark Mode Toggle** | Moon/sun button in header using Redux themeSlice |
| **Urgency Badges** | Color-coded pill badges: "Overdue!", "Due tomorrow", "3mo left", ">1y left" |
| **Relative Dates** | Human-readable remaining time on goal cards |
| **Smart Progress Colors** | Progress bar gradient changes by completion level (red → amber → blue → green) |
| **Form Validation** | Inline validation with error messages, red borders, ARIA attributes |
| **Dirty State Detection** | Tracks unsaved changes with confirm-before-close dialog |
| **Retry on Error** | Error state includes a retry button to re-fetch data |
| **Footer** | Subtle attribution footer |
| **Backdrop Blur** | Modal overlay with blur effect |
| **Empty State CTA** | Empty state includes "Create Your First Goal" button |

### Phase 3 — Engineering Improvements
| Improvement | Description |
|-------------|-------------|
| **Code-Split Emoji Picker** | Lazy-loaded emoji-mart via `React.lazy()` + `Suspense`; main bundle reduced from 894 KB → 344 KB |
| **Graceful Server Shutdown** | SIGINT/SIGTERM handlers close HTTP server + database cleanly, preventing EADDRINUSE |
| **Config Extraction** | `config.ts` with environment-aware values (VITE_API_ROOT, VITE_USER_ID) replaces hardcoded constants |
| **Hardcoded User ID Removed** | User ID moved from source to config (env variable with seed-data fallback) |
| **Hardcoded API Root Removed** | API URL moved from source to config (empty = Vite proxy) |

### Phase 4 — Portfolio-Level Features
| Feature | Description |
|---------|-------------|
| **Goal Creation** | "New Goal" button opens modal in create mode, validates fields, POST to API, adds to grid |
| **Goal Deletion** | "Delete Goal" button with confirm dialog, DELETE to API, removes from grid |
| **Goal Sorting** | Dropdown sort options: Newest, Name A-Z, Highest Target, Most Progress |

### Phase 5 — Testing
| Test Suite | Tests | Coverage |
|------------|-------|----------|
| **Backend API** | 13 tests | All CRUD endpoints: GET, GET by ID, GET for User, POST (valid + validation errors), PUT (success + 404), DELETE (success + 404), health check |
| **Frontend Redux** | 5 tests | `updateGoalRedux` reducer (add, update, preserve others), selectors (initial state, preloaded state) |

---

## 6. Build & Test Results

| Command | Result |
|---------|--------|
| `web/ tsc --noEmit` | ✅ Zero errors |
| `server/ tsc --noEmit` | ✅ Zero errors |
| `web/ vite build` | ✅ 1.74s |
| `web/ vitest run` | ✅ 5/5 pass |
| `server/ vitest run` | ✅ 13/13 pass |

### Bundle Size
```
Main chunk (eager):      344 KB  (reduced from 894 KB via code-splitting)
EmojiPicker chunk:       572 KB  (loaded only when picker opens)
CSS (main):                0.8 KB
CSS (EmojiPicker):         7.6 KB
```

---

## 7. Known Limitations

1. **Single-user mode** — User ID is hardcoded in config (no authentication)
2. **No CI/CD pipeline** — No GitHub Actions or automated deployment
3. **Database tied to real file** — Backend tests run against the real database (not isolated)
4. **No frontend component tests** — Only Redux slice tests exist, no React component tests
5. **Goal creation without initial balance** — New goals start at $0; no way to set initial progress
6. **No data visualization** — Only progress bars, no charts or graphs
7. **emoji-mart v3** — Uses an older version for compatibility with the original codelab spec

---

## 8. Future Improvements

### Short-term
- Add frontend component tests (React Testing Library)
- Add goal duplication feature
- Add pagination for many goals
- Add goal progress history

### Medium-term
- Add authentication (Auth0 or similar)
- Add multi-user support
- Add transaction feed for each goal
- Add goal sharing
- Set up CI/CD pipeline

### Long-term
- Migrate to a managed database (PostgreSQL via Supabase)
- Add data visualization (charts, trends)
- Add mobile app (React Native)
- Add goal reminders and notifications

---

## 9. Total Work Summary

| Category | Count |
|----------|-------|
| **Files Created** | 8 (`config.ts`, `vitest.config.ts` × 2, `goals.test.ts`, `goalSlice.test.ts`, `setup.ts`, `PORTFOLIO_REPORT.md`) |
| **Files Modified** | 8 (`App.tsx`, `GoalManager.tsx`, `GoalCard.tsx`, `GoalManager.tsx`, `GoalManager.tsx`, `goalSlice.ts`, `lib.ts`, `index.ts` (server), `theme.ts`, `package.json` × 2, `.gitignore` × 1) |
| **Backend Tests** | 13 |
| **Frontend Tests** | 5 |
| **TypeScript Errors** | 0 (both projects) |
| **Bundle Reduction** | 62% main chunk size reduction via code-splitting |

---

*Original repository: https://github.com/fencer-so/commbank-program.git — original codelab materials authored by Tag Ramotar (mramotar). Application code built as an independent implementation following the codelab specifications.*
