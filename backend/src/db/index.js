import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { paths } from '../config.js';

// Open DB with required pragmas
export const db = (() => {
  const db = new Database(paths.dbFile);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');
  return db;
})();
