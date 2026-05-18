# Production-ready Caprover Dockerfile for Next.js with Prisma SQLite
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated/client ./src/generated/client
COPY --from=builder /app/data ./data

EXPOSE 3000

# Generate client, sync schema, and start the Next.js server
CMD ["sh", "-c", "npx prisma generate && npx prisma db push --accept-data-loss && npm run start"]
