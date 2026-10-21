<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent notes

`README.md` covers the product, design rationale, and deploy setup. This file is the short list of traps that are easy to hit.

## Verify

- No test suite and no formatter. `npm run lint` and `npm run typecheck` are the checks; typecheck runs `next typegen` first, so run it after adding routes.
- The owner checks the UI and runs builds. Don't start `npm run dev` or run `npm run build` unless asked.
- If a `globals.css` change does not appear in dev, restart `next dev` (clear `.next` if needed).

## Data and server

- SQLite runs through `better-sqlite3`, which is synchronous. The functions in `src/db/queries.ts` are sync; don't await them. `getDb()` connects lazily so a build does not create the database; keep `better-sqlite3` in `serverExternalPackages`.
- `src/db` is server-only. Client components may import its types with `import type`, never its functions.
- Schema changes: edit `src/db/schema.ts`, run `npm run db:generate`, and commit the generated `drizzle/*.sql`. `src/instrumentation.ts` applies migrations when the server starts. `npm run db:seed` deletes all games and inserts samples.
- `cacheComponents: true` (see `next.config.ts`). `src/app/page.tsx` calls `await io()` before the reads so they stay out of the static shell; removing it can bake data into the build. `listPlatforms` and `countByStatus` are cached per request.
- Mutations live in `src/app/actions.ts` as server actions. After writing, they call `refresh()` from `next/cache`, not `revalidatePath`.
- A `"use server"` module may only export async functions at runtime (type-only exports are erased). Put shared constants in `src/lib` (statuses, view vocabulary, platform icons, rating).
- Only `q` lives in the URL. Status, sort, direction, and grouping are client preferences stored in `localStorage["game-library:view"]`; don't move them into the URL.
- SteamGridDB searches run server-side in `src/app/artwork-actions.ts`. The key is write-only from the browser; `STEAMGRIDDB_API_KEY` overrides the value saved in Settings.
- Shared UI reads and mutates through `LibraryProvider` (`src/app/library-context.tsx`). Keep database imports in `src/app/server-library-provider.tsx`; the `/demo` route wires the same interface to `src/demo`. Don't call server actions directly from shared components.
- Form validation is shared by both backends in `src/lib/game-fields.ts` and `src/lib/platform-fields.ts`. Change the parser, not just one action.
- The demo is client-only: seed and localStorage live in `src/demo`; its original posters live in `public/demo`. The Vercel demo project deploys the `demo` branch with `DEMO_MODE=1`; `main` remains the SQLite app. `DEMO_MODE=1` rewrites `/` to `/demo` at build time and skips startup migrations; it is not a separate start command. Use `beforeFiles` for that rewrite — an array rewrite runs after `/` has already matched the page.

## UI

- Tailwind v4, configured through the Turbopack loader in `next.config.ts`; there is no `tailwind.config`. Theme tokens live in `src/app/globals.css` under `@theme` — use them instead of hardcoded colors.
- Reuse the primitives instead of restyling from scratch: `Button` (`components/button.tsx`), `TextField`/`Select`/`Field` (`field.tsx`), `FormFooter`/`FormError` (`form.tsx`), `DeleteButton`, `IconButton`, `Modal` + `useModal`, `CoverArt`. Top-bar dialog triggers use `app/top-bar-action.tsx`.
- The status list is the single source for the DB enum, labels, badge colors, filtering, and sort order (`src/lib/statuses.ts`). Platform icons are stored as keys from `src/lib/platforms.ts`, never component names.
- Dialogs are native `<dialog>` elements rendered by `Modal`. It owns the backdrop, Escape, scroll lock, and the nested-dialog close guard; don't replace it with a portal or add a second scroll lock.
- Visual language: Steam Big Picture / Harbour Blue — dark only, one accent (plus the documented status and danger colors), solid surfaces (no gradients on controls), square corners (only status badges are round), lucide stroked icons only, and all transitions behind `motion-reduce`. Contrast pairs are measured in `globals.css`; re-measure before changing a token.
- Progress is an integer 0–100. A tile hides the bar at 0 because 0 means untracked, not an empty bar.
