# TalkReady Backend Development Plan

## Overview
This document records the step‑by‑step plan for implementing the TalkReady local backend (Node.js + Express 5 + SQLite) according to the specification provided.  It will be updated as we progress through the required phases.

## Phase 0 – Scaffold, Config, DB, Core Middleware
| Item | Decision / Simplification | Reason |
|------|---------------------------|--------|
| **Package manager** | Use npm (no yarn) | Default on Windows, straightforward.
| **Node version** | `>=24` in `package.json` `engines.node` | Matches hard constraint.
| **ESM** | Set `"type":"module"` in `package.json` | Required by spec.
| **SQLite driver** | `better-sqlite3@9.4.3` (latest at time of writing) | Synchronous, no ORM, meets requirement.
| **Pragmas** | `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000`, `synchronous=NORMAL` set on every DB open. | Spec requirement.
| **Default data directory** | On Windows: `%LOCALAPPDATA%\TalkReady`; otherwise `./data` (relative to project root). | Matches spec; path built with `path.join`.
| **Host binding** | `TALKREADY_HOST` env var, default `127.0.0.1`. Reject non‑loopback unless `--allow-lan` flag present. | Spec.
| **Port handling** | `TALKREADY_PORT` env var, default `3737`. If port is in use, exit with error. Port `0` allowed for tests; we read the actual port from the listening event.
| **Static files** | If `TALKREADY_STATIC_DIR` points to an existing folder, serve it with `express.static` after the `/api` router, and add a fallback that returns `index.html` for non‑API GET requests.
| **Health route** | `GET /api/health` returns `{status:"ok"}`.
| **Error format** | JSON `{ "error": { "code": "<CODE>", "message": "<msg>", "details": … } }` for all errors.
| **Wildcard handling** | No `app.get('/*')`. Use explicit fallback middleware.
| **Host guard** | Middleware `hostGuard` returns **421** if `Host` header is not `localhost`, `127.0.0.1` or `[::1]` (with optional port).
| **Origin guard** | Middleware `originGuard` checks `Origin` header on mutating requests; mismatch → **403**.
| **Security headers** | `helmet` with CSP defined in the spec.
| **Body parser** | `express.json({limit:'1mb'})` only.
| **Logging** | No request bodies, passwords or cookies are logged.
| **Migrations** | Simple runner that reads `migrations/*.sql` sorted alphabetically, executes each inside a transaction, stores `version`, `checksum` (SHA‑256) and `applied_at` in `schema_migrations`. If checksum differs on a previously applied file, start‑up aborts.
| **Seed runner** | `db/seed.js` loads built‑in note sets from `seed/` using the `builtin_key` column; idempotent.
| **Server start JSON** | After listening, print a single line to stdout: `{"event":"listening","host":"127.0.0.1","port":3737}` (actual host/port values).
| **`--open` flag** | After the listening line, call `start "" http://<host>:<port>` on Windows via PowerShell `Start-Process`.
| **Graceful shutdown** | SIGINT/SIGTERM close the HTTP server *and* the SQLite DB connection.

## Phase 1 – Auth, Sessions, Roles, Admin
| Item | Decision / Simplification |
|------|---------------------------|
| Password hashing | Use `crypto.scrypt` with parameters `N=2^17`, `r=8`, `p=1`. Benchmark may exceed 600 ms on this machine; we will keep the defaults and note the actual time in `plan.md` after a quick test.
| Token storage | Store SHA‑256 of the generated 32‑byte token in `auth_sessions`. Token sent to client as cookie `talkready_sid` (HttpOnly, SameSite=Strict, Path=/).
| Sliding expiry | `expires_at` = now + 7 days, `absolute_expires_at` = now + 30 days. Update `last_seen_at` and `expires_at` on each request.
| Throttle | In‑memory map keyed by `${ip}:${email}`; 5 failures within 15 min → 429 with `Retry-After` header; exponential back‑off (`2^n` seconds).
| Admin script | `npm run admin:create -- --email <...> --name <...>` prompts for hidden password (uses `readline` with `mute-stdin`). Supports `--password-stdin` for CI.
| Admin stats route | `GET /api/admin/stats` returns `{ userCount: <number> }` – protected by `requireRole('admin')`.

## Phase 2 – Notes Import & Built‑in Bank
| Item | Decision |
|------|----------|
| Upload handling | Use `multer` with memory storage, max file size from config (default 1 MiB). |
| Supported extensions | `.txt` and `.md` only for Phase 2. |
| Validation error codes | As listed in the spec (e.g., `TEXT_TOO_LARGE`, `FILE_TOO_LARGE`, `UNSUPPORTED_FILE_TYPE`, etc.). |
| Built‑in note sets | Four sets (Java Basics, DBMS & SQL, HR Common Questions, Communication Basics) placed under `seed/notes/` with accompanying `questions/*.json`. |
| Seed idempotency | Use `builtin_key` column; on startup, `INSERT OR IGNORE` based on that key.

## Phase 3 – Interviews, Scoring, Reports
| Item | Decision |
|------|--------|
| RNG seeding | Use Node's `crypto.createHash('sha256')` on `noteSetId` + `sessionId` to produce a deterministic pseudo‑random integer stream for question selection and template choice.
| Scoring formula | Implement exactly as described; helper functions for coverage, completeness, raw score, multiplier, band.
| Feedback templates | Store a small array of strings per band; choose deterministically via same seeded RNG.
| Report persistence | Store JSON blob in `reports.report_json`.
| API endpoints | Follow spec (`POST /api/interviews`, `GET /api/interviews/:id`, `POST /api/interviews/:id/hint`, `POST /api/interviews/:id/answers`, `POST /api/interviews/:id/skip`, `POST /api/interviews/:id/finish`). |

## Phase 4 – Full Workflow, Docs, Smoke Script, Tests
| Item | Decision |
|------|--------|
| Smoke script | `scripts/smoke.mjs` will perform the full workflow using `node-fetch` (built‑in `fetch` in Node 24). It will exit with non‑zero status on any failure and print `PASS/FAIL` lines.
| Documentation | Write `README.md`, `docs/api.md`, `docs/scoring.md`, `docs/offline-check.md`, `docs/api-examples.http`, and generate a Postman collection JSON.
| Test helpers | `tests/helpers/server.js` spawns `node src/server.js` with env vars pointing to a temporary data dir (`os.tmpdir()`) and `PORT=0`. Reads the JSON listening line from stdout to know the assigned port.
| No‑network guard | `tests/helpers/noNetwork.js` monkey‑patches `net.Socket.prototype.connect` and DNS functions to throw if target is not loopback. |
| CI time budget | All tests must finish < 60 s on a clean Windows VM.

## Phase 5 – PDF Import (Deferred)
| Item | Decision |
|------|--------|
| Dependency | Will ask before adding any PDF extraction library (e.g., `pdfjs-dist`). |
| Limits | 10 MiB size, 100 pages, checks `%PDF-` header, rejects encrypted or unreadable PDFs with specific error codes.

---

**Next steps:**
1. Create the scaffold (package.json, .gitignore, .node-version, .env.example, basic folder tree). 
2. Implement config loading, DB connection with pragmas, migration runner, health route, error formatter, `hostGuard` & `originGuard`, static serving fallback.
3. Run `npm test` (currently no tests exist) to ensure the scaffold builds.

We will now start Phase 0 implementation.
