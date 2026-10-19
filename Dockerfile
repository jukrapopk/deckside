# syntax=docker/dockerfile:1

# ---- deps: install node_modules once, reused by build and runner ----
FROM node:22-alpine AS deps
WORKDIR /app
# better-sqlite3 ships prebuilt binaries, but the alpine (musl) build may need
# to compile, so keep the toolchain available in this stage only.
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the Next.js app ----
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner: minimal runtime image ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_PATH=/data/game-library.db
ENV MIGRATIONS_PATH=/app/drizzle

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /data \
  && chown nextjs:nodejs /data

# Standalone output contains the server plus only the traced node_modules,
# including the native better-sqlite3 binding.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Migrations are read at runtime by instrumentation.ts, so they must be present.
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

USER nextjs
EXPOSE 3000
VOLUME ["/data"]

CMD ["node", "server.js"]
