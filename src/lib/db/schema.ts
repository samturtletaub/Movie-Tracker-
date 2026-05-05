import { sqliteTable, integer, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const titles = sqliteTable(
  "titles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: text("media_type", { enum: ["movie", "tv"] }).notNull(),
    title: text("title").notNull(),
    year: integer("year"),
    posterPath: text("poster_path"),
    backdropPath: text("backdrop_path"),
    overview: text("overview"),
    genresJson: text("genres_json"),
    runtime: integer("runtime"),
    numberOfSeasons: integer("number_of_seasons"),
    numberOfEpisodes: integer("number_of_episodes"),
    providersJson: text("providers_json"),
    tmdbVote: text("tmdb_vote"),
    lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
  },
  (t) => ({
    tmdbUnique: uniqueIndex("titles_tmdb_unique").on(t.tmdbId, t.mediaType),
  }),
);

export const entries = sqliteTable(
  "entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    titleId: integer("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["watchlist", "watched", "didnt_finish"],
    }).notNull(),
    bucket: text("bucket", { enum: ["loved", "liked", "meh", "dnf"] }),
    notes: text("notes"),
    priority: integer("priority").default(0),
    watchedAt: integer("watched_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    titleUnique: uniqueIndex("entries_title_unique").on(t.titleId),
    statusIdx: index("entries_status_idx").on(t.status),
  }),
);

export const showProgress = sqliteTable(
  "show_progress",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entryId: integer("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    season: integer("season").notNull(),
    episodesWatched: integer("episodes_watched").notNull().default(0),
    totalEpisodes: integer("total_episodes"),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    seasonUnique: uniqueIndex("show_progress_entry_season").on(t.entryId, t.season),
  }),
);

export const recsCache = sqliteTable("recs_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titleId: integer("title_id")
    .notNull()
    .references(() => titles.id, { onDelete: "cascade" }),
  reason: text("reason"),
  score: integer("score").notNull().default(0),
  generatedAt: integer("generated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  dismissedAt: integer("dismissed_at", { mode: "timestamp" }),
});

export type Title = typeof titles.$inferSelect;
export type NewTitle = typeof titles.$inferInsert;
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type ShowProgress = typeof showProgress.$inferSelect;
export type Rec = typeof recsCache.$inferSelect;
