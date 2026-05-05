import { sqliteInstance } from "./index";

const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS titles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie','tv')),
    title TEXT NOT NULL,
    year INTEGER,
    poster_path TEXT,
    backdrop_path TEXT,
    overview TEXT,
    genres_json TEXT,
    runtime INTEGER,
    number_of_seasons INTEGER,
    number_of_episodes INTEGER,
    providers_json TEXT,
    tmdb_vote TEXT,
    last_synced_at INTEGER DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS titles_tmdb_unique ON titles(tmdb_id, media_type)`,

  `CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('watchlist','watched','didnt_finish')),
    bucket TEXT CHECK (bucket IN ('loved','liked','meh','dnf')),
    notes TEXT,
    priority INTEGER DEFAULT 0,
    watched_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS entries_title_unique ON entries(title_id)`,
  `CREATE INDEX IF NOT EXISTS entries_status_idx ON entries(status)`,

  `CREATE TABLE IF NOT EXISTS show_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    episodes_watched INTEGER NOT NULL DEFAULT 0,
    total_episodes INTEGER,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS show_progress_entry_season ON show_progress(entry_id, season)`,

  `CREATE TABLE IF NOT EXISTS recs_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
    reason TEXT,
    score INTEGER NOT NULL DEFAULT 0,
    generated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    dismissed_at INTEGER
  )`,
];

for (const stmt of STATEMENTS) {
  sqliteInstance.exec(stmt);
}

console.log("✓ Database migrated. File:", "./data/app.db");
