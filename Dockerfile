# syntax=docker/dockerfile:1

# ---------- build stage ----------
FROM node:22-slim AS builder

WORKDIR /app

# Enable corepack and pnpm
ENV COREPACK_ENABLE_AUTO_PIN=0
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy dependency manifests and patches first for layer caching
COPY package.json pnpm-lock.yaml .npmrc* ./
COPY patches ./patches

# Install all dependencies (including devDeps for build)
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .

# Build the production bundle (Vite + esbuild Node bundle)
ENV NODE_ENV=production
RUN pnpm build

# ---------- production stage ----------
FROM node:22-slim AS production

WORKDIR /app

ENV COREPACK_ENABLE_AUTO_PIN=0
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy only production manifests and install production deps
COPY package.json pnpm-lock.yaml .npmrc* ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile --prod

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist

# Create non-root user and switch
RUN groupadd -r nodeapp && useradd -r -g nodeapp nodeapp \
  && chown -R nodeapp:nodeapp /app
USER nodeapp

# Expose the default port (override with PORT env var at runtime)
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/healthz').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
