import Database from 'better-sqlite3';
import { GameState } from './types.js';

const db = new Database('stratcomm.db');

db.exec(`
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
`);

export function saveGame(game: GameState): void {
  db.prepare(
    `INSERT INTO games(id, state, updatedAt)
     VALUES(@id, @state, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET state=excluded.state, updatedAt=datetime('now')`
  ).run({ id: game.id, state: JSON.stringify(game) });
}

export function loadGame(id: string): GameState | null {
  const row = db.prepare('SELECT state FROM games WHERE id = ?').get(id) as { state: string } | undefined;
  return row ? JSON.parse(row.state) : null;
}
