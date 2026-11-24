# TalkReady Backend

## Overview
This repo contains the **local** backend for TalkReady – a mock‑interview app that runs offline on a Windows laptop. It is built with Node.js (ESM), Express 5, and SQLite (better‑sqlite3).

## Prerequisites
- Node.js **>=24** (LTS)
- Windows PowerShell (all npm scripts are PowerShell‑compatible)

## Quick start (development)
```powershell
cd backend
npm install
npm run dev   # watches for changes and restarts automatically
```
The server will listen on `127.0.0.1:3737` by default.

## Production
```powershell
npm start   # runs src/server.js without watch
```
Use the `--open` flag to automatically open the default browser after the server starts:
```powershell
npm start -- --open
```

## Environment variables
| Variable | Description | Default |
|----------|-------------|---------|
| `TALKREADY_HOST` | Host to bind (loopback only unless `--allow-lan`) | `127.0.0.1` |
| `TALKREADY_PORT` | TCP port (0 = random for tests) | `3737` |
| `TALKREADY_DATA_DIR` | Directory where `talkready.db` lives | Windows: `%LOCALAPPDATA%\TalkReady` else `./data` |
| `TALKREADY_STATIC_DIR` | Optional folder for static assets (served after `/api`) | (none) |
| `TALKREADY_ALLOW_LAN` | Set via `--allow-lan` CLI flag to bind non‑loopback hosts | `false` |

## Scripts
- `npm start` – run production server
- `npm run dev` – start server with `node --watch`
- `npm test` – run unit/integration tests (node:test)
- `npm run admin:create` – create or promote an admin user (CLI)
- `npm run smoke` – end‑to‑end smoke test script
- `npm run verify:offline` – print offline checklist and run smoke test

## Folder layout
```
backend/
  src/               # application source
    app.js           # Express app factory
    server.js        # entry point (listens, prints JSON)
    config.js        # env loading & paths
    db/              # SQLite wrapper & migrations
      index.js
      migrate.js
      seed.js
    middleware/      # security & error handling
      auth.js
      hostGuard.js
      originGuard.js
      rateLimit.js
      errors.js
    routes/          # API routers
      health.js
      auth.js
      admin.js
      notes.js
      topics.js
      interviews.js
      reports.js
    services/        # business logic
      passwords.js
      sessions.js
      noteImport.js
      questionGenerator.js
      interviewEngine.js
      scoring.js
      feedback.js
    repos/           # thin data‑access layers
      users.js
      notes.js
      topics.js
      questions.js
      interviews.js
      reports.js
    nlp/             # simple NLP helpers
      stopwords.js
      stemmer.js
      patterns.js
  migrations/001_init.sql
  seed/               # built‑in note sets (populated by db/seed.js)
  scripts/create-admin.js
  scripts/smoke.mjs
  tests/helpers/server.js
  tests/helpers/noNetwork.js
  tests/**/*.test.js   # test suite (node:test)
  docs/plan.md
  docs/api.md
  docs/scoring.md
  docs/offline-check.md
  docs/api-examples.http
  docs/TalkReady.postman_collection.json
```

---

For detailed design decisions, see **`docs/plan.md`**.
