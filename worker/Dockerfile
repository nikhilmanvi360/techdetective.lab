# Worker Dockerfile
FROM node:20-slim

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

ENV NODE_ENV=production
# REDIS_URL will be provided by docker-compose

CMD ["npm", "start"]
