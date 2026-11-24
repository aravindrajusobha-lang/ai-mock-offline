-- 001_init.sql (see specification) 
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id INTEGER PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at TEXT NOT NULL,
  absolute_expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS note_sets (
  id INTEGER PRIMARY KEY,
  owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  builtin_key TEXT UNIQUE,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('builtin','paste','txt','md','pdf')),
  original_filename TEXT,
  content_hash TEXT,
  char_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY,
  note_set_id INTEGER NOT NULL REFERENCES note_sets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chunks (
  id INTEGER PRIMARY KEY,
  note_set_id INTEGER NOT NULL REFERENCES note_sets(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  text TEXT NOT NULL,
  keywords_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY,
  note_set_id INTEGER NOT NULL REFERENCES note_sets(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  chunk_id INTEGER REFERENCES chunks(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('definition','explain_simple','example','why','compare','scenario','rapid_fire','interview_style')),
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  text TEXT NOT NULL,
  source_passage TEXT NOT NULL,
  key_points_json TEXT NOT NULL,
  hints_json TEXT NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN ('builtin','generated')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS interview_sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_set_id INTEGER REFERENCES note_sets(id) ON DELETE SET NULL,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  topic_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  question_count INTEGER NOT NULL,
  current_position INTEGER NOT NULL DEFAULT 1,
  rubric_version TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  finished_at TEXT,
  total_score INTEGER
);

CREATE TABLE IF NOT EXISTS session_answers (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL,
  source_passage TEXT NOT NULL,
  key_points_json TEXT NOT NULL,
  hints_json TEXT NOT NULL,
  hints_used INTEGER NOT NULL DEFAULT 0 CHECK (hints_used BETWEEN 0 AND 3),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','answered','skipped')),
  answer_text TEXT,
  score INTEGER,
  covered_json TEXT,
  missed_json TEXT,
  completeness_json TEXT,
  feedback_json TEXT,
  answered_at TEXT,
  UNIQUE (session_id, position)
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  report_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  checksum TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
