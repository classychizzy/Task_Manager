# Multi-stage build for Task Manager App
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Update npm and install dependencies
RUN npm install -g npm@latest
RUN npm install --ignore-scripts

# Copy source code and config
COPY . .

# Build the app
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy built assets and production dependencies
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/docker.env ./

# Install only production dependencies
RUN npm install --only=production

# Create logs directory
RUN mkdir -p /data/app/logs && chown -R node:node /data/app

USER node

# Default environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_FILE=/data/app/logs/app.log

EXPOSE 3000

CMD ["npm", "run", "serve"]
