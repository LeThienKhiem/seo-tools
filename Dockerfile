# Node 22 LTS — node:sqlite available with --experimental-sqlite
FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Install su-exec for privilege dropping after chown
RUN apk add --no-cache su-exec

# Copy build artifacts (still owned by root)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

EXPOSE 3000

# Entrypoint: fix volume ownership (Railway mounts as root) then drop to nextjs
# Run as root so we can chown the mounted volume, then exec as nextjs.
CMD ["/bin/sh", "-c", "mkdir -p /app/data && chown -R nextjs:nodejs /app/data /app/.next && exec su-exec nextjs:nodejs node --experimental-sqlite node_modules/next/dist/bin/next start"]
