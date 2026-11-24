import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  host: process.env.TALKREADY_HOST || '127.0.0.1',
  port: parseInt(process.env.TALKREADY_PORT, 10) || 3737,
  allowLan: process.argv.includes('--allow-lan'),
  dataDir: process.env.TALKREADY_DATA_DIR || (process.platform === 'win32'
    ? path.join(process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Local'), 'TalkReady')
    : path.join(process.cwd(), 'data')),
  staticDir: process.env.TALKREADY_STATIC_DIR || null,
};

// Ensure data directory exists
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

export const paths = {
  dbFile: path.join(config.dataDir, 'talkready.db'),
};
