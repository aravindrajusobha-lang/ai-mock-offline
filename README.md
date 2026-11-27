# AI Mock Offline

## Repository map

```text
ai-mock-offline/
  aiservice/       Node.js AI domain modules, Express router adapter, and tests
  backend/         Express application, SQLite schema, and backend documentation
  frontend/        React client location (frontend application scaffold is not present yet)
  README.md        repository entry point
```

The AI service stays separated from the application backend so its logic can be tested independently. The backend owns HTTP lifecycle, authentication, and persistence; the AI service accepts input and returns computed results. The current database schema is SQLite, so this repository is not yet MongoDB-based.

## Run AI service tests

```powershell
cd aiservice
npm test
```

See [aiservice/README.md](aiservice/README.md) for its modules, API adapter, and offline/model setup. See [backend/README.md](backend/README.md) for the current backend setup.
