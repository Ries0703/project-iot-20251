FROM node:25-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies first (caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the monorepo apps
RUN npx nest build api-service
RUN npx nest build consumer-service

# Production Stage
FROM node:25-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

# Copy built artifacts from builder
COPY --from=builder /usr/src/app/dist ./dist

# Expoose ports (API Service: 3000)
EXPOSE 3000

# Default command (will be overridden in docker-compose)
CMD ["node", "dist/apps/api-service/main"]
