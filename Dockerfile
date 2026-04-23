# Backend / Unified Server Dockerfile
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/cases ./cases

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["npx", "tsx", "server.ts"]
