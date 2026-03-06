# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Install PM2
RUN npm install -g pm2

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built assets and server code from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Create data directories
RUN mkdir -p server/data server/uploads

# Expose port
EXPOSE 4000

# Runtime health check for orchestrators and deployment verification
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start server
CMD ["pm2-runtime", "server/index.js"]
