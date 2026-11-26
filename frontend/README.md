# TalkReady Frontend

TalkReady is a local-first React application. Vite bundles all frontend assets;
the browser calls the local Express backend through relative `/api/...` paths.
No CDN, hosted font, analytics, or external runtime API is used.

## Install

```powershell
cd frontend
npm install
```

Install dependencies once while connected. The build output is self-contained
and can then run with Wi-Fi off, as long as the local TalkReady backend is
running.

## Development

The Vite dev server proxies `/api` to `http://127.0.0.1:3737` by default:

```powershell
npm run dev
```

To use a different local backend address:

```powershell
$env:TALKREADY_BACKEND_URL = "http://127.0.0.1:3737"
npm run dev
```

## Production build and preview

```powershell
npm run build
npm run preview
```

Vite writes the production site to `frontend\dist`. The configured relative
asset base (`./`) allows Express to serve the build from its static directory.

## Serve `dist` from Express

Build the frontend, then start the backend with `TALKREADY_STATIC_DIR` pointing
to the generated folder:

```powershell
cd frontend
npm run build
cd ..\backend
$env:TALKREADY_STATIC_DIR = (Resolve-Path ..\frontend\dist).Path
npm start
```

Express serves the frontend after its `/api` routes, including the SPA fallback
for direct navigation to TalkReady routes.

## Manual testing checklist

- [ ] With Wi-Fi off and the local backend running, sign in, open notes, start
      and finish a practice session, and load its report.
- [ ] Logged-out users are redirected to `/login`; non-admin users cannot open
      `/admin`; admin users can view the user count.
- [ ] Import pasted notes; confirm the preview uses counts returned by the
      backend and the library refreshes.
- [ ] Import a `.txt` file and a `.md` file.
- [ ] Try empty pasted text, an empty file, and an unsupported file extension;
      confirm each is rejected with a clear message.
- [ ] In an interview, submit an answer, request each hint level, skip, finish,
      and rapidly activate submit to confirm requests are not duplicated.
- [ ] Confirm report score and coaching feedback match the backend response.
- [ ] Check history, progress values, preference persistence, and the
      confirmation prompt for deleting all data.
- [ ] Resize to a narrow window and navigate the forms, cards, and interview
      controls using only the keyboard.
