# Reel — cinematic movie & show tracker

Personal, local-first Next.js app that tracks what you've watched, rates it fast
(Loved / Liked / Meh / DNF), and suggests what to watch next using a hybrid of
TMDB's similar-titles and an LLM that explains *why* you'll like each pick.

Single-user. Runs entirely on your machine with a SQLite file.

## Stack

- Next.js 15 (App Router) + React 18 + TypeScript
- SQLite via Drizzle ORM (`better-sqlite3`), stored at `./data/app.db`
- Tailwind CSS — cinematic dark theme, Instrument Serif + Geist
- TMDB API for metadata, posters, streaming providers, similar titles
- Anthropic (Claude) or OpenAI (GPT) for recommendation ranking + reasoning
- Recharts for the stats dashboard

## Getting started

```bash
cp .env.local.example .env.local
# Fill in TMDB_API_KEY (required) and either ANTHROPIC_API_KEY or OPENAI_API_KEY

npm install --legacy-peer-deps
npm run db:migrate        # create SQLite schema
npm run seed              # import movielist.md into your library
npm run dev               # localhost:3000
```

Get a TMDB API key (v3, free) at <https://www.themoviedb.org/settings/api>.

## Features

- **Bucket ratings** — four expressive states instead of fiddly stars: Loved,
  Liked, Meh, Didn't Finish.
- **Watchlist** — everything you want to see, filterable by movies/shows.
- **Library** — everything you've rated, grouped by bucket.
- **Title pages** — backdrop hero, overview, runtime, genres, cast, streaming
  availability (US providers via TMDB/JustWatch), similar titles.
- **Show progress** — per-season episode tracker for TV.
- **Hybrid recommendations** — TMDB gathers candidates from your Loved & Liked
  titles; an LLM ranks them and writes a one-line "why you'll love this"
  reasoning. Cached for 24h.
- **Stats** — bucket distribution, top genres, decade breakdown, total runtime.
- **Search** — TMDB multi-search with instant results.
- **Free-form notes** — capture "Joel says top 5" style context per title.
- **Keyboard shortcuts** — `/` to search; `g h` home, `g w` watchlist, `g l`
  library, `g s` stats.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next in dev mode |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run db:migrate` | Create/update SQLite tables |
| `npm run seed` | Import `movielist.md` into your DB (idempotent) |

## Seeding from `movielist.md`

`scripts/seed.ts` parses three sections:

- **Favorites** → status `watched`, bucket `loved`
- **To Watch** → status `watchlist`, media hint `movie`
- **Shows to Watch** → status `watchlist`, media hint `tv`

It also splits trailing ` - note` into the entry's `notes` field, so
"Waves - this movie will rip your heart out" preserves your note. Non-matches
(e.g. "Rafael nadal") are reported and skipped.

Re-running is safe — a unique index on `entries.title_id` prevents duplicates.

## Data & privacy

All data lives in `./data/app.db`. The TMDB API calls include only title
queries; LLM calls send your taste profile (loved titles, notes, genres) to
rank recommendations. Nothing leaves your machine except those outbound calls.

## Roadmap

- YouTube videos & channels as a new media type
- "Why you liked it" auto-tagging from notes
- Letterboxd / IMDB CSV import
- Mobile PWA polish
