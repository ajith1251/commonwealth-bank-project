# 🎯 CommBank Goal Tracker

[![CI](https://github.com/ajith1251/commonwealth-bank-project/actions/workflows/ci.yml/badge.svg)](https://github.com/ajith1251/commonwealth-bank-project/actions/workflows/ci.yml)

A full-stack financial goal tracking application that lets users create, manage, and track progress toward their financial goals with custom emoji icons.

> **Portfolio Project** — Built on an existing onboarding codelab curriculum from CommBank. Original instructional materials authored by Tag Ramotar. Application code independently implemented with significant UI/UX, engineering, and feature improvements.

---

## ✨ Key Features

- **Goal Management** — Create, edit, and delete financial goals with name, target amount, and target date
- **Emoji Icons** — Pick custom emoji icons for each goal using a lazy-loaded emoji picker
- **Smart Progress Tracking** — Visual progress bars with color-coded completion levels (red → amber → blue → green)
- **Urgency Indicators** — Color-coded badges: "Overdue!", "Due tomorrow", "3mo left", ">1y left"
- **Search & Sort** — Real-time search by name, sort by: newest, name, highest target, most progress
- **Summary Dashboard** — At-a-glance stats: total goals, total saved, total target, average progress
- **Dark Mode** — Toggle between light and dark themes
- **Responsive Design** — Works on desktop and mobile with adaptive grid layout
- **Toast Notifications** — Success/error feedback for all actions

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

## 🧪 Running Tests

```bash
# Backend API tests (13 tests)
cd server
npm test

# Frontend Redux slice tests (5 tests)
cd web
npm test
```

## 📁 Project Structure

```
commbank-program/
├── server/                     # Express API backend
│   ├── src/
│   │   ├── index.ts           # Entry point + graceful shutdown
│   │   ├── database.ts        # SQLite schema + seed loader
│   │   ├── routes/goals.ts    # Full CRUD for /api/Goal
│   │   ├── middleware/         # Validation + error handling
│   │   └── __tests__/         # API test suite
│   └── vitest.config.ts
│
├── web/                        # Vite + React frontend
│   ├── src/
│   │   ├── App.tsx            # Main app with dashboard, search, sort
│   │   ├── components/        # GoalCard, GoalManager, GoalIcon, EmojiPicker
│   │   ├── store/             # Redux: goals + theme slices
│   │   ├── api/lib.ts         # Axios API client
│   │   ├── config.ts          # Environment-aware config
│   │   ├── theme.ts           # Design tokens
│   │   └── store/__tests__/   # Redux slice tests
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

## 📊 Test Results

```
Backend:  13 tests passed (CRUD + validation + error cases)
Frontend:  5 tests passed (Redux reducers + selectors)
TypeScript: 0 errors (both projects, strict mode)
Build:      1.74s (Vite production build)
```

## 📄 License

Original repository: [fencer-so/commbank-program](https://github.com/fencer-so/commbank-program). Original instructional materials authored by Tag Ramotar. This project builds upon those materials with independent application code.
