import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

declare global {
  // eslint-disable-next-line no-var
  var __sqlite: Database.Database | undefined;
}

const sqlite =
  globalThis.__sqlite ??
  (() => {
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    return db;
  })();

if (process.env.NODE_ENV !== "production") {
  globalThis.__sqlite = sqlite;
}

export const sqliteInstance = sqlite;
export const db = drizzle(sqlite, { schema });
export { schema };
