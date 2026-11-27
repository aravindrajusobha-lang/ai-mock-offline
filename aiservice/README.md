# TalkReady AI service (Node.js)

This folder contains the offline-first AI processing modules for TalkReady. It uses Node.js only and has no runtime npm dependencies. Its template, note-grounded question, scoring, feedback, interview, resume-text, and reporting paths work without an internet connection or a model. The modules do not store accounts, notes, sessions, or answers; the existing Express/SQLite backend remains responsible for persistence and authorization.

## Folder layout

```text
aiservice/
  src/
    core/          shared text normalization and ID helpers
    notes/         note parsing and chunking
    questions/     grounded and role-based question generation
    answers/       deterministic answer evaluation
    feedback/      coaching output
    interviews/    next question and follow-up selection
    performance/   score aggregation and reports
    resume/        resume text extraction and preparation
    models/        optional local model runner integration
    index.js       public module exports
    router.js      Express router factory
  tests/           Node built-in test runner tests
  package.json     scripts and Node version
  package-lock.json
  README.md
```

## Requirements and checks

- Node.js 24 or newer (same as `backend/package.json`).
- No `npm install` is needed for this folder.
- Run the module tests from PowerShell:

```powershell
cd aiservice
npm test
```

## Modules

| File | Responsibility |
|---|---|
| `src/notes/parser.js` | Text/Markdown cleanup, heading topics, stable chunks, basic resume profile extraction. PDF must be extracted to text by the caller first. |
| `src/questions/generator.js` | Note-grounded questions, role bank prompts, skills prompts, difficulty, duplicate avoidance and fewer-question explanations. |
| `src/answers/evaluator.js` | Repeatable expected-point coverage, source relevance, completeness, clarity and consistency scoring; coaching and typed-answer delivery metric availability. |
| `src/feedback/generator.js` | Strengths, weaknesses, improvement, answer outline and preparation steps. |
| `src/interviews/assistant.js` | Next-question selection, score-based difficulty adaptation and follow-up prompts. |
| `src/performance/report.js` | Aggregate score, topic scores, strengths, weaknesses and recommendations. |
| `src/resume/preparation.js` | Extracts basic skill/education/experience/project sections from text and tailors questions. |
| `src/models/manager.js` | Optional Ollama loopback status/inference for models already installed locally. It never downloads or pulls a model and rejects non-loopback URLs. |
| `src/router.js` | Express router factory for exposing service functions as APIs. |
| `src/index.js` | Public module exports for direct use by backend services. |

## Express integration

The repository's Express application can mount this router from a backend route module. `express` is passed in by the caller so this folder does not duplicate the backend's dependency:

```js
import { createAiRouter } from '../../aiservice/src/router.js';

export default function createAiRoutes(express) {
  return createAiRouter(express);
}
// Mount the returned router under /api/ai after the application's auth middleware.
```

Every API call should be authenticated and owned by the backend. Store interview sessions, generated questions, submitted answers, and reports in the existing SQLite tables. Keep `expectedAnswerPoints` server-side; omit it when returning questions to React.

## HTTP endpoints

Mount at `/api/ai`:

- `GET /health` — service mode and local model runner status.
- `POST /notes/parse` — `{ "text": "# SQL\\n\\nSQL is a language for querying data.", "format": "md" }`
- `POST /questions/generate` — `{ "chunks": [...], "role": "Backend Developer", "difficulty": "intermediate", "count": 5 }`
- `POST /answers/evaluate` — `{ "question": {...}, "answer": "...", "sourceText": "..." }`
- `POST /feedback` — `{ "evaluation": {...}, "context": { "topic": "SQL", "role": "Backend Developer" } }`
- `POST /interviews/next` — `{ "questions": [...], "answered": [...], "targetCount": 5 }`
- `POST /performance/report` — `{ "answers": [{ "question": {...}, "evaluation": {...} }] }`
- `POST /resume/prepare` — `{ "text": "...resume text...", "role": "Frontend Developer", "count": 5 }`
- `GET /models` — lists models already visible to local Ollama, if running.
- `POST /models/generate` — `{ "model": "installed-model-name", "messages": [{ "role": "user", "content": "..." }] }`

Question generation accepts counts 5, 10, or 15 and difficulty `beginner`, `intermediate`, or `advanced`. Model endpoints use only `http://127.0.0.1:11434` by default; `TALKREADY_LOCAL_MODEL_URL` may point to another loopback HTTP address. A model must already be installed in Ollama. The service does not run an install/pull command. If the runner is absent, template operations continue working.

## Offline use

The baseline uses built-in Node modules only, so no package install or model download is needed at runtime. If Ollama is added, install the model explicitly while preparing the machine and verify it is listed by `GET /models`; otherwise the deterministic path remains active. To verify offline, start the application with Wi-Fi disabled and exercise notes parsing, question generation, evaluation, feedback, and reporting. Ollama-backed inference is optional and should only be described as available after its local runner/model check succeeds.

## Scope and limitations

The included resume parser accepts extracted text and recognizes a basic skill vocabulary and common section labels; it is not a DOCX/PDF parser or a full resume entity model. PDF extraction should happen in the app's existing import flow. Evaluation is deterministic and more informative than a single keyword hit, but it is still a rubric-based local score, not human-level semantic judgment. Voice/delivery metrics are unavailable for typed answers. Model-based generation is optional and has not been enabled or tested against a specific local model by this module.
