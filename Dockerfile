# -------------------------------------------------------------------
# Stage 1: Base minimal image (for runner)
# -------------------------------------------------------------------
FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl dumb-init && rm -rf /var/lib/apt/lists/*

# -------------------------------------------------------------------
# Stage 2: Build tools layer with Python & C++ compilers for native modules (argon2)
# -------------------------------------------------------------------
FROM base AS build-tools
RUN apt-get update -y && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# -------------------------------------------------------------------
# Stage 3: Development dependencies & Build
# -------------------------------------------------------------------
FROM build-tools AS builder
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=2048"
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate
COPY . .
RUN npm run build:only
RUN npx tsc prisma/seed.ts --outDir dist/prisma --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck

# -------------------------------------------------------------------
# Stage 4: Production dependencies only (compiled with build-tools)
# -------------------------------------------------------------------
FROM build-tools AS prod-deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev
RUN npm install prisma@6.19.1 --no-save
RUN npx prisma generate

# -------------------------------------------------------------------
# Stage 5: Minimal production runner (clean image, no build tools)
# -------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=prod
ENV PORT=3000

# Copy entrypoint script and make it executable
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

# Copy production node_modules (with compiled argon2), dist, and Prisma migrations
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node package*.json ./

# Switch to standard non-root user
USER node

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--", "/app/docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]