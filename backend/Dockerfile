FROM node:20-alpine AS base

FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
# Hono/Node server typically needs dependencies for production run (unless bundled perfectly, but node_modules is safer for simplest setup)
# For a smaller image, we can prune devDependencies
RUN npm ci --omit=dev

EXPOSE 3000

CMD ["node", "dist/index.js"]
