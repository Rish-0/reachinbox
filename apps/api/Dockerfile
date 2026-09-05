FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package files
COPY package.json package-lock.json tsconfig.base.json vitest.config.ts ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY apps/web/package.json apps/web/

RUN npm ci

# Copy source code
COPY packages/shared packages/shared
COPY apps/api apps/api

# Build shared package and API app
RUN npm run build -w packages/shared
RUN npm run db:generate -w apps/api
RUN npm run build -w apps/api

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

RUN npm ci --only=production

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/src ./packages/shared/src
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000
CMD ["npm", "run", "start", "-w", "apps/api"]
