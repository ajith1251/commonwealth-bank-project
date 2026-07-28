# Project Memory & Audit History

> Read this at session start for quick context.

---

## Session: 2026-07-28 (Latest)

**Status**: Scaffolding started — backend skeleton created, frontend not yet built

---

## Project Identity

| Field | Value |
|-------|-------|
| Name | commbank-codelabs |
| Purpose | CommBank Goal Tracker — full-stack onboarding project |
| Origin | Fork of `fencer-so/commbank-codelabs` (codelab curriculum) |
| Goal | Transform instructional materials into runnable portfolio app |

---

## Current Architecture

```
commbank-codelabs/
├── server/                  ← BACKEND (in progress)
├── web/                     ← FRONTEND (not yet created)
├── data/                    ← Seed JSON files (Accounts, Goals, Tags, Transactions, Users)
├── codelabs/                ← Codelab instructions (1_backend.md .. 5_git.md)
├── tasks/                   ← Task files for each epic
├── PROJECT_AUDIT.md         ← Full repository audit
├── MEMORY.md                ← This file
├── narrative.md             ← Project story & epic breakdown
├── ui.pdf                   ← UI mockups (binary, ~1.5 MB)
├── models.pdf               ← Data model diagrams (binary, ~219 KB)
├── package.json             ← prettier formatting only
└── .prettierrc
```

---

## Application Flow (Target State)

```
User opens web app
  └─> React loads GoalManager
       └─> Redux dispatch fetchGoals()
            └─> Axios GET /api/Goal/{userId}
                 └─> Express route → SQLite query
                      └─> Returns Goal[] JSON
       └─> GoalCard renders each goal
            └─> Displays icon (emoji), name, target, progress
       └─> User clicks icon → EmojiPicker opens
            └─> User selects emoji
                 └─> Redux dispatch updateGoal()
                 └─> Axios PUT /api/Goal/{goalId}
                      └─> Express route → SQLite update
```

---

## Data Model (from spec)

```
User       (id, name, email, hashedPassword)
Goal       (id, name, targetAmount, targetDate, balance, created,
            transactionIds, tagIds, icon, userId)
Account    (id, number, name, balance, type, transactionIds)
Transaction(id, description, amount, type, date, accountId, goalId)
Tag        (id, name)
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Node.js/Express backend (not .NET) | .NET SDK not installed; Node.js v24 available |
| SQLite database (not MongoDB) | Zero-install, file-based, portable for demos |
| React/TypeScript/Redux frontend | Matches codelab spec |
| Vite build tool | Fast, modern, recommended for React 18+ |

---

## What's Done

- [x] PROJECT_AUDIT.md created — full repository analysis
- [x] MEMORY.md created — history tracking
- [x] server/ directory created (empty, needs source files)

## What's Next

- [ ] Create server/ source files (package.json, tsconfig, Express routes, SQLite db)
- [ ] Scaffold web/ (Vite + React + TypeScript + Redux Toolkit)
- [ ] Phase 2: UI/UX Upgrade (design system, components, layout)
- [ ] Phase 3: Engineering improvements
- [ ] Phase 4: Portfolio-level features
- [ ] Phase 5: Testing
- [ ] Phase 6: Final verification
- [ ] Phase 7: Documentation

---

## Reference Links

- Upstream codelabs: `https://github.com/fencer-so/commbank-codelabs`
- Backend repo: `https://github.com/fencer-so/commbank-server`
- Frontend repo: `https://github.com/fencer-so/commbank-web`

## Build / Test Results

- Node.js v24.18.0, npm 11.16.0 available
- .NET SDK: NOT installed
- No application code built yet — nothing to test