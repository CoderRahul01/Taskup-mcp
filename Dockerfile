# Stage 1: Build
FROM oven/bun:1.1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install

COPY . .
RUN bun x tsc

# Stage 2: Runtime
FROM oven/bun:1.1-alpine AS runner

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S mcp && adduser -S mcp -G mcp
USER mcp

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "dist/server/index.js"]
