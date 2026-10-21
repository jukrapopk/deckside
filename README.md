# Deckside

Deckside is a personal game library: track what you own, what is up next, what
you are playing, and what you have finished or dropped.

Built with Next.js 16 (App Router, Cache Components), SQLite, and Drizzle ORM.

## Getting started

```bash
npm install
npm run db:seed   # optional: 6 sample games
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The database file lives at `data/game-library.db` and is created on first run. Schema
migrations are applied automatically when the server starts.

## Demo

`/demo` is a client-only version of the library. It seeds a sample collection on
first visit and keeps games, platforms, and preferences in `localStorage`; the
route itself never opens SQLite. Use it locally at
[http://localhost:3000/demo](http://localhost:3000/demo).

For a Vercel demo deployment, set `DEMO_MODE=1` in the project environment. The
root URL then rewrites to `/demo`, and startup migrations are skipped. The demo
needs no database and uses the same build command; there is no separate start
command.

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
src/demo/         client-only localStorage demo and its seed
src/lib/          shared types, validation, and constants
drizzle/          generated SQL migrations
scripts/seed.ts   sample data
```

The library UI reads through `LibraryProvider` in `src/app/library-context.tsx`.
The SQLite app supplies server actions from `server-library-provider.tsx`; the
`/demo` route supplies the same interface from `src/demo/`. Both use the shared
form parsers in `src/lib`, so validation does not drift between them.

`src/components/` holds the primitives that dialogs and forms are built from, so an
affordance is defined once and reused: `Modal` and its `useModal` hook, `IconButton`,
`Field`/`FieldGroup`, `DialogForm`, `StarRating`, `StarPicker`, `StatusBadge`,
`CoverArt`, and `SubmitButton`. Adding and editing a game are two configurations of
the same dialog rather than two separate forms.

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
`motion-reduce`. Icons come from `lucide-react`; do not hand-roll SVGs, and do not add a
second icon library. They are stroked, never filled: a filled set mixes solid masses
(triangle, bookmark) with line marks (tick, X), and the light ones always look weak next
to the heavy ones. Uniform stroke width is what makes the set read as one family, so a
new icon inherits the stroke width rather than picking its own weight.

## Cover art

Art comes from [SteamGridDB](https://www.steamgriddb.com). Open **Settings** (the gear
next to the add button in the top bar) and paste an API key from the
[preferences page](https://www.steamgriddb.com/profile/preferences). Then, in the edit
dialog, search with the game's title and pick one of the portrait grids. The chosen CDN
URL is stored on the game; nothing is downloaded or re-hosted.

IGDB was the other candidate. It needs a Twitch client ID *and* secret plus a token
exchange and refresh, and returns a single official cover per game rather than a choice
— more moving parts for less of what this screen needs. Reach for it only if the library
ever wants IGDB's metadata.

A game with no art shows its initial on the tile surface. That is deterministic and
works offline, unlike the random photo service it replaced.

The key is stored in the `settings` table. `STEAMGRIDDB_API_KEY` overrides it and keeps
it out of the database file. Either way the browser never receives it: searches run in a
server action.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_PATH` | `./data/game-library.db` | SQLite file location |
| `MIGRATIONS_PATH` | `./drizzle` | Directory migrations are read from |
| `STEAMGRIDDB_API_KEY` | unset | Overrides the key saved in Settings |
| `ALLOWED_DEV_ORIGINS` | unset | Extra dev hosts, comma-separated (LAN/Tailscale) |
| `DEMO_MODE` | unset | Demo deploy: serve `/demo` at `/` and skip migrations |

Copy `.env.example` to `.env.local` for local Next development. Docker Compose
reads its variables from the shell or a `.env` file in the project root.

## Security and privacy

Deckside is a single-user local app and has **no authentication**. Keep it on
localhost, a trusted LAN, or a private Tailscale network; do not expose it to the
public internet.

By default the SQLite database lives under `data/` and is gitignored. It contains
your library and, unless you use `STEAMGRIDDB_API_KEY`, the SteamGridDB key in
plain text. Protect and back up the file like any other local secret.

The app has no analytics. Cover searches go to SteamGridDB from the server; the
browser only receives the resulting image URLs.

## Docker

A `Dockerfile` and `docker-compose.yml` are included but currently parked while local
development is the focus.

```bash
docker compose up --build
```

The image runs as a non-root user and stores `/data/deckside.db` on the
`deckside_data` volume. By default Compose publishes the port on `127.0.0.1`;
set `BIND_ADDRESS` to a private LAN or Tailscale address (or `0.0.0.0` on a
trusted network) to reach it from another device. Pass `STEAMGRIDDB_API_KEY`
through the environment to keep the key out of the database.

Set `BUILD_STANDALONE=1` to produce the standalone output the Dockerfile expects;
`npm run build` on its own does not, because standalone output is incompatible with
`next start`.

## License

MIT. See [LICENSE](LICENSE).
