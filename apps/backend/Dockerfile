# ─────────────────────────────────────────────
# Stage 1 — deps
# Install production dependencies only
# ─────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./

# Install all deps (including dev — needed for prisma generate + build)
RUN pnpm install --frozen-lockfile

# ─────────────────────────────────────────────
# Stage 2 — build
# Compile TypeScript and generate Prisma client
# ─────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for linux/alpine target
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN pnpm exec prisma generate

# Compile NestJS
RUN pnpm build

# Prune dev dependencies for the final image
RUN pnpm prune --prod

# ─────────────────────────────────────────────
# Stage 3 — runner (production image)
# ─────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Security: create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copy pruned node_modules + compiled output
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma

# Prisma client binaries (re-generated for linux target)
COPY --from=build --chown=nestjs:nodejs /app/node_modules/.pnpm /app/node_modules/.pnpm 2>/dev/null || true

USER nestjs

EXPOSE 3000

# Docker-native healthcheck — hits the /api/v1/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main"]
