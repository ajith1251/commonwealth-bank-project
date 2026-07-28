# Project Audit — Phase 1

> **Date**: 2026-07-28
> **Auditor**: Automated repository analysis
> **Status**: Phase 1 complete — full repository inspected

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Name** | `commbank-codelabs` |
| **Full path** | `D:\commbank-program\commbank-program\` |
| **Origin** | Forked/cloned from `https://github.com/fencer-so/commbank-program.git` |
| **Description** | Codelab curriculum for onboarding interns at CommBank's Goal Tracker team, now with a full-stack implementation built on top |
| **Author (original)** | `mramotar` (Tag Ramotar) — 20 commits on `master` (Jun–Oct 2022) |
| **Purpose** | Teach interns to add emoji/icon support to financial goals across the full stack |

---

## 2. Project Structure

```
commbank-program/
├── .git/                          # Git history (20 commits, single `master` branch)
├── .gitignore                     # Ignores node_modules/
├── .prettierrc                    # Prettier config (single quotes, no semi)
├── package.json                   # Only dependency: prettier ^2.6.2
├── package-lock.json
├── narrative.md                   # Epic story from "Tagg the Tech Lead"
├── MEMORY.md                      # Session memory (from previous session)
├── PROJECT_AUDIT.md               # This file (updated)
├── models.pdf                     # Data model diagrams (binary, ~219 KB)
├── ui.pdf                         # UI mockups (binary, ~1.5 MB)
├── codelabs/
│   ├── 1_backend.md               # Backend epic: .NET/MongoDB tutorial
│   ├── 2_frontend.md              # Frontend epic: React/Redux/emoji-mart tutorial
│   ├── 3_backend_and_frontend.md  # Wire-up epic: PUT request + event handler
│   ├── 4_tests.md                 # Testing epic: xUnit coverage
│   └── 5_git.md                   # Git epic: branch, commit, push
├── tasks/
│   ├── 1_backend/                 # 9 task files (fork, MongoDB, model, Postman test)
│   ├── 2_frontend/                # 7 task files (fork, components, Redux, emoji-mart)
│   ├── 3_backend_and_frontend/    # 2 task files (PUT request, event handler)
│   ├── 4_tests/                   # 1 task file (xUnit test)
│   └── 5_git/                     # 4 task files (branch, commit, push)
├── data/
│   ├── Users.json                 # MongoDB Extended JSON: 1 user "Tag Ramotar"
│   ├── Goals.json                 # 4 goals (House, Tesla, London, NYC)
│   ├── Accounts.json              # 1 account "Tag's Goal Saver"
│   ├── Transactions.json          # 14 transactions (debits/credits)
│   └── Tags.json                  # 5 tags (Groceries, Restaurant, Income, Gas, Investment)
├── server/                        # ← APPLICATION CODE (untracked, local only)
│   ├── package.json               # Express + better-sqlite3 + TypeScript
│   ├── tsconfig.json              # Strict TS, ES2022 target, commonjs modules
│   ├── .gitignore                 # Ignores node_modules/, dist/, commbank.db
│   ├── node_modules/              # Dependencies installed
│   ├── data/
│   │   └── commbank.db            # SQLite database (seeded from JSON data)
│   ├── src/
│   │   ├── index.ts               # Express server entry point (port 5203)
│   │   ├── database.ts            # SQLite schema creation + seed data loader
│   │   ├── types.ts               # TypeScript interfaces (Goal, User, Account, etc.)
│   │   ├── sql.ts                 # SQL query constants
│   │   ├── seed.ts                # Standalone re-seed script
│   │   ├── routes/
│   │   │   ├── index.ts           # Route mount + health check endpoint
│   │   │   └── goals.ts           # Full CRUD router for /api/Goal
│   │   └── middleware/
│   │       ├── errorHandler.ts    # Global error + 404 handlers
│   │       └── validate.ts        # Validation rules (name, amount, date, icon, userId)
│   └── dist/                      # (gitignored, not present)
└── web/                           # ← APPLICATION CODE (untracked, local only)
    ├── package.json               # React 18 + Redux Toolkit + styled-components + emoji-mart
    ├── tsconfig.json              # Strict TS, ES2020, react-jsx
    ├── tsconfig.node.json         # Vite-specific TS config
    ├── vite.config.ts             # Vite dev server (port 5173) + proxy to backend
    ├── .gitignore                 # Ignores node_modules/, dist/
    ├── index.html                 # SPA entry point
    ├── eslint.config.js           # ESLint config
    └── src/
        ├── main.tsx               # React root + Redux Provider
        ├── App.tsx                # Main app: header, goals grid, toast notifications
        ├── index.css              # Global CSS reset + scrollbar/focus styles
        ├── theme.ts               # Design tokens (colors, spacing, typography, shadows, radii)
        ├── types.ts               # Goal interface (matches backend)
        ├── api/
        │   └── lib.ts             # Axios API client (fetchGoalsForUser, updateGoal)
        ├── store/
        │   ├── index.ts           # Redux store config
        │   ├── hooks.ts           # Typed dispatch/selector hooks
        │   ├── goalSlice.ts       # Goals state (fetch, update)
        │   └── themeSlice.ts      # Theme mode (light/dark)
        └── components/
            ├── GoalCard.tsx       # Goal display card with icon, progress bar
            ├── GoalManager.tsx    # Edit modal with emoji picker integration
            ├── GoalIcon.tsx       # Clickable emoji icon display
            └── EmojiPicker.tsx    # emoji-mart Picker wrapper
```

---

## 3. Technology Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| **Backend** | Node.js 24 + Express 4 + TypeScript 5 | ✅ Running on port 5203 |
| **Database** | SQLite via better-sqlite3 | ✅ Seeded and operational |
| **Frontend** | Vite 5 + React 18 + TypeScript 5 | ✅ Builds successfully |
| **State Management** | Redux Toolkit 2 + React-Redux 9 | ✅ Implemented |
| **Styling** | styled-components 6 | ✅ Design system with tokens |
| **Emoji Picker** | emoji-mart 3.0.1 | ✅ Integrated |
| **HTTP Client** | Axios | ✅ API layer |
| **Icons** | FontAwesome 6 (free-solid) | ✅ Used in UI |
| **Testing** | None configured | ❌ Not implemented |
| **Linting** | ESLint (web only) | ⚠️ Configured but not enforced |

---

## 4. Build & Compilation Status

| Command | Status | Notes |
|---------|--------|-------|
| `server/ npx tsc --noEmit` | ✅ Pass | Zero TypeScript errors |
| `web/ npx tsc --noEmit` | ✅ Pass | Zero TypeScript errors |
| `web/ npx vite build` | ✅ Pass | Builds in 1.16s |
| `server/ npx tsx src/index.ts` | ✅ Pass | Server starts on port 5203 |
| `GET /api/health` | ✅ 200 OK | Returns `{"status":"ok"}` |
| `GET /api/Goal` | ✅ 200 OK | Returns 5 goals (4 seeded + 1 test goal) |

### Build Output
```
dist/index.html                   0.59 kB
dist/assets/index-BWabnCs5.css    8.35 kB
dist/assets/index-R6RM1eYp.js   893.99 kB  (includes emoji-mart data)
```

> ⚠️ Note: The 894 KB JS bundle is large due to emoji-mart's embedded emoji data. Code-splitting or dynamic import would help.

---

## 5. Data Model (as implemented)

### Goal
| Field | TS Type | SQLite Type | Notes |
|-------|---------|-------------|-------|
| id | string | TEXT PK | UUID |
| name | string | TEXT NOT NULL | |
| targetAmount | number | REAL NOT NULL | |
| targetDate | string | TEXT NOT NULL | ISO string |
| balance | number | REAL DEFAULT 0 | |
| created | string | TEXT NOT NULL | ISO string |
| accountId | string \| null | TEXT | |
| transactionIds | string[] \| null | TEXT (JSON) | Stored as JSON string |
| tagIds | string[] \| null | TEXT (JSON) | Stored as JSON string |
| icon | string \| null | TEXT | The new emoji field |
| userId | string | TEXT NOT NULL | FK to users |

Other models (User, Account, Transaction, Tag) are defined in `types.ts` and have corresponding SQLite tables with appropriate foreign keys and indexes.

---

## 6. API Endpoints

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| `GET` | `/api/Goal` | ✅ | List all goals |
| `GET` | `/api/Goal/:id` | ✅ | Get goal by ID |
| `GET` | `/api/Goal/ForUser/:userId` | ✅ | Get goals for user |
| `POST` | `/api/Goal` | ✅ | Create goal (with validation) |
| `PUT` | `/api/Goal/:id` | ✅ | Update goal (with validation, returns 204) |
| `DELETE` | `/api/Goal/:id` | ✅ | Delete goal (returns 204) |
| `GET` | `/api/health` | ✅ | Health check |

### Validation Rules
- `name`: Required for POST, optional string for PUT (null check + type check)
- `targetAmount`: Optional, must be a non-negative number if provided
- `targetDate`: Optional, must be a valid date string if provided
- `userId`: Required for POST (string check)
- `icon`: Optional, must be string or null

---

## 7. API Data (from live server)

The server currently returns 5 goals (note: the original seed has 4, but a 5th "Test Goal" was created in a previous session):

1. **House Down Payment** — $100,000 target, $73,501.82 saved, icon: 🏠
2. **Tesla Model Y** — $60,000 target, $43,840.02 saved, icon: none
3. **Trip to London** — $3,500 target, $753.89 saved, icon: none
4. **Trip to NYC** — $800 target, $0 saved, icon: none
5. **Test Goal** — $5,000 target, $100 saved, icon: 🏠

---

## 8. Existing Application Functionality

### Implemented Features

- ✅ **Goal listing** — Fetches goals from API and displays in responsive card grid
- ✅ **Goal card display** — Shows emoji icon (5rem), name, target amount, target date, progress bar, saved amount
- ✅ **Goal editing modal** — Clicking a card opens a modal with fields: icon, name, target amount, target date
- ✅ **Emoji picker** — Click-to-open emoji-mart picker with light/dark theme support
- ✅ **Icon selection flow** — Add icon (if no icon exists) or change icon (click existing icon) → pick emoji → saves to Redux + API
- ✅ **Goal update persistence** — PUT request updates goal in database, confirmed working
- ✅ **Toast notifications** — Success/error toasts after saving icon or goal
- ✅ **Loading state** — Spinner while goals are fetching
- ✅ **Empty state** — Friendly message when no goals exist
- ✅ **Error state** — Error box when API fails
- ✅ **Responsive grid** — CSS grid with auto-fill, responsive padding
- ✅ **Keyboard accessibility** — Focus-visible outlines, keyboard event handlers on cards and icons
- ✅ **Progress bar** — Visual progress showing balance vs target
- ✅ **Dark mode support** — Theme slice with light/dark toggle (wired to emoji-mart)

---

## 9. Major Features (from codelab spec)

| Feature | Spec Status | Implementation Status |
|---------|-------------|----------------------|
| Fork backend repo | ✅ Done (in codelab spec) | ℹ️ Replaced with local implementation |
| MongoDB Atlas cluster | ✅ Done (in codelab spec) | ℹ️ Replaced with SQLite |
| C# Goal model with Icon field | ✅ Done (in codelab spec) | ℹ️ Replaced with TypeScript/Express |
| C# Goal controller (CRUD) | ✅ Done (in codelab spec) | ℹ️ Replaced with Express routes |
| Fork frontend repo | ✅ Done (in codelab spec) | ℹ️ Replaced with local Vite project |
| React Goal model with Icon | ✅ Done | ✅ Fully implemented |
| GoalCard display with icon | ✅ Done | ✅ Fully implemented |
| emoji-mart picker | ✅ Done | ✅ Fully implemented |
| GoalManager with icon editing | ✅ Done | ✅ Fully implemented |
| Conditional UI (has icon vs no icon) | ✅ Done | ✅ Fully implemented |
| PUT request to update goal | ✅ Done | ✅ Fully implemented (204 response) |
| Wire pickEmojiOnClick to API | ✅ Done | ✅ Fully implemented |
| xUnit tests | 📋 Specified but not done | ❌ Not implemented |
| Git branch/commit/push | 📋 Specified but not done | ❌ Not done (code is untracked) |

---

## 10. Git Status

| Aspect | Status |
|--------|--------|
| **Branch** | `master` |
| **Status** | Clean — up to date with `origin/master` |
| **Untracked** | `MEMORY.md`, `PROJECT_AUDIT.md`, `server/`, `web/` |
| **Remote** | `https://github.com/fencer-so/commbank-program.git` |
| **History** | 20 commits by `mramotar` (Jun–Oct 2022) — codelab materials only |
| **Local commits** | None — application code exists only as untracked files |

The original git history contains only instructional `.md` files, PDF assets, and JSON seed data. All application code (`server/`, `web/`) is **untracked and uncommitted**.

---

## 11. Existing Problems

### High Priority
1. **No test suite** — Zero tests exist despite being specified in codelab 4
2. **Code not version-controlled** — `server/` and `web/` directories are untracked; no branch, commits, or PR
3. **No CI/CD** — No GitHub Actions, linting, or automated checks
4. **Large JS bundle** — 894 KB main chunk (emoji-mart data included)
5. **Hardcoded user ID** — `TAG_USER_ID = '62a29c15f4605c4c9fa7f306'` hardcoded in `goalSlice.ts`

### Medium Priority
6. **EADDRINUSE on server restart** — Port 5203 is not freed if server crashes (no graceful shutdown)
7. **No form validation feedback** — The GoalManager form has no inline validation errors (empty name, negative amounts)
8. **Goal creation not implemented** — Only editing is possible through the UI; no "Create Goal" button
9. **Goal deletion not in UI** — DELETE endpoint exists but no delete button in the frontend
10. **No search/filter** — No way to search or filter goals by name
11. **No goal sorting** — Goals are displayed in whatever order the API returns them

### Low Priority
12. **Hardcoded API root** — `API_ROOT = ''` in `lib.ts` relies entirely on Vite proxy (non-Vite deployments would need this configured)
13. **CSS reset index in HTML** — The Vite entry is a module script, but `index.css` has a CSS reset that should be more comprehensive
14. **Mixed date handling** — `goalSlice.ts` doesn't normalize dates when fetching (frontend receives ISO strings)
15. **No loading state in GoalManager** — The "Saving…" state exists on Save button but not on emoji selection
16. **SQLite WAL files remain** — `commbank.db-shm` and `commbank.db-wal` accumulate; no cleanup on server shutdown

---

## 12. Missing Functionality

| Missing | Impact |
|---------|--------|
| **Goal creation** | User cannot add new goals through the UI |
| **Goal deletion** | User cannot remove goals |
| **Search/filter** | No way to filter a growing list of goals |
| **Sorting** | Goals appear in insertion order only |
| **Form validation** | Empty names or invalid amounts are silently accepted |
| **Authentication** | Multi-user flow not implemented; hardcoded userId |
| **Persistent theme** | Dark mode toggle exists in Redux but no UI button to switch |
| **Data visualization** | Only a progress bar; no charts or graphs |
| **Transaction integration** | Transaction data exists but isn't shown in the UI |
| **Account display** | Account data exists in the database but isn't surfaced |
| **Error recovery** | No retry mechanism on API failure |
| **Accessibility audit** | Basic keyboard support exists but no aria-live regions, no skip-nav |

---

## 13. UI/UX Assessment

### Strengths
- Clean, modern gradient header with subtle background pattern
- Consistent design tokens (colors, spacing, typography, shadows, radii)
- Responsive grid layout with proper breakpoints
- Card hover/active states with smooth transitions
- Progress bars with gradient fills and animated width
- Toast notification system for user feedback
- Loading spinner and empty state
- Focus-visible styling for keyboard users

### Weaknesses
- No goal search or sort controls
- No visual indication of goal urgency (approaching target date)
- No summary/dashboard view (total savings, remaining, etc.)
- Modal overlay lacks a clear close affordance (small "×" in corner)
- No confirmation dialog before closing a dirty form
- Progress bar only shows balance/target as simple text below
- Page title is hardcoded HTML — no dynamic document title
- No responsive behaviors beyond basic grid (no collapsible sections, no mobile nav)

---

## 14. Testing Status

| Aspect | Status |
|--------|--------|
| **Backend tests** | ❌ None — no test framework configured |
| **Frontend tests** | ❌ None — no test framework configured |
| **Integration tests** | ❌ None |
| **E2E tests** | ❌ None |
| **Test framework** | ⚠️ `server/package.json` has `"test": "echo 'Error: no test suite configured'"` |
| **TypeScript coverage** | ✅ Both projects compile with strict mode |
| **Build verification** | ✅ Web app builds successfully |

---

## 15. Opportunities for Meaningful Improvement

### Phase 2 — UI/UX Upgrade
- Add goal creation flow (new button + form)
- Add goal deletion (confirm + delete)
- Add search/filter bar
- Improve date handling (relative dates, urgency badges)
- Add a summary dashboard component (total saved, progress, count)
- Improve mobile responsiveness
- Add dark mode toggle button in UI
- Add form validation with inline error messages

### Phase 3 — Engineering Improvements
- Split large JS bundle (code-split emoji-mart)
- Extract hardcoded user ID to environment variable or auth
- Add graceful server shutdown handlers
- Improve error handling (retry logic, user-friendly messages)
- Add proper CSV/JSON date normalisation
- Add environment configuration (dev/prod API URLs)
- Add loading state on emoji save in GoalManager

### Phase 4 — Portfolio Features
- Goal creation/duplication
- Goal search and sort
- Goal statistics dashboard
- Transaction feed for each goal (showing contributions)
- Responsive design refinements

### Phase 5 — Testing
- Backend: Vitest/Jest with supertest for API route tests
- Frontend: Vitest + React Testing Library for component tests
- Coverage for: API calls, validation, Redux slices, component rendering

### Phase 6 — Final Verification
- Build check
- TypeScript compilation
- Runtime smoke test
- Responsive layout verification

### Phase 7 — Documentation
- PORTFOLIO_REPORT.md
- Enhanced README.md with setup, architecture, features

---

## 16. Constraints & Prerequisites

| Requirement | Status | Notes |
|-------------|--------|-------|
| Node.js | ✅ v24.18.0 available | |
| npm | ✅ 11.16.0 available | |
| Chrome | ✅ Installed | Available for browser testing |
| .NET SDK | ❌ Not installed | Original spec uses .NET 6+; replaced with Node.js |
| MongoDB | ❌ Not installed | Original spec uses MongoDB Atlas; replaced with SQLite |

---

## 17. Key Decisions (from previous session)

| Decision | Rationale |
|----------|-----------|
| Node.js/Express (not .NET) | .NET SDK not available; Node.js v24 available |
| SQLite (not MongoDB) | Zero-install, file-based, portable |
| styled-components (not raw CSS) | Matches codelab spec for CSS-in-JS |
| emoji-mart v3 (not v4+) | Matches codelab spec version |
| Vite (not CRA) | Fast, modern, recommended for React 18+ |
| Port 5203 for backend | Consistent with codelab spec (was .NET port) |
| Port 5173 for frontend | Vite default with proxy to 5203 |

---

## 18. Phase 1 Conclusion

The repository has been transformed from a pure instructional codelab repository into a functional full-stack application. The original git history (20 commits of codelab materials) remains intact and unmodified. The application code (`server/` and `web/`) exists as untracked local files.

Current state:
- **Backend**: Fully functional Express API with SQLite — **TypeScript compiles cleanly, server runs**
- **Frontend**: Fully functional React app with Redux and emoji-mart — **TypeScript compiles cleanly, builds successfully**
- **Testing**: ❌ Not implemented
- **Git**: ⚠️ Application code is untracked — no commits, branches, or PRs

The project is ready for meaningful improvements across UI/UX, engineering quality, feature completeness, and testing.

---

*Phase 1 audit complete. No application code was modified during this phase.*
