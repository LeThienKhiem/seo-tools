# Use Node 22 LTS — includes node:sqlite (experimental flag required)
FROM node:22-alpine AS base

# Install dependencies in a separate stage for better caching
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build the Next.js app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production runtime — minimal image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create data directory for SQLite, owned by nextjs user
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data /app/.next

USER nextjs
EXPOSE 3000

# --experimental-sqlite required on Node 22.x for node:sqlite module
CMD ["node", "--experimental-sqlite", "node_modules/next/dist/bin/next", "start"]
