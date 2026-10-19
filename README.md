# Game Library

A personal game library: track what you own, what you are playing, and what you have finished.

Built with Next.js 16 (App Router, Cache Components), SQLite, and Drizzle ORM.

## Getting started

```bash
npm install
npm run db:seed   # optional: 5 sample games
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The database file lives at `data/game-library.db` and is created on first run. Schema
migrations are applied automatically when the server starts.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and type-check |
| `npm run db:generate` | Generate a migration after editing the schema |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Replace contents with sample data |
| `npm run db:studio` | Browse the database in Drizzle Studio |

## Changing the schema

Edit `src/db/schema.ts`, then generate and commit a migration:

```bash
npm run db:generate
```

Migrations are committed to `drizzle/` and applied at server startup, so a fresh
checkout needs no extra setup step.

## How it is put together

```
src/app/          pages, server actions, and page-level components
src/components/   reusable UI primitives
src/db/           schema, connection, queries, migrations
src/lib/          shared constants used by both client and server
drizzle/          generated SQL migrations
scripts/seed.ts   sample data
```

`src/components/` holds the primitives that dialogs and forms are built from, so an
affordance is defined once and reused: `Modal` and its `useModal` hook, `IconButton`,
`Field`/`FieldGroup`, `StarRating`, `StarPicker`, and `StatusBadge`. Adding and editing
a game are two configurations of the same dialog rather than two separate forms.

- `src/db/index.ts` opens a single `better-sqlite3` connection lazily, in WAL mode.
  It is lazy so that `next build` does not create the database as a side effect.
- `src/instrumentation.ts` runs migrations once at server startup.
- SQLite is a single-writer database. Run one instance; if you ever need horizontal
  scaling, move to Postgres or Turso.
- `better-sqlite3` is listed in `serverExternalPackages` so its native binding stays
  out of the bundle. Removing that breaks the build.
- The game list reads through `io()` to keep the query out of the static shell.

## Design

The interface follows a Steam Big Picture direction: cover art forward, large targets,
restrained motion. The palette is **Harbour Blue** — a deep navy ground lit by a single
cyan-blue accent. Every neutral sits inside one three-degree hue band (216-218°), so
the ramp reads as one blue rather than as grey surfaces with a blue button dropped on
them, and the accent stays under 70% saturation.

Tokens live in `src/app/globals.css` under `@theme`. Three rules keep it coherent:

- **One theme.** Dark only, on purpose. Do not reintroduce a light variant.
- **One accent.** `--color-accent-strong` for fills, `--color-accent` for borders and
  hover. Nothing else is coloured except two documented exceptions: the destructive
  confirm, and the `--color-status-*` circles. Status colour is data rather than
  decoration — it repeats the badge's `aria-label`, which is the accessible source —
  and every pair is measured to carry a white glyph at AA or better. Those numbers are
  recorded next to the tokens; re-measure before changing either side.
- **Solid surfaces, atmospheric depth.** Every surface and control is a flat token, so
  its contrast stays measurable. Depth comes from one vertical background falloff plus
  a 3.5% grain overlay. Do not put gradients on controls or fills: the documented
  contrast numbers stop meaning anything once a glyph can land anywhere on a ramp.


Contrast is documented inline and passes WCAG AA. Every CSS transition is gated behind
`motion-reduce`. Icons come from `@phosphor-icons/react`; do not hand-roll SVGs. Server
components must import them from `@phosphor-icons/react/dist/ssr` — the default entry
point calls `createContext` and throws when rendered on the server.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_PATH` | `./data/game-library.db` | SQLite file location |
| `MIGRATIONS_PATH` | `./drizzle` | Directory migrations are read from |

## Docker

A `Dockerfile` and `docker-compose.yml` are included but currently parked while local
development is the focus.

```bash
docker compose up --build
```

The image runs as a non-root user and stores the database on a named volume at `/data`.
Set `BUILD_STANDALONE=1` to produce the standalone output the Dockerfile expects;
`npm run build` on its own does not, because standalone output is incompatible with
`next start`.
